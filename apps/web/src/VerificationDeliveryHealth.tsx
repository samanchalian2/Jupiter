import { useEffect, useState } from 'react';
import type { Actor } from './App';
import { request } from './App';

type Readiness = { configured: boolean; reasonCode: string; transportVerified: false; recentOutcomes: {status:string;count:number}[] };
const labels: Record<string,string> = { DELIVERED:'پذیرفته‌شده توسط سرویس ارسال', FAILED:'ارسال ناموفق', PENDING_CONFIGURATION:'پیکربندی‌نشده', QUEUED:'در صف ارسال' };
export function VerificationDeliveryHealth({actor}:{actor:Actor}) {
  const [value,setValue]=useState<Readiness|null>(null);
  const [error,setError]=useState('');
  useEffect(()=>{
    let current=true;
    void request('/platform/organization-applications/verification-readiness',actor.session,'')
      .then(result=>{if(current)setValue(result as Readiness);})
      .catch(()=>{if(current)setError('وضعیت ارسال ایمیل در دسترس نیست.');});
    return()=>{current=false;};
  },[actor.session.accessToken]);
  return <section className="verification-panel" aria-label="وضعیت ارسال ایمیل تأیید"><div><strong>ارسال ایمیل تأیید حساب</strong><p role="status">{error||(!value?'در حال بررسی پیکربندی…':value.reasonCode==='LOCAL_TEST_ONLY'?'فقط صندوق آزمایشی محلی؛ ایمیل واقعی ارسال نمی‌شود.':value.configured?'پیکربندی معتبر است؛ اتصال و دریافت Inbox هنوز با این بررسی تأیید نشده‌اند.':value.reasonCode==='DELIVERY_DISABLED'?'ارسال ایمیل غیرفعال است؛ متقاضی پیام تأیید دریافت نمی‌کند.':'پیکربندی ارسال معتبر نیست؛ تنظیمات محیط را بررسی کنید.')}</p>{value&&<p className="hint">نتیجهٔ ۲۴ ساعت اخیر: {value.recentOutcomes.length?value.recentOutcomes.map(row=>`${labels[row.status]??'نامشخص'}: ${row.count.toLocaleString('fa-IR')}`).join(' · '):'پیامی ثبت نشده است'}. پذیرش پیام توسط سرویس به‌معنای تأیید حساب نیست.</p>}</div></section>;
}
