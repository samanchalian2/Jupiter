import { useEffect, useRef, useState, type FormEvent } from 'react';
import { result, type OperationsClient } from './client.js';
export interface UnknownAttempt { id:string;investigation_id:string;tenant_reference:string|null;period_start:string;reserved_tokens:number;model:string;outcome:string;created_at:string }
export function reconciliationCommand(input:string,output:string,reason:string,confirmed:boolean,reserved:number){
  if(!/^\d+$/.test(input)||!/^\d+$/.test(output))throw Error('تعداد واقعی توکن ورودی و خروجی را وارد کنید.');
  const inputTokens=Number(input),outputTokens=Number(output);
  if(!Number.isSafeInteger(inputTokens)||!Number.isSafeInteger(outputTokens)||inputTokens+outputTokens>reserved)throw Error('مجموع مصرف نباید از سقف رزروشده بیشتر باشد.');
  if(!confirmed||reason.trim().length<10||reason.length>500)throw Error('تأیید بررسی گزارش provider و دلیل حداقل ۱۰ نویسه‌ای لازم است.');
  return{inputTokens,outputTokens,reason:reason.trim()};
}
export function ReconciliationPanel({client,applicationId,environmentId,tenant,onReconciled}:{client:OperationsClient;applicationId:string;environmentId:string;tenant:string;onReconciled:()=>void}){
  const[attempts,setAttempts]=useState<UnknownAttempt[]>([]),[selected,setSelected]=useState<UnknownAttempt|null>(null);
  const[input,setInput]=useState(''),[output,setOutput]=useState(''),[reason,setReason]=useState(''),[confirmed,setConfirmed]=useState(false);
  const[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true);
  const generation=useRef(0),prefix=`/operations/applications/${applicationId}/ai`;
  useEffect(()=>{
    const current=++generation.current;setAttempts([]);setSelected(null);setError('');setNotice('');setBusy(false);setLoading(true);
    const query=new URLSearchParams({environmentId,...(tenant?{tenantReference:tenant}:{})});
    void client.request(`${prefix}/unknown-attempts?${query}`).then(result<UnknownAttempt[]>).then(value=>{if(current===generation.current)setAttempts(value);}).catch(cause=>{if(current===generation.current)setError(cause.message);}).finally(()=>{if(current===generation.current)setLoading(false);});
    return()=>{generation.current++;};
  },[client,applicationId,environmentId,tenant]);
  const choose=(attempt:UnknownAttempt)=>{setSelected(attempt);setInput('');setOutput('');setReason('');setConfirmed(false);setError('');setNotice('');};
  const submit=async(event:FormEvent)=>{
    event.preventDefault();if(!selected||busy)return;const current=generation.current;setError('');
    try{
      const command=reconciliationCommand(input,output,reason,confirmed,selected.reserved_tokens);setBusy(true);
      await result(await client.request(`${prefix}/attempts/${selected.id}/reconcile`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({environmentId,tenantReference:selected.tenant_reference,...command})}));
      if(current!==generation.current)return;
      setAttempts(items=>items.filter(item=>item.id!==selected.id));setSelected(null);setNotice('مصرف واقعی ثبت شد؛ شمارش نهایی دیگر قابل تغییر نیست.');onReconciled();
    }catch(cause){if(current===generation.current)setError((cause as Error).message);}finally{if(current===generation.current)setBusy(false);}
  };
  return <section aria-label="تطبیق مصرف نامعلوم"><h3>تطبیق مصرف نامعلوم</h3><p className="hint">تنها پس از بررسی گزارش مصرف provider، مقدار واقعی را ثبت کنید. صفر را صرفاً برای آزادکردن بودجه وارد نکنید. این کار نتیجهٔ تحلیل را تأیید یا بازنویسی نمی‌کند.</p>
    {error&&<p className="error" role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}{loading?<p role="status">در حال دریافت مصرف نامعلوم…</p>:!error&&!attempts.length?<p>مصرف نامعلومی در این محدوده وجود ندارد.</p>:null}
    {attempts.map(attempt=><article key={attempt.id} className="obs-detail"><p>{attempt.model} · سقف رزرو {attempt.reserved_tokens.toLocaleString('fa-IR')} توکن</p><p>{new Date(attempt.created_at).toLocaleString('fa-IR')}</p><small dir="ltr">{attempt.id} · {attempt.outcome}</small><button type="button" className="secondary" disabled={busy} onClick={()=>choose(attempt)}>بررسی شمارش واقعی</button></article>)}
    {selected&&<form className="obs-command" onSubmit={event=>void submit(event)}><h4>ثبت مصرف تأییدشدهٔ provider</h4><small dir="ltr">{selected.id}</small><label>توکن ورودی<input type="number" min={0} max={selected.reserved_tokens} step={1} value={input} onChange={event=>setInput(event.target.value)} required/></label><label>توکن خروجی<input type="number" min={0} max={selected.reserved_tokens} step={1} value={output} onChange={event=>setOutput(event.target.value)} required/></label><label>دلیل و مرجع بررسی (بدون اطلاعات محرمانه)<textarea value={reason} minLength={10} maxLength={500} onChange={event=>setReason(event.target.value)} required/></label><label><input type="checkbox" checked={confirmed} onChange={event=>setConfirmed(event.target.checked)} required/>شمارش واقعی را در گزارش provider بررسی کرده‌ام؛ مقدار نهایی قابل بازنویسی نیست.</label><div><button disabled={busy||!confirmed}>ثبت نهایی مصرف</button><button type="button" className="secondary" disabled={busy} onClick={()=>setSelected(null)}>انصراف</button></div></form>}
  </section>;
}
