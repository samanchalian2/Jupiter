import {expect,vi} from 'vitest';
import {createRequire} from 'node:module';
import {join} from 'node:path';
import {mkdir} from 'node:fs/promises';
import type {Pool} from 'pg';
import {acceptActualIncidentBrowser} from './actual-incident-browser.js';

/** Actual Vite entrypoint/App/SDK against the disposable compiled-main process. */
export async function acceptActualHostBrowser(input:{pool:Pool;base:string;webOrigin:string;organizationId:string;requesterId:string;applicationId:string;password:string}){
 if([input.base,input.webOrigin].some(value=>{const url=new URL(value);return url.protocol!=='http:'||!['localhost','127.0.0.1','[::1]'].includes(url.hostname)||[3000,5173,5174,8088].includes(Number(url.port));}))throw Error('LOCAL ephemeral fixture Browser only');
 expect((await input.pool.query('SELECT current_database() name')).rows[0].name).toMatch(/^obs069_host_[0-9a-f]{32}$/);
 const require=createRequire(join(process.cwd(),'../../observability/server/package.json'));
 const {chromium}=require('playwright');
 const {createServer}=await import('../../../../observability/server/node_modules/vite/dist/node/index.js');
 const apiOrigin=new URL(input.base).origin,webRoot=join(process.cwd(),'../web');
 const vite=await createServer({root:webRoot,configFile:join(webRoot,'vite.config.ts'),logLevel:'silent',define:{'import.meta.env.VITE_API_URL':JSON.stringify('/api/v1')},server:{host:'127.0.0.1',port:Number(new URL(input.webOrigin).port),strictPort:true,proxy:{'/api':{target:apiOrigin,changeOrigin:true}}}});
 let browser:any,context:any;
 try{
  await vite.listen();browser=await chromium.launch({channel:process.env.OBSERVABILITY_BROWSER_CHANNEL??'msedge',headless:true});context=await browser.newContext();const page=await context.newPage();
  let pageErrors=0;page.on('pageerror',()=>{pageErrors++;});
  let blockedTelemetry=0;const telemetryRoute='**/api/v1/observability/events/batch';
  await page.route(telemetryRoute,async(route:any)=>{blockedTelemetry++;await route.abort('failed');});
  const before=(await input.pool.query('SELECT count(*)::int total FROM tickets WHERE organization_id=$1',[input.organizationId])).rows[0].total;
  const writes:Array<{requestId:string;traceparent:string;path:string}>=[];
  page.on('request',(request:any)=>{if(request.method()==='POST'&&new URL(request.url()).pathname==='/api/v1/tickets/drafts'){const headers=request.headers();writes.push({requestId:headers['x-request-id'],traceparent:headers.traceparent,path:new URL(request.url()).pathname});}});
  await page.setViewportSize({width:375,height:900});await page.goto(`${input.webOrigin}/o/host-acceptance/tickets`);
  await page.locator('input[autocomplete="username"]').fill('requester@host.invalid');await page.locator('input[autocomplete="current-password"]').fill(input.password);
  const login=page.waitForResponse((response:any)=>new URL(response.url()).pathname==='/api/v1/auth/login');
  await page.getByRole('button',{name:'ورود به سامانه',exact:true}).click();expect((await login).status()).toBe(201);
  await page.getByRole('textbox',{name:'شرح درخواست',exact:true}).waitFor();
  await page.getByRole('textbox',{name:'شرح درخواست',exact:true}).fill('شرح آزمایشی برای ثبت دستی بدون داده واقعی');
  await page.getByRole('button',{name:'جزئیات درخواست',exact:true}).click();await page.getByRole('textbox',{name:'عنوان درخواست',exact:true}).fill('درخواست آزمایشی مرورگر واقعی');
  const widths=[];
  for(const width of [375,768,1024,1440]){
   await page.setViewportSize({width,height:900});
   const layout=await page.evaluate(()=>({width:innerWidth,document:document.documentElement.scrollWidth,rtl:getComputedStyle(document.documentElement).direction}));
   expect(layout.rtl).toBe('rtl');expect(layout.document).toBeLessThanOrEqual(width);widths.push(layout);
   if(process.env.OBSERVABILITY_BROWSER_ARTIFACT_DIR&&[375,1440].includes(width)){await mkdir(process.env.OBSERVABILITY_BROWSER_ARTIFACT_DIR,{recursive:true});await page.screenshot({path:join(process.env.OBSERVABILITY_BROWSER_ARTIFACT_DIR,`jupiter-composer-${width}.png`),fullPage:true});}
  }
  await page.setViewportSize({width:375,height:900});
  const draftResponse=page.waitForResponse((response:any)=>new URL(response.url()).pathname==='/api/v1/tickets/drafts'&&response.request().method()==='POST');
  await page.getByRole('button',{name:'ثبت درخواست',exact:true}).click();const response=await draftResponse;expect(response.status()).toBe(201);const draft=await response.json();
  await vi.waitFor(async()=>expect((await input.pool.query('SELECT status FROM tickets WHERE id=$1 AND organization_id=$2',[draft.id,input.organizationId])).rows).toEqual([{status:'OPEN'}]),{timeout:5000,interval:100});
  expect((await input.pool.query('SELECT count(*)::int total FROM tickets WHERE organization_id=$1',[input.organizationId])).rows[0].total).toBe(before+1);expect(writes).toHaveLength(1);
  expect(writes[0].requestId).toMatch(/^[0-9a-f-]{36}$/);expect(writes[0].traceparent).toMatch(/^00-[a-f0-9]{32}-[a-f0-9]{16}-01$/);
  const traceId=writes[0].traceparent.split('-')[1];
  await vi.waitFor(()=>expect(blockedTelemetry).toBeGreaterThan(0),{timeout:16000,interval:100});
  expect((await input.pool.query("SELECT 1 FROM observability.events WHERE application_id=$1 AND request_id=$2 AND source='BROWSER'",[input.applicationId,writes[0].requestId])).rowCount).toBe(0);
  const queued=await page.evaluate(async(requestId:string)=>new Promise<{id:string;attempts:number}|undefined>((resolve,reject)=>{
   const open=indexedDB.open('observability-hub-v1',1);open.onerror=()=>reject(Error('Fixture journal unavailable'));open.onsuccess=()=>{const db=open.result,query=db.transaction('envelopes').objectStore('envelopes').getAll();query.onerror=()=>{db.close();reject(Error('Fixture journal read failed'));};query.onsuccess=()=>{const item=query.result.find((entry:any)=>entry.kind==='EVENT'&&entry.payload.requestId===requestId);db.close();resolve(item?{id:item.id,attempts:item.attempts}:undefined);};};
  }),writes[0].requestId);
  expect(queued?.id).toMatch(/^[0-9a-f-]{36}$/);
  await page.unroute(telemetryRoute);
  // Do not invoke SDK.flush: Browser uses its normal automatic recovery
  // triggers; Node retains its normal timer. Do not attribute this whole-shell
  // scenario to one exclusive trigger.
  await vi.waitFor(async()=>{
   const events=(await input.pool.query('SELECT source,actor_reference,tenant_reference,trace_id FROM observability.events WHERE application_id=$1 AND request_id=$2',[input.applicationId,writes[0].requestId])).rows;
   expect(new Set(events.map(row=>row.source))).toEqual(new Set(['BROWSER','SERVER']));
   expect(events.every(row=>row.actor_reference===input.requesterId&&row.tenant_reference===input.organizationId&&row.trace_id===traceId)).toBe(true);
  },{timeout:20000,interval:100});
  expect((await input.pool.query("SELECT event_id FROM observability.events WHERE application_id=$1 AND request_id=$2 AND source='BROWSER'",[input.applicationId,writes[0].requestId])).rows).toEqual([{event_id:queued!.id}]);
  await vi.waitFor(async()=>expect(await page.evaluate(async(id:string)=>new Promise<boolean>((resolve,reject)=>{const open=indexedDB.open('observability-hub-v1',1);open.onerror=()=>reject(Error('Fixture journal unavailable'));open.onsuccess=()=>{const db=open.result,query=db.transaction('envelopes').objectStore('envelopes').get(id);query.onsuccess=()=>{db.close();resolve(Boolean(query.result));};query.onerror=()=>{db.close();reject(Error('Fixture journal read failed'));};};}),queued!.id)).toBe(false),{timeout:5000,interval:100});
  await page.getByRole('heading',{name:'درخواست آزمایشی مرورگر واقعی',exact:true}).waitFor();
  const detailWidths=[];
  for(const width of [375,768,1024,1440]){
   await page.setViewportSize({width,height:900});const layout=await page.evaluate(()=>({width:innerWidth,document:document.documentElement.scrollWidth,rtl:getComputedStyle(document.documentElement).direction}));
   expect(layout.rtl).toBe('rtl');expect(layout.document).toBeLessThanOrEqual(width);detailWidths.push(layout);
   if(process.env.OBSERVABILITY_BROWSER_ARTIFACT_DIR&&[375,1440].includes(width))await page.screenshot({path:join(process.env.OBSERVABILITY_BROWSER_ARTIFACT_DIR,`jupiter-detail-${width}.png`),fullPage:true});
  }
  await acceptActualIncidentBrowser(browser,input);
  expect(pageErrors).toBe(0);expect((await input.pool.query('SELECT 1 FROM commercial_usage_ledger WHERE organization_id=$1',[input.organizationId])).rowCount).toBe(0);
  console.log(JSON.stringify({event:'observability.actual_jupiter_web',result:'PASS',entrypoint:'apps/web/src/main.tsx',authenticated:true,manualTicket:'ONE_OPEN',automaticCorrelation:['BROWSER','SERVER'],telemetryOutage:'REAL_NETWORK_ABORT_INDEXEDDB_SAME_ID_RECOVERY_ACK_CLEANUP',blockedTelemetry,widths,detailWidths,pageErrors,commercialEntries:0,limits:'Actual Web/App/SDK and compiled AppModule in disposable fixture; no AI/provider or arbitrary business workflow coverage.'}));
 }finally{
  try{if(context){try{expect((await context.request.post(`${input.webOrigin}/api/v1/auth/logout`)).status()).toBe(201);expect((await context.request.post(`${input.webOrigin}/api/v1/auth/refresh`)).status()).toBe(401);}finally{await context.close();}}}
  finally{try{await browser?.close();}finally{await vite.close();}}
 }
}
