// LOCAL real-browser QC of the actual Jupiter fetch adapter. No user credentials.
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
const require=createRequire(new URL('../observability/server/package.json',import.meta.url));
const {chromium}=require('playwright');
const origin=process.env.JUPITER_FETCH_ACCEPTANCE_ORIGIN??'http://127.0.0.1:5174';
if(!['localhost','127.0.0.1','[::1]'].includes(new URL(origin).hostname))throw Error('LOCAL acceptance only');
const commits=new Map();
const server=createServer(async(request,response)=>{
 response.setHeader('access-control-allow-origin',origin);
 response.setHeader('access-control-allow-headers','content-type,traceparent,x-request-id');
 response.setHeader('access-control-allow-methods','POST,OPTIONS');
 if(request.method==='OPTIONS'){response.writeHead(204);response.end();return;}
 if(request.method!=='POST'||!/^\/api\/v1\/tickets\/[a-z-]+$/.test(request.url??'')){response.writeHead(404);response.end();return;}
 for await(const _chunk of request){/* Synthetic body is never retained or printed. */}
 commits.set(request.url,(commits.get(request.url)??0)+1);
 response.writeHead(201,{'content-type':'application/json'});response.end('{"committed":true}');
});
let browser;
try{
 await new Promise(done=>server.listen(0,'127.0.0.1',done));const address=server.address();
 const api=`http://127.0.0.1:${address.port}/api/v1`;
 browser=await chromium.launch({channel:'msedge',headless:true});const context=await browser.newContext();const page=await context.newPage();
 await context.grantPermissions(['local-network-access'],{origin});
 const errors=[];page.on('pageerror',()=>errors.push('PAGE_ERROR'));
 // A fixture document loads the production source module through local Vite.
 // No application session, fake backend business data or full-shell claim.
 await page.route(`${origin}/__obs069_fetch_acceptance`,route=>route.fulfill({contentType:'text/html',body:`<!doctype html><html lang="fa" dir="rtl"><body><button id="result">آزمون ارسال درخواست</button><script type="module">
 import RefreshRuntime from '/@react-refresh';
 RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;
 </script></body></html>`}));
 await page.goto(`${origin}/__obs069_fetch_acceptance`);
 await page.waitForFunction(()=>window.__vite_plugin_react_preamble_installed__===true);
 const results=await page.evaluate(async({api})=>{
  const {instrumentJupiterFetch}=await import('/src/JupiterObservability.tsx');
  const failures=[];addEventListener('unhandledrejection',()=>failures.push('UNHANDLED_REJECTION'));
  const results=[];
  for(const mode of ['trace-throw','identity-before','identity-after','capture-throw','capture-reject','capture-stall']){
   let identityCalls=0,reported=0,captured=0;
   const observer={trace:()=>{if(mode==='trace-throw')throw Error('Synthetic diagnostic failure');return{traceId:'a'.repeat(32),spanId:'b'.repeat(16),traceparent:`00-${'a'.repeat(32)}-${'b'.repeat(16)}-01`};},capture:()=>{captured++;if(mode==='capture-throw')throw Error('Synthetic diagnostic failure');if(mode==='capture-reject')return Promise.reject(Error('Synthetic asynchronous failure'));if(mode==='capture-stall')return new Promise(()=>undefined);return Promise.resolve(null);},reportApiFailure:async()=>{reported++;return null;}};
   const identity=()=>{identityCalls++;if(mode==='identity-before'||mode==='identity-after'&&identityCalls>1)throw Error('Synthetic identity failure');return 'fixture-actor';};
   const response=await instrumentJupiterFetch(fetch,observer,api,identity)(`${api}/tickets/${mode}`,{method:'POST',headers:{'content-type':'application/json'},body:'{"synthetic":true}'});
   if(response.status!==201||(await response.json()).committed!==true||reported!==0)throw Error('Business response altered');
   if(mode.startsWith('identity')&&captured!==0)throw Error('Unknown identity was attributed');
   results.push({mode,status:response.status});
  }
  const original=new DOMException('Synthetic cancelled business request','AbortError');
  const controller=new AbortController();controller.abort(original);let exactTransportError;
  const transport=async(...args)=>{try{return await fetch(...args);}catch(error){exactTransportError=error;throw error;}};
  let reporting=0;
  const observer={trace:()=>({traceId:'a'.repeat(32),spanId:'b'.repeat(16),traceparent:`00-${'a'.repeat(32)}-${'b'.repeat(16)}-01`}),capture:async()=>null,reportApiFailure:()=>{reporting++;throw Error('Synthetic reporter failure');}};
  let retained=false;try{await instrumentJupiterFetch(transport,observer,api)(`${api}/tickets/cancelled`,{method:'POST',signal:controller.signal});}catch(error){retained=error===exactTransportError&&error===original;}
  if(!retained||reporting!==1)throw Error('Original native fetch rejection replaced');
  await new Promise(resolve=>setTimeout(resolve,30));if(failures.length)throw Error('Unhandled diagnostic rejection');
  document.querySelector('#result').textContent='ارسال درخواست بدون تداخل تأیید شد';
  return{results,retainedNativeAbort:true,unhandled:failures.length};
 },{api});
 for(const row of results.results)if(commits.get(`/api/v1/tickets/${row.mode}`)!==1)throw Error('Business write duplicated or missing');
 if(commits.has('/api/v1/tickets/cancelled')||errors.length)throw Error('Cancelled request committed or page failed');
 await page.getByRole('button',{name:'ارسال درخواست بدون تداخل تأیید شد'}).waitFor();
 console.log(JSON.stringify({event:'observability.jupiter_fetch_browser_isolation',result:'PASS',...results,committedOnce:results.results.length,pageErrors:errors.length,limits:'Actual Jupiter source module, native Edge fetch and loopback HTTP fixture. Not authenticated full-shell/ticket-service acceptance.'}));
 await context.close();
}finally{await browser?.close();server.closeAllConnections();await new Promise(done=>server.close(()=>done()));}
