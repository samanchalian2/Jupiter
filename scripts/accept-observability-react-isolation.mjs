// Explicit LOCAL mounted-React acceptance, no sessions/business data/provider.
import {createRequire} from 'node:module';
const require=createRequire(new URL('../observability/server/package.json',import.meta.url));
const {chromium}=require('playwright');
const origin=process.env.JUPITER_REACT_ACCEPTANCE_ORIGIN??'http://127.0.0.1:5174';
if(!['localhost','127.0.0.1','[::1]'].includes(new URL(origin).hostname))throw Error('LOCAL acceptance only');
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const context=await browser.newContext();await context.grantPermissions(['local-network-access'],{origin});const page=await context.newPage();
 const errors=[];page.on('pageerror',()=>errors.push('PAGE_ERROR'));
 await page.route(`${origin}/__obs069_react_acceptance`,route=>route.fulfill({contentType:'text/html',body:`<!doctype html><html lang="fa" dir="rtl"><body><script type="module">
 import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;
 </script></body></html>`}));
 await page.goto(`${origin}/__obs069_react_acceptance`);await page.waitForFunction(()=>window.__vite_plugin_react_preamble_installed__===true);
 await page.evaluate(()=>{window.__reactUnhandled=[];addEventListener('unhandledrejection',()=>window.__reactUnhandled.push('UNHANDLED'));});
 const outcomes=[];
 for(const width of [375,1440])for(const mode of ['normal','start-throw','start-reject','cleanup-throw','cleanup-reject','capture-throw','capture-reject','capture-stall']){
  await page.setViewportSize({width,height:900});
  await page.evaluate(async mode=>{const{mountReactAcceptance}=await import('/src/test-fixtures/observability-react.tsx');window.__reactFixture=mountReactAcceptance(mode);},mode);
  const note=page.getByRole('textbox',{name:'یادداشت آزمایشی'});try{await note.waitFor({timeout:5000});}catch{console.error(JSON.stringify({event:'observability.react_fixture_mount_failed',mode,width,status:await page.evaluate(()=>window.__reactFixture?.status),pageErrors:errors.length}));throw Error('React fixture did not stay mounted');}await note.fill('متن آزمایشی بدون داده واقعی');
  await page.getByRole('button',{name:'تغییر مسیر آزمایشی'}).click();await page.getByRole('status',{name:'شمارنده مسیر'}).filter({hasText:'1'}).waitFor();
  if(await note.inputValue()!=='متن آزمایشی بدون داده واقعی')throw Error('Provider/route effect remounted business input');
  await page.getByRole('button',{name:'خطای کنترل‌شده'}).click();await page.getByRole('button',{name:'بازیابی صفحه'}).waitFor();
  const layout=await page.evaluate(()=>({rtl:getComputedStyle(document.querySelector('main')).direction==='rtl',overflow:document.documentElement.scrollWidth>innerWidth}));
  if(!layout.rtl||layout.overflow)throw Error('Fallback RTL/overflow failure');
  await page.getByRole('button',{name:'بازیابی صفحه'}).click();await note.waitFor();
  const status=await page.evaluate(()=>{window.__reactFixture.unmount();return window.__reactFixture.status;});
  await page.waitForTimeout(20);
  if(status.starts!==1||status.stops!==(mode.startsWith('start-')?0:1)||status.uncaught!==0||status.caught<1||status.captures<2)throw Error('React lifecycle/fallback isolation failed');
  if(errors.length||await page.evaluate(()=>window.__reactUnhandled.length))throw Error('Escaped diagnostic failure');
  outcomes.push({mode,width,rtl:true,overflow:false,fallbackRecovered:true,starts:status.starts,stops:status.stops});
 }
 console.log(JSON.stringify({event:'observability.react_mounted_isolation',result:'PASS',cases:outcomes,unhandled:0,pageErrors:0,limits:'Actual reusable React adapter mounted with adversarial SDK ports in native Edge via local Vite fixture. Not authenticated full Jupiter shell or persisted telemetry proof.'}));
 await context.close();
}finally{await browser.close();}
