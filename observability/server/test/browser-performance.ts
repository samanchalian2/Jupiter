import { expect } from 'vitest';
import type { Browser, Request } from 'playwright';
import { HubDatabase } from '../src/index.js';
/** Independent reference origin + real IndexedDB, never the Jupiter business DB. */
export async function browserPerformance(browser:Browser,database:HubDatabase,origin:string,application:string,environment:string,sessionToken:string){
 const results:unknown[]=[];
 for(const mode of ['count','bytes']){
  const context=await browser.newContext();
  await context.addCookies([{name:'reference_session',value:sessionToken,url:origin,httpOnly:true,sameSite:'Strict'}]);
  const page=await context.newPage(),batches:{count:number;bytes:number;status:number;failed?:boolean}[]=[],requests=new Map<Request,typeof batches[number]>();
  page.on('request',request=>{if(request.url().endsWith('/events/batch')){const body=request.postData()??'',entry={count:JSON.parse(body).events.length,bytes:Buffer.byteLength(body),status:0};requests.set(request,entry);batches.push(entry);}});
  page.on('response',response=>{const entry=requests.get(response.request());if(entry)entry.status=response.status();});
  page.on('requestfailed',request=>{const entry=requests.get(request);if(entry)entry.failed=true;});
  try{
   await page.goto(`${origin}/performance.html?mode=${mode}`);await page.getByText('Verified session ready',{exact:true}).waitFor();
   const cdp=await context.newCDPSession(page);await cdp.send('Performance.enable');
   const heap=async()=>{const data=await cdp.send('Performance.getMetrics'),value=(name:string)=>data.metrics.find(row=>row.name===name)?.value??null;return{heap:value('JSHeapUsedSize'),task:value('TaskDuration'),script:value('ScriptDuration')};};
   const beforeHeap=await heap();await context.setOffline(true);
   await page.getByRole('button',{name:'Fill bounded queue',exact:true}).click();
   await expect.poll(async()=>JSON.parse(await page.locator('#result').innerText()).action,{timeout:60000}).toBe('fill');
   const fill=JSON.parse(await page.locator('#result').innerText());expect(fill.status.storage).toBe('DURABLE');expect(fill.queued).toBe(fill.accepted);expect(fill.dataBytes).toBeLessThanOrEqual(2097152);expect(fill.metricBytes).toBeLessThanOrEqual(16384);
   if(mode==='count')expect(fill.accepted).toBe(500);else{expect(fill.accepted).toBeGreaterThan(50);expect(fill.accepted).toBeLessThan(500);}
   const afterHeap=await heap();
   const ids=async()=>page.evaluate(async name=>{const request=indexedDB.open(name,1);const db=await new Promise<IDBDatabase>((done,reject)=>{request.onsuccess=()=>done(request.result);request.onerror=()=>reject(Error('Read failed'));});try{return await new Promise<string[]>((done,reject)=>{const read=db.transaction('envelopes','readonly').objectStore('envelopes').getAll();read.onsuccess=()=>done(read.result.filter((row:{kind:string})=>row.kind==='EVENT').map((row:{id:string})=>row.id).sort());read.onerror=()=>reject(Error('Read failed'));});}finally{db.close();}},`observability-performance-${mode}`);
   const originalIds=await ids();
   await page.getByRole('button',{name:'Flush once',exact:true}).click();await expect.poll(async()=>JSON.parse(await page.locator('#result').innerText()).action,{timeout:20000}).toBe('flush');
   const offlineFlush=JSON.parse(await page.locator('#result').innerText());expect(offlineFlush.queued).toBe(fill.accepted);
   await context.setOffline(false);await page.reload();await page.getByText('Verified session ready',{exact:true}).waitFor();expect(await ids()).toEqual(originalIds);
   await page.waitForTimeout(2100);await page.getByRole('button',{name:'Replay queue',exact:true}).click();
   await expect.poll(async()=>JSON.parse(await page.locator('#result').innerText()).action,{timeout:60000}).toBe('replay');
   const replay=JSON.parse(await page.locator('#result').innerText());
   console.log(JSON.stringify({event:'observability.browser_performance_phase',mode,fill,offlineFlushMs:offlineFlush.wallMs,replay,batches}));
   expect(replay.queued).toBe(0);
   expect(replay.metricCount).toBeLessThanOrEqual(10);expect(replay.metricBytes).toBeLessThanOrEqual(16384);
   const persisted=await database.worker(async c=>(await c.query('SELECT count(*)::int total,count(DISTINCT event_id)::int distinct_events FROM observability.events WHERE application_id=$1 AND environment_id=$2 AND event_code=$3',[application,environment,`reference.performance.${mode}`])).rows[0]);
   expect(persisted).toEqual({total:fill.accepted,distinct_events:fill.accepted});expect(batches.every(batch=>batch.count<=50&&batch.bytes<=524288&&batch.status===200&&!batch.failed)).toBe(true);
   results.push({mode,fill,offlineFlushMs:offlineFlush.wallMs,replayMs:replay.wallMs,flushes:replay.flushes,batches,jsHeap:{beforeBytes:beforeHeap.heap,afterFillBytes:afterHeap.heap,basis:'CDP_JS_HEAP_SAMPLE_NOT_RETAINED_OR_PEAK'},mainThread:{taskSeconds:afterHeap.task!==null&&beforeHeap.task!==null?afterHeap.task-beforeHeap.task:null,scriptSeconds:afterHeap.script!==null&&beforeHeap.script!==null?afterHeap.script-beforeHeap.script:null,basis:'CDP_FILL_INTERVAL_INCLUDES_FIXTURE_UI'},idsPreservedAfterReload:true,persisted:fill.accepted});
  }finally{await context.close();}
 }
 console.log(JSON.stringify({event:'observability.local_browser_performance',results,limits:'Independent LOCAL core SDK/manual flush; not Jupiter workflow latency or browser process RSS. Exact data-envelope byte cap includes queue metadata; metric allowance is separate.'}));
}
