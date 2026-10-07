import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { Actor } from './App';
import { request } from './App';

type Settings={provider_code:string;availability:'ENABLED'|'DISABLED';mode:'LOCAL_TEST'|'LIVE';ready:boolean;callbackConfigured:boolean};
type Order={id:string;organization_id:string;package_name_snapshot:string;pool_code:'SUPPORT'|'AI';unit_count_snapshot:number;amount_irt_snapshot:string;currency:'IRT';provider_mode:'LOCAL_TEST'|'LIVE';status:string;provider_reference:string|null;created_at:string;paid_at:string|null};
const statusLabel:Record<string,string>={CREATED:'ایجادشده',CREATING:'در حال ایجاد',PENDING:'منتظر پرداخت',VERIFYING:'در حال تأیید',PAID:'پرداخت‌شده',FAILED:'ناموفق',CANCELLED:'لغوشده',EXPIRED:'منقضی'};

export function PlatformPersonalPaymentControls({actor,onSaved,onError}:{actor:Actor;onSaved:(message:string)=>void;onError:(message:string)=>void}){
  const [settings,setSettings]=useState<Settings|null>(null);const [orders,setOrders]=useState<Order[]>([]);
  const [refund,setRefund]=useState({orderId:'',amountIrt:0,externalReference:'',reason:''});
  const paid=useMemo(()=>orders.filter(item=>item.status==='PAID'),[orders]);
  const load=()=>Promise.all([
    request('/platform/personal-payments/settings',actor.session,actor.organizationId),
    request('/platform/personal-payments/orders',actor.session,actor.organizationId),
  ]).then(([nextSettings,nextOrders])=>{setSettings(nextSettings as Settings);setOrders(nextOrders as Order[]);}).catch(cause=>onError(cause instanceof Error?cause.message:'دریافت وضعیت پرداخت ناموفق بود.'));
  useEffect(()=>{void load();},[actor.session.accessToken]);
  const save=(event:FormEvent)=>{event.preventDefault();if(!settings)return;request('/platform/personal-payments/settings',actor.session,actor.organizationId,{method:'POST',body:JSON.stringify({availability:settings.availability,mode:settings.mode})}).then(()=>load()).then(()=>onSaved('تنظیمات غیرمحرمانهٔ پرداخت ذخیره شد.')).catch(cause=>onError(cause instanceof Error?cause.message:'ذخیره تنظیمات پرداخت ناموفق بود.'));};
  const recordRefund=(event:FormEvent)=>{event.preventDefault();request(`/platform/personal-payments/orders/${refund.orderId}/refunds`,actor.session,actor.organizationId,{method:'POST',body:JSON.stringify({amountIrt:refund.amountIrt,externalReference:refund.externalReference,reason:refund.reason})}).then(()=>load()).then(()=>{setRefund({orderId:'',amountIrt:0,externalReference:'',reason:''});onSaved('بازپرداخت انجام‌شده در سامانهٔ بیرونی ثبت شد.');}).catch(cause=>onError(cause instanceof Error?cause.message:'ثبت بازپرداخت ناموفق بود.'));};
  return <section className="card">
    <h3>درگاه پرداخت فضای شخصی</h3>
    <p className="hint">ژوپیتر فقط وضعیت عملیاتی و mode غیرمحرمانه را نگه می‌دارد. شناسهٔ پذیرنده و سایر credentialها فقط از محیط امن سرور خوانده می‌شوند.</p>
    {settings&&<form className="compact-form" onSubmit={save}>
      <label>دسترسی پرداخت<select value={settings.availability} onChange={event=>setSettings({...settings,availability:event.target.value as Settings['availability']})}><option value="DISABLED">غیرفعال</option><option value="ENABLED">فعال</option></select></label>
      <label>حالت درگاه<select value={settings.mode} onChange={event=>setSettings({...settings,mode:event.target.value as Settings['mode']})}><option value="LOCAL_TEST">آزمایش محلی بدون تراکنش</option><option value="LIVE">زرین‌پال واقعی</option></select></label>
      <span className="hint">آمادگی مؤثر: {settings.ready?'آماده':'نیازمند تنظیم امن سرور'} · Callback: {settings.callbackConfigured?'تنظیم‌شده':'تنظیم‌نشده'}</span>
      <button>ذخیره وضعیت درگاه</button>
    </form>}
    <h4>سفارش‌های اخیر</h4>
    <div className="table-wrap"><table><thead><tr><th>بسته</th><th>ظرفیت</th><th>مبلغ</th><th>حالت</th><th>وضعیت</th><th>زمان</th></tr></thead><tbody>{orders.map(item=><tr key={item.id}><td>{item.package_name_snapshot}</td><td>{item.unit_count_snapshot.toLocaleString('fa-IR')} واحد {item.pool_code==='AI'?'هوش مصنوعی':'پشتیبانی'}</td><td>{Number(item.amount_irt_snapshot).toLocaleString('fa-IR')} تومان</td><td>{item.provider_mode==='LIVE'?'واقعی':'محلی'}</td><td>{statusLabel[item.status]??item.status}</td><td>{new Date(item.created_at).toLocaleString('fa-IR')}</td></tr>)}{!orders.length&&<tr><td colSpan={6}>هنوز سفارش پرداختی ثبت نشده است.</td></tr>}</tbody></table></div>
    <h4>ثبت بازپرداخت بیرونی</h4>
    <p className="hint">این فرم پولی جابه‌جا نمی‌کند؛ فقط بازپرداختی را که قبلاً خارج از ژوپیتر انجام شده، با مرجع واقعی ثبت می‌کند.</p>
    <form className="compact-form" onSubmit={recordRefund}>
      <label>سفارش پرداخت‌شده<select required value={refund.orderId} onChange={event=>setRefund({...refund,orderId:event.target.value})}><option value="">انتخاب کنید</option>{paid.map(item=><option key={item.id} value={item.id}>{item.package_name_snapshot} · {Number(item.amount_irt_snapshot).toLocaleString('fa-IR')} تومان</option>)}</select></label>
      <label>مبلغ بازپرداخت (تومان)<input required type="number" min={1} step={1} value={refund.amountIrt||''} onChange={event=>setRefund({...refund,amountIrt:Number(event.target.value)})}/></label>
      <label>مرجع بازپرداخت بیرونی<input required minLength={2} maxLength={200} dir="ltr" value={refund.externalReference} onChange={event=>setRefund({...refund,externalReference:event.target.value})}/></label>
      <label>دلیل<input required minLength={2} maxLength={1000} value={refund.reason} onChange={event=>setRefund({...refund,reason:event.target.value})}/></label>
      <button className="secondary">ثبت سابقه بازپرداخت</button>
    </form>
  </section>;
}
