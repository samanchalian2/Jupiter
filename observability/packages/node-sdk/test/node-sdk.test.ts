import { describe, expect, it, vi } from 'vitest';
import { NodeSdk } from '../src/index.js';
const app=crypto.randomUUID(),env=crypto.randomUUID();
const setup=(extra:Partial<ConstructorParameters<typeof NodeSdk>[0]>={})=>new NodeSdk({reportMetrics:false,applicationId:app,environmentId:env,endpoint:'https://hub.example.test/api/v1/observability',credentialProvider:async()=> 'placeholder',fallback:()=>{},...extra});
describe('Node capture/correlation/failure isolation',()=>{
  it('does not report policy exclusions after retry as loss or recovered delivery',async()=>{
    const time=vi.spyOn(Date,'now').mockReturnValue(Date.now());let offline=true;
    const sdk=setup({transport:async(_url,init)=>{if(offline)throw Error('Controlled outage');const batch=JSON.parse(String(init?.body));return Response.json({schemaVersion:'1.1',acknowledgements:batch.events.map((item:{eventId:string},index:number)=>({eventId:item.eventId,status:'REJECTED',reasonCode:['SAMPLING_EXCLUDED','SOURCE_DISABLED_BY_POLICY','INVALID_EVENT'][index]}))});}});
    try{for(let index=0;index<3;index++)sdk.captureException(Error('Synthetic policy fixture'));await sdk.flush();offline=false;time.mockReturnValue(Date.now()+300001);await sdk.flush();expect(sdk.stats()).toEqual({queued:0,dropped:1});expect(sdk.getMetricReport()!.counters).toEqual({dropped:1,retryDropped:1,retryDelivered:0});}finally{time.mockRestore();}
  });
  it('bounds every UTF-8 batch by bytes as well as event count without losing queued events',async()=>{
    const sizes:number[]=[],ids=new Set<string>(),sdk=setup({transport:async(_url,init)=>{const body=String(init?.body),batch=JSON.parse(body);sizes.push(new TextEncoder().encode(body).length);expect(sizes.at(-1)).toBeLessThanOrEqual(524288);expect(batch.events.length).toBeLessThanOrEqual(50);batch.events.forEach((event:{eventId:string})=>ids.add(event.eventId));return Response.json({schemaVersion:'1.1',acknowledgements:batch.events.map((event:{eventId:string})=>({eventId:event.eventId,status:'ACCEPTED'}))});}});
    for(let index=0;index<60;index++)expect(sdk.capture({category:'BACKEND',severity:'ERROR',eventCode:'large.batch',normalizedMessage:'آ'.repeat(1900),sanitizedStack:'f'.repeat(8000)})).not.toBeNull();
    for(let index=0;sdk.stats().queued&&index<5;index++)await sdk.flush();expect(sdk.stats().queued).toBe(0);expect(ids.size).toBe(60);expect(sizes.length).toBeGreaterThan(1);
  });
  it('reclaims the byte budget after retry exhaustion and undelivered shutdown',async()=>{
    const time=vi.spyOn(Date,'now').mockReturnValue(Date.now());
    const capture=(sdk:NodeSdk)=>sdk.capture({category:'BACKEND',severity:'ERROR',eventCode:'bytes.retry',normalizedMessage:'Controlled byte budget'});
    try{
      const sdk=setup({maxQueueBytes:400,transport:async()=>new Response('',{status:503})});
      expect(capture(sdk)).not.toBeNull();expect(capture(sdk)).toBeNull();
      for(let attempt=0;attempt<12;attempt++){await sdk.flush();time.mockReturnValue(Date.now()+300001);}
      expect(sdk.stats().queued).toBe(0);expect(capture(sdk)).not.toBeNull();await sdk.shutdown();
      const stopped=setup({maxQueueBytes:400,credentialProvider:async()=>null});expect(capture(stopped)).not.toBeNull();await stopped.shutdown();
      stopped.start();expect(capture(stopped)).not.toBeNull();expect(capture(stopped)).toBeNull();await stopped.shutdown();
    }finally{time.mockRestore();}
  });
  it('reclaims exact encoded queue bytes after terminal ACK and shutdown',async()=>{
    let mode='ACCEPTED';const sdk=setup({maxQueueBytes:800,transport:async(_url,init)=>{const batch=JSON.parse(String(init?.body));return Response.json({schemaVersion:'1.1',acknowledgements:batch.events.map((event:{eventId:string})=>({eventId:event.eventId,status:mode}))});}});
    const capture=()=>sdk.capture({category:'BACKEND',severity:'ERROR',eventCode:'bytes.test',normalizedMessage:'Controlled byte accounting'});
    for(const status of ['ACCEPTED','DUPLICATE','REJECTED']){mode=status;expect(capture()).not.toBeNull();expect(capture()).not.toBeNull();expect(capture()).toBeNull();await sdk.flush();expect(sdk.stats().queued).toBe(0);}
    expect(capture()).not.toBeNull();await sdk.shutdown();sdk.start();expect(capture()).not.toBeNull();await sdk.shutdown();
  });
  it('bounds metadata retry exhaustion without dropping or charging the retained user event',async()=>{
   const time=vi.spyOn(Date,'now').mockReturnValue(Date.now()),reports:unknown[]=[];const sdk=setup({reportMetrics:true,maxQueueCount:1,transport:async(_url,init)=>{reports.push(JSON.parse(String(init?.body)));return new Response('',{status:503});}});try{sdk.captureException(Error('first'));sdk.captureException(Error('full'));for(let i=0;i<12;i++){await sdk.flushMetrics();time.mockReturnValue(Date.now()+300001);}expect(reports).toHaveLength(12);expect(reports.every(row=>JSON.stringify(row)===JSON.stringify(reports[0]))).toBe(true);expect(sdk.getMetricReport()).toBeUndefined();expect(sdk.stats()).toEqual({queued:1,dropped:1});await sdk.flushMetrics();expect(reports).toHaveLength(12);}finally{time.mockRestore();}
  });
  it('automatically retries one process-scoped metric ID/body without borrowing the last actor context',async()=>{
   const time=vi.spyOn(Date,'now').mockReturnValue(Date.now()),reports:unknown[]=[],contexts:unknown[]=[];let lost=true;const sdk=setup({reportMetrics:true,maxQueueCount:1,credentialProvider:async()=>{contexts.push(sdk.context()?.actorReference);return 'placeholder';},transport:async(url,init)=>{const body=JSON.parse(String(init?.body));if(String(url).endsWith('/sdk-metrics')){reports.push(body);if(lost){lost=false;throw Error('controlled lost ACK');}return Response.json({accepted:true,duplicate:true});}return Response.json({schemaVersion:'1.1',acknowledgements:body.events.map((e:{eventId:string})=>({eventId:e.eventId,status:'ACCEPTED'}))});}});
   try{await sdk.run({applicationId:app,environmentId:env,actorReference:'request-user',tenantReference:'request-tenant'},async()=>{sdk.captureException(Error('first'));sdk.captureException(Error('full'));await sdk.flush();});expect(reports).toHaveLength(1);expect(contexts).toEqual(['request-user',null]);for(let i=0;i<10;i++)await sdk.flushMetrics();expect(reports).toHaveLength(1);time.mockReturnValue(Date.now()+10001);await sdk.flush();expect(reports).toHaveLength(2);expect(reports[1]).toEqual(reports[0]);expect(sdk.getMetricReport()).toBeUndefined();expect(sdk.stats().dropped).toBe(1);}finally{time.mockRestore();}
  });
  it('keeps reported queue drops separate from retry ACK recovery',async()=>{
   const time=vi.spyOn(Date,'now').mockReturnValue(Date.now());let offline=true;const sdk=setup({maxQueueCount:1,transport:async(_url,init)=>{if(offline)throw Error('controlled outage');const body=JSON.parse(String(init?.body));return Response.json({schemaVersion:'1.1',acknowledgements:body.events.map((e:{eventId:string})=>({eventId:e.eventId,status:'DUPLICATE'}))});}});
   try{sdk.captureException(Error('first'));sdk.captureException(Error('queue full'));const first=sdk.getMetricReport()!;expect(first.counters).toEqual({dropped:1,retryDelivered:0,retryDropped:0});sdk.acknowledgeMetricReport(first.reportId);await sdk.flush();expect(sdk.getMetricReport()).toBeUndefined();offline=false;time.mockReturnValue(Date.now()+300001);await sdk.flush();expect(sdk.getMetricReport()!.counters).toEqual({dropped:0,retryDelivered:1,retryDropped:0});}finally{time.mockRestore();}
  });
  it('counts terminal rejected ACK as dropped rather than successful delivery',async()=>{const sdk=setup({transport:async(_url,init)=>{const body=JSON.parse(String(init?.body));return Response.json({schemaVersion:'1.1',acknowledgements:body.events.map((e:{eventId:string})=>({eventId:e.eventId,status:'REJECTED'}))});}});sdk.captureException(Error('controlled rejected'));await sdk.flush();expect(sdk.stats()).toEqual({queued:0,dropped:1});expect(sdk.getMetricReport()!.counters).toEqual({dropped:1,retryDelivered:0,retryDropped:0});});
  it('isolates concurrent async request context',async()=>{const records:unknown[]=[];const sdk=setup({transport:async(_url,init)=>{const batch=JSON.parse(String(init?.body));records.push(...batch.events);return Response.json({schemaVersion:'1.1',acknowledgements:batch.events.map((e:{eventId:string})=>({eventId:e.eventId,status:'ACCEPTED'}))});}});await Promise.all(['A','B'].map(actor=>sdk.run({applicationId:app,environmentId:env,actorReference:actor,tenantReference:actor,requestId:actor},async()=>{await Promise.resolve();sdk.captureException(new Error('Controlled error'),{operationName:actor});})));await sdk.flush();expect(records).toEqual(expect.arrayContaining([expect.objectContaining({actorReference:'A',tenantReference:'A',requestId:'A'}),expect.objectContaining({actorReference:'B',tenantReference:'B',requestId:'B'})]));expect(sdk.stats().queued).toBe(0);});
  it('falls back to safe structured events when ingestion fails',async()=>{const records:unknown[]=[];const sdk=setup({fallback:e=>records.push(e),transport:async()=>{throw new Error('offline');}});sdk.captureException(new Error('password=fake-unit-value'));await sdk.flush();expect(JSON.stringify(records)).not.toContain('fake-unit-value');expect(records).toHaveLength(1);expect(sdk.stats().queued).toBe(1);});
  it('bounds memory and never throws into consumer exception flow',()=>{const sdk=setup({maxQueueCount:1});expect(sdk.captureException(new Error('first'))).toBeTypeOf('string');expect(sdk.captureException(new Error('second'))).toBeNull();expect(sdk.stats()).toEqual({queued:1,dropped:1});});
  it('rejects another Application context',()=>expect(()=>setup().run({applicationId:crypto.randomUUID(),environmentId:env,actorReference:null,tenantReference:null},()=>{})).toThrow('SDK_CONTEXT_MISMATCH'));
  it('does not discard telemetry after invalid ACK',async()=>{const sdk=setup({transport:async()=>Response.json({schemaVersion:'1.1',acknowledgements:[{eventId:crypto.randomUUID(),status:'ACCEPTED'}]})});sdk.captureException(new Error('example'));await sdk.flush();expect(sdk.stats().queued).toBe(1);});
});
