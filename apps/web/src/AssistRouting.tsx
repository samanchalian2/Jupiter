import { useEffect, useState } from 'react';
import type { Actor } from './App';
import { request } from './App';
import { ContextualHelpTrigger } from './ContextualHelp';

export type SupportTeam='ORGANIZATION'|'JUPITER';
export type Availability={enabled:boolean;available:boolean;direct:boolean;reason:string|null};
export const assistReasons:Record<string,string>={ORGANIZATION_DISABLED:'مدیر سازمان این امکان را فعال نکرده است.',SERVICE_UNAVAILABLE:'سرویس پشتیبانی ژوپیتر برای سازمان فعال نیست.',CAPACITY_UNAVAILABLE:'ظرفیت جدید رسیدگی ژوپیتر موجود نیست.',ORGANIZATION_NOT_ACTIVE:'سازمان هنوز آمادهٔ استفاده از این سرویس نیست.',ORGANIZATION_ONLY:'این امکان ویژهٔ فضای سازمانی است.'};
export const assistStates:Record<string,string>={QUEUED:'در صف تیم ژوپیتر',REQUESTED:'درخواست کمک ثبت شده',PENDING_APPROVAL:'منتظر تأیید مدیر',ACCEPTED:'پذیرفته‌شده توسط تیم ژوپیتر',IN_PROGRESS:'در حال رسیدگی توسط ژوپیتر',WAITING_FOR_ORGANIZATION:'منتظر پاسخ سازمان',COMPLETED:'رسیدگی ژوپیتر پایان یافته',DECLINED:'درخواست پذیرفته نشد',CANCELLED:'درخواست لغو شده'};

function useAvailability(actor:Actor) {
  const [value,setValue]=useState<Availability|null>(null),[error,setError]=useState(''),[version,setVersion]=useState(0);
  useEffect(()=>{let active=true;setValue(null);setError('');void request('/platform/assist/availability',actor.session,actor.organizationId).then(result=>{if(active)setValue(result as Availability);}).catch(()=>{if(active)setError('وضعیت پشتیبانی دریافت نشد؛ دوباره تلاش کنید.');});return()=>{active=false;};},[actor.organizationId,actor.session.accessToken,version]);
  return {value,error,reload:()=>setVersion(v=>v+1)};
}
export function SupportTeamSelector({actor,value,onChange}:{actor:Actor;value:SupportTeam;onChange:(v:SupportTeam)=>void}) {
  const availability=useAvailability(actor);
  if(actor.membership.workspace_type==='PERSONAL')return null;
  return <><SupportTeamOptions value={value} onChange={onChange} availability={availability}/><ContextualHelpTrigger actor={actor} relatedFeature="JUPITER_ASSIST" label="راهنمای پشتیبانی ژوپیتر"/></>;
}
export function SupportTeamOptions({value,onChange,availability}:{value:SupportTeam;onChange:(v:SupportTeam)=>void;availability:{value:Availability|null;error:string;reload:()=>void}}) {
  return <fieldset className="assist-routing"><legend>رسیدگی توسط</legend>
    <label><input type="radio" name="support-team" checked={value==='ORGANIZATION'} onChange={()=>onChange('ORGANIZATION')}/> تیم پشتیبانی سازمان</label>
    <label><input type="radio" name="support-team" aria-describedby="assist-routing-description" disabled={!availability.value?.available} checked={value==='JUPITER'} onChange={()=>onChange('JUPITER')}/> تیم ژوپیتر</label>
    <p className="hint" id="assist-routing-description">{availability.error||(!availability.value?'در حال بررسی دسترسی…':availability.value.available?'کمک از کارشناسان ژوپیتر؛ اطلاعات همین تیکت برای رسیدگی به اشتراک گذاشته می‌شود.':assistReasons[availability.value.reason??'']??'پشتیبانی ژوپیتر در دسترس نیست.')}</p>
    {value==='JUPITER'&&availability.value&&!availability.value.direct&&<p className="hint">سیاست فعلی سازمان به تأیید مدیر نیاز دارد.</p>}
    {availability.error&&<button type="button" onClick={availability.reload}>تلاش مجدد</button>}
  </fieldset>;
}
export function OrganizationAssistSetting({actor}:{actor:Actor}) {
  const {value,error,reload}=useAvailability(actor);const[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
  async function save(enabled:boolean){setBusy(true);setNotice('');try{await request('/platform/assist/organization-setting',actor.session,actor.organizationId,{method:'POST',body:JSON.stringify({enabled})});setNotice('اجازهٔ پشتیبانی ژوپیتر ذخیره شد.');reload();}catch{setNotice('تغییر ذخیره نشد؛ دوباره تلاش کنید.');}finally{setBusy(false);}}
  return <section className="card"><h3>کمک از تیم ژوپیتر</h3><label className="checkbox-label"><input type="checkbox" disabled={!value||busy} checked={value?.enabled??false} onChange={e=>void save(e.target.checked)}/> کاربران بتوانند رسیدگی توسط تیم ژوپیتر را انتخاب کنند.</label><p className="hint">با فعال‌سازی، درخواست‌ها بدون تأیید موردی وارد صف می‌شوند و کارشناس فقط به همان تیکت دسترسی زمان‌دار دارد. خاموش‌کردن، درخواست جدید را متوقف می‌کند؛ صف و پرونده‌های قبلی باقی می‌مانند. اشتراک و ظرفیت سرویس جداگانه مدیریت می‌شوند.</p>{value?.reason&&value.enabled&&<p className="hint">{assistReasons[value.reason]}</p>}{error&&<p role="alert">{error} <button type="button" onClick={reload}>تلاش مجدد</button></p>}{notice&&<p role="status">{notice}</p>}<ContextualHelpTrigger actor={actor} relatedFeature="JUPITER_ASSIST" label="راهنمای پشتیبانی ژوپیتر"/></section>;
}
export function TicketAssistRequest({actor,ticketId}:{actor:Actor;ticketId:string}) {
  const {value,error}=useAvailability(actor),[current,setCurrent]=useState<{status:string}|null>(null),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
  useEffect(()=>{let active=true;setCurrent(null);setNotice('');void request('/platform/assist/cases',actor.session,actor.organizationId).then(rows=>{if(active)setCurrent((rows as {ticket_id:string;status:string}[]).find(row=>row.ticket_id===ticketId)??null);}).catch(()=>{if(active)setNotice('دریافت وضعیت درخواست ژوپیتر ناموفق بود.');});return()=>{active=false;};},[ticketId,actor.organizationId,actor.session.accessToken]);
  if(actor.membership.workspace_type==='PERSONAL')return null;
  async function submit(){setBusy(true);setNotice('');try{const result=await request(`/platform/assist/tickets/${ticketId}/request`,actor.session,actor.organizationId,{method:'POST',body:'{}'});setCurrent(result as {status:string});}catch{setNotice('درخواست ژوپیتر ثبت نشد؛ وضعیت سرویس یا ظرفیت را بررسی کنید.');}finally{setBusy(false);}}
  return <div className="assist-ticket-request">{current?<p role="status">{assistStates[current.status]??'درخواست تیم ژوپیتر'}</p>:<><button type="button" disabled={!value?.available||busy} onClick={()=>void submit()}>{busy?'در حال ثبت…':'درخواست رسیدگی از تیم ژوپیتر'}</button><p className="hint">{error||(!value?'در حال بررسی دسترسی…':!value.available?assistReasons[value.reason??'']:'اطلاعات همین تیکت برای رسیدگی با تیم ژوپیتر به اشتراک گذاشته می‌شود.')}</p></>}{notice&&<p role="alert">{notice}</p>}</div>;
}
