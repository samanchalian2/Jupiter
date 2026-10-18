import { useEffect,useState } from 'react';
import { Bell } from 'lucide-react';
import { authenticatedHubFetch } from './JupiterObservability';

type Notice={id:string;title:string;href:'/operations#alerts';occurredAt:string;read:boolean};
/** Account-scoped, never persisted in browser storage or mixed with tenant notices. */
export function OperationalNotifications({accountKey}:{accountKey:string}){
 const [rows,setRows]=useState<Notice[]>([]),[unavailable,setUnavailable]=useState(false);
 useEffect(()=>{let active=true;const controller=new AbortController();setRows([]);setUnavailable(false);
  const refresh=async()=>{try{const response=await authenticatedHubFetch('/notifications/operations',{signal:controller.signal});if(!response.ok)throw new Error('UNAVAILABLE');const value=await response.json() as Notice[];if(active){setRows(value);setUnavailable(false);}}catch{if(active){setRows([]);setUnavailable(true);}}};
  void refresh();const timer=setInterval(()=>void refresh(),60_000);return()=>{active=false;controller.abort();clearInterval(timer);};
 },[accountKey]);
 if(!rows.length&&!unavailable)return null;
 return <details className="notifications operational-notifications" onKeyDown={event=>{if(event.key==='Escape')event.currentTarget.open=false;}}><summary aria-label="هشدارهای مرکز پایش" title="هشدارهای مرکز پایش"><Bell size={19}/><span className="sr-only">هشدارهای مرکز پایش</span>{rows.some(row=>!row.read)&&<b>{rows.filter(row=>!row.read).length}</b>}</summary><div>{unavailable?<p role="status">دریافت هشدارهای مرکز پایش موقتاً در دسترس نیست.</p>:rows.slice(0,10).map(row=><p key={row.id}><a href={row.href}>{row.title}</a><small>{row.read?' · خوانده‌شده':' · خوانده‌نشده'}</small></p>)}<a className="ui-button secondary" href="/operations#alerts">مشاهدهٔ صندوق هشدار</a></div></details>;
}
