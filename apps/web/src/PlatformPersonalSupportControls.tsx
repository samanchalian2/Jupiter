import { FormEvent, useEffect, useState } from 'react';
import type { Actor } from './App';
import { request } from './App';

type Catalog = {
  code:string;display_name:string;description:string;status:'ACTIVE'|'SUSPENDED';
  sla_minutes:number;access_grant_minutes:number;updated_at:string;
};
type SupportCase = {
  id:string;status:string;requester_name:string;assigned_agent_name:string|null;
  sla_due_at:string|null;created_at:string;can_administer:boolean;can_operate:boolean;
};

const statusLabel:Record<string,string>={
  QUEUED:'در صف',ACCEPTED:'پذیرفته‌شده',IN_PROGRESS:'در حال رسیدگی',
  WAITING_FOR_USER:'منتظر کاربر',COMPLETED:'تکمیل‌شده',CANCELLED:'لغوشده',
  REJECTED:'ردشده',REVOKED:'متوقف‌شده',
};

export function PlatformPersonalSupportControls({actor,onSaved,onError}:{actor:Actor;onSaved:(message:string)=>void;onError:(message:string)=>void}) {
  const [catalog,setCatalog]=useState<Catalog|null>(null);
  const [cases,setCases]=useState<SupportCase[]>([]);
  const [closure,setClosure]=useState({caseId:'',action:'reject' as 'reject'|'revoke',reason:''});
  const load=()=>Promise.all([
    request('/platform/personal-support/catalog',actor.session,actor.organizationId),
    request('/platform/personal-support/cases',actor.session,actor.organizationId),
  ]).then(([catalogRows,caseRows])=>{
    setCatalog((catalogRows as Catalog[])[0]??null);
    setCases(caseRows as SupportCase[]);
  }).catch(cause=>onError(cause instanceof Error?cause.message:'دریافت تنظیمات پشتیبانی شخصی ناموفق بود.'));
  useEffect(()=>{void load();},[actor.session.accessToken]);
  const command=async(path:string,body:object,message:string)=>{
    try{await request(path,actor.session,actor.organizationId,{method:'POST',body:JSON.stringify(body)});await load();onSaved(message);return true;}
    catch(cause){onError(cause instanceof Error?cause.message:'عملیات پشتیبانی شخصی ناموفق بود.');return false;}
  };
  const save=(event:FormEvent)=>{
    event.preventDefault();
    if(!catalog)return;
    void command('/platform/personal-support/catalog',{
      status:catalog.status,displayName:catalog.display_name,description:catalog.description,
      slaMinutes:catalog.sla_minutes,accessGrantMinutes:catalog.access_grant_minutes,
    },'تنظیمات پشتیبانی شخصی ذخیره شد.');
  };
  return <section className="card">
    <h3>پشتیبانی کاربران شخصی</h3>
    <p className="hint">کاتالوگ، SLA و مدت دسترسی قابل تنظیم‌اند. دسترسی کارشناس همیشه فقط به تیکت همان پرونده، مدت‌دار و قابل لغو است.</p>
    {catalog&&<form className="compact-form" onSubmit={save}>
      <label>وضعیت سرویس<select value={catalog.status} onChange={event=>setCatalog({...catalog,status:event.target.value as Catalog['status']})}><option value="ACTIVE">فعال</option><option value="SUSPENDED">موقتاً متوقف</option></select></label>
      <label>نام قابل نمایش<input required minLength={2} maxLength={120} value={catalog.display_name} onChange={event=>setCatalog({...catalog,display_name:event.target.value})}/></label>
      <label>توضیح<textarea required minLength={2} maxLength={1000} rows={3} value={catalog.description} onChange={event=>setCatalog({...catalog,description:event.target.value})}/></label>
      <label>SLA رسیدگی (دقیقه)<input type="number" min={15} max={43200} value={catalog.sla_minutes} onChange={event=>setCatalog({...catalog,sla_minutes:Number(event.target.value)})}/></label>
      <label>مدت دسترسی کارشناس (دقیقه)<input type="number" min={15} max={43200} value={catalog.access_grant_minutes} onChange={event=>setCatalog({...catalog,access_grant_minutes:Number(event.target.value)})}/></label>
      <button>ذخیره تنظیمات</button>
    </form>}
    <h4>صف پرونده‌های شخصی</h4>
    <div className="table-wrap"><table><thead><tr><th>درخواست‌کننده</th><th>وضعیت</th><th>کارشناس</th><th>سررسید</th><th>عملیات</th></tr></thead><tbody>
      {cases.map(item=><tr key={item.id}><td>{item.requester_name}</td><td><span className={`status-pill ${item.status.toLowerCase()}`}>{statusLabel[item.status]??item.status}</span></td><td>{item.assigned_agent_name??'—'}</td><td>{item.sla_due_at?new Date(item.sla_due_at).toLocaleString('fa-IR'):'—'}</td><td><span className="button-row">
        {item.status==='QUEUED'&&<>{item.can_operate&&<button type="button" onClick={()=>void command(`/platform/personal-support/cases/${item.id}/accept`,{},'پرونده پذیرفته شد و دسترسی محدود صادر شد.')}>پذیرش به‌عنوان کارشناس</button>}{item.can_administer&&<button type="button" className="secondary" onClick={()=>setClosure({caseId:item.id,action:'reject',reason:''})}>رد</button>}</>}
        {['ACCEPTED','IN_PROGRESS','WAITING_FOR_USER'].includes(item.status)&&<>{item.can_operate&&<><button type="button" onClick={()=>void command(`/platform/personal-support/cases/${item.id}/state`,{status:'IN_PROGRESS'},'پرونده در حال رسیدگی است.')}>شروع رسیدگی</button><button type="button" onClick={()=>void command(`/platform/personal-support/cases/${item.id}/state`,{status:'COMPLETED'},'پرونده تکمیل و دسترسی لغو شد.')}>تکمیل</button></>}{item.can_administer&&<button type="button" className="secondary" onClick={()=>setClosure({caseId:item.id,action:'revoke',reason:''})}>توقف دسترسی</button>}</>}
      </span></td></tr>)}
      {!cases.length&&<tr><td colSpan={5}>پرونده‌ای در صف پشتیبانی شخصی نیست.</td></tr>}
    </tbody></table></div>
    {closure.caseId&&<form className="compact-form" onSubmit={event=>{event.preventDefault();void command(`/platform/personal-support/cases/${closure.caseId}/${closure.action}`,{reason:closure.reason},closure.action==='reject'?'پرونده رد شد.':'پرونده و دسترسی آن متوقف شد.').then(success=>{if(success)setClosure({caseId:'',action:'reject',reason:''});});}}>
      <label>دلیل تصمیم<input required minLength={2} maxLength={1000} value={closure.reason} onChange={event=>setClosure({...closure,reason:event.target.value})}/></label>
      <button>{closure.action==='reject'?'ثبت رد':'توقف پرونده'}</button><button type="button" className="secondary" onClick={()=>setClosure({caseId:'',action:'reject',reason:''})}>انصراف</button>
    </form>}
  </section>;
}
