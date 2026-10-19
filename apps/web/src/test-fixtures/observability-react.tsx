// Explicit Browser acceptance fixture, not imported by the production entrypoint.
import {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ObservabilityErrorBoundary,ObservabilityProvider,useRouteContext} from '@observability/react-adapter';
import type {BrowserSdk} from '@observability/browser-sdk';

export function mountReactAcceptance(mode:string){
 const container=document.createElement('main');container.dir='rtl';document.body.append(container);
 const status={starts:0,stops:0,captures:0,uncaught:0,caught:0};
 const sdk={start(){status.starts++;if(mode==='start-throw')throw Error('Synthetic start failure');if(mode==='start-reject')return Promise.reject(Error('Synthetic start rejection'));return()=>{status.stops++;if(mode==='cleanup-throw')throw Error('Synthetic cleanup failure');if(mode==='cleanup-reject')return Promise.reject(Error('Synthetic cleanup rejection'));};},capture(){status.captures++;if(mode==='capture-throw')throw Error('Synthetic capture failure');if(mode==='capture-reject')return Promise.reject(Error('Synthetic capture rejection'));if(mode==='capture-stall')return new Promise(()=>undefined);return Promise.resolve('fixture-event');}} as unknown as BrowserSdk;
 function Probe({crash,revision,onNavigate,onCrash}:{crash:boolean;revision:number;onNavigate:()=>void;onCrash:()=>void}){
  useRouteContext(`/fixture/${revision}`);if(crash)throw Error('Synthetic controlled render failure');
  return <section><label>یادداشت آزمایشی<input aria-label="یادداشت آزمایشی"/></label><button onClick={onNavigate}>تغییر مسیر آزمایشی</button><output aria-label="شمارنده مسیر">{revision}</output><button onClick={onCrash}>خطای کنترل‌شده</button></section>;
 }
 function Harness(){const[crash,setCrash]=useState(false),[revision,setRevision]=useState(0);return <ObservabilityProvider sdk={sdk}><ObservabilityErrorBoundary sdk={sdk} fallback={reset=><section><p>نمایش این بخش با مشکل روبه‌رو شد</p><button onClick={()=>{setCrash(false);reset();}}>بازیابی صفحه</button></section>}><Probe crash={crash} revision={revision} onNavigate={()=>setRevision(value=>value+1)} onCrash={()=>setCrash(true)}/></ObservabilityErrorBoundary></ObservabilityProvider>;}
 const root=createRoot(container,{onCaughtError:()=>{status.caught++;},onUncaughtError:()=>{status.uncaught++;}});root.render(<Harness/>);
 return{status,unmount(){root.unmount();container.remove();}};
}
