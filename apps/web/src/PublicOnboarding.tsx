import { FormEvent, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, CircleAlert, FileText, MailCheck, RefreshCw } from 'lucide-react';
import { Button, ConfirmDialog } from './ui';

type Membership = { organization_id: string; organization_name?: string; role_codes: string[] };
export type PublicSession = { accessToken: string; user: { displayName: string; email: string | null; platformAdmin?: boolean; memberships: Membership[] } };
type ApiRequest = (path: string, session: PublicSession, organizationId: string, init?: RequestInit) => Promise<unknown>;
type ApplicationStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'NEEDS_INFORMATION' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
type Application = { id: string; organizationName: string; preferredSlug: string | null; contactName: string; contactPhone: string | null; details: Record<string, unknown>; status: ApplicationStatus; createdAt: string; updatedAt: string; submittedAt: string | null; reviewNote: string | null; reviewedAt: string | null; assignedSlug: string | null };
type AccountStatus = { email: string; emailVerified: boolean; verificationDeliveryStatus: 'DELIVERED' | 'PENDING_CONFIGURATION' | 'FAILED' };

const api = import.meta.env.VITE_API_URL ?? '/api/v1';
const applicationLabels: Record<ApplicationStatus, string> = {
  DRAFT: 'پیش‌نویس', SUBMITTED: 'ارسال‌شده', UNDER_REVIEW: 'در حال بررسی', NEEDS_INFORMATION: 'نیازمند اطلاعات', APPROVED: 'تأییدشده', REJECTED: 'ردشده', CANCELLED: 'لغوشده',
};
const editable = (status: ApplicationStatus) => ['DRAFT','NEEDS_INFORMATION'].includes(status);
const idempotencyKey = () => crypto.randomUUID();

async function publicPost(path: string, body: unknown) {
  const response = await fetch(`${api}${path}`, { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'امکان ارتباط با سامانه وجود ندارد.' }));
    throw new Error(error.message ?? 'عملیات انجام نشد.');
  }
  return response.json() as Promise<Record<string, unknown>>;
}

export function PublicRegistration({ onSession, onBack }: { onSession: (session: PublicSession) => void; onBack: () => void }) {
  const [form,setForm] = useState({ displayName: '', email: '', password: '', confirmPassword: '' });
  const [busy,setBusy] = useState(false); const [error,setError] = useState('');
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError('');
    if (form.password !== form.confirmPassword) { setError('تکرار رمز عبور با رمز اصلی یکسان نیست.'); return; }
    setBusy(true);
    try {
      await publicPost('/public/accounts', { displayName: form.displayName, email: form.email, password: form.password });
      const response = await fetch(`${api}/auth/login`, { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ identifier: form.email, password: form.password }) });
      if (!response.ok) throw new Error('حساب ساخته شد، اما ورود خودکار انجام نشد. لطفاً وارد شوید.');
      onSession(await response.json() as PublicSession);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'ساخت حساب ناموفق بود.'); }
    finally { setBusy(false); }
  };
  return <main className="public-access" dir="rtl"><section className="public-access-card"><div className="public-access-intro"><p className="eyebrow">JUPITER / درخواست سازمان</p><h1>شروع راه‌اندازی سازمان</h1><p>حساب مسئول سازمان را بسازید؛ سپس اطلاعات سازمان را تکمیل و برای بررسی ارسال کنید.</p></div><form className="public-form" onSubmit={submit}><label>نام و نام خانوادگی<input value={form.displayName} onChange={(event)=>setForm({...form,displayName:event.target.value})} autoComplete="name" minLength={2} maxLength={160} required autoFocus/></label><label>ایمیل کاری<input dir="ltr" type="email" value={form.email} onChange={(event)=>setForm({...form,email:event.target.value})} autoComplete="email" required/></label><label>رمز عبور<input type="password" value={form.password} onChange={(event)=>setForm({...form,password:event.target.value})} autoComplete="new-password" minLength={10} required/></label><label>تکرار رمز عبور<input type="password" value={form.confirmPassword} onChange={(event)=>setForm({...form,confirmPassword:event.target.value})} autoComplete="new-password" minLength={10} required/></label><p className="hint">پیش از ارسال درخواست، ایمیل شما باید تأیید شود.</p>{error&&<p className="error" role="alert">{error}</p>}<div className="public-actions"><Button loading={busy}>ساخت حساب و ادامه</Button><button type="button" className="secondary" onClick={onBack}>بازگشت به ورود</button></div></form></section></main>;
}

export function EmailVerification({ token, onVerified, onBack }: { token: string; onVerified: () => void; onBack: () => void }) {
  const [busy,setBusy] = useState(false); const [error,setError] = useState(''); const [done,setDone] = useState(false);
  const verify = async () => { setBusy(true); setError(''); try { await publicPost('/public/accounts/verify-email',{token}); setDone(true); } catch (cause) { setError(cause instanceof Error ? cause.message : 'تأیید ایمیل ناموفق بود.'); } finally { setBusy(false); } };
  return <main className="public-access" dir="rtl"><section className="public-access-card compact"><div className="public-access-intro"><MailCheck aria-hidden="true"/><p className="eyebrow">تأیید ایمیل</p><h1>{done ? 'ایمیل شما تأیید شد' : 'تأیید حساب Jupiter'}</h1><p>{done ? 'اکنون می‌توانید درخواست ثبت سازمان را ارسال کنید.' : 'برای فعال‌سازی ارسال درخواست، ایمیل حساب خود را تأیید کنید.'}</p></div>{error&&<p className="error" role="alert">{error}</p>}<div className="public-actions">{done?<Button onClick={onVerified}>ادامه</Button>:<Button loading={busy} onClick={verify}>تأیید ایمیل</Button>}<button type="button" className="secondary" onClick={onBack}>بازگشت</button></div></section></main>;
}

export function ApplicantWorkspace({ session, request, onLogout }: { session: PublicSession; request: ApiRequest; onLogout: () => void }) {
  const [account,setAccount] = useState<AccountStatus|null>(null); const [applications,setApplications] = useState<Application[]>([]); const [loading,setLoading] = useState(true); const [busy,setBusy] = useState(false); const [error,setError] = useState(''); const [notice,setNotice] = useState(''); const [cancelOpen,setCancelOpen] = useState(false);
  const [form,setForm] = useState({ organizationName:'', preferredSlug:'', contactName:session.user.displayName ?? '', contactPhone:'', description:'' });
  const active = useMemo(()=>applications.find((item)=>!['CANCELLED','REJECTED','APPROVED'].includes(item.status)) ?? null,[applications]);
  const displayed = active ?? applications[0] ?? null;
  const load = async () => {
    setLoading(true); setError('');
    try {
      const [nextAccount,nextApplications] = await Promise.all([request('/public/accounts/status',session,''),request('/organization-applications/me',session,'')]);
      setAccount(nextAccount as AccountStatus); const rows = nextApplications as Application[]; setApplications(rows);
      const editableApplication = rows.find((item)=>editable(item.status));
      if (editableApplication) setForm({ organizationName:editableApplication.organizationName,preferredSlug:editableApplication.preferredSlug ?? '',contactName:editableApplication.contactName,contactPhone:editableApplication.contactPhone ?? '',description:typeof editableApplication.details.description==='string'?editableApplication.details.description:'' });
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'دریافت اطلاعات حساب ناموفق بود.'); } finally { setLoading(false); }
  };
  useEffect(()=>{ void load(); },[session.accessToken]);
  const payload = () => ({ organizationName:form.organizationName, preferredSlug:form.preferredSlug||undefined, contactName:form.contactName, contactPhone:form.contactPhone||undefined, details:form.description.trim()?{description:form.description.trim()}:{} });
  const save = async (event: FormEvent) => { event.preventDefault(); setBusy(true); setError(''); try { const target = applications.find((item)=>editable(item.status)); if(target) await request(`/organization-applications/${target.id}`,session,'',{method:'POST',headers:{'idempotency-key':idempotencyKey()},body:JSON.stringify(payload())}); else await request('/organization-applications',session,'',{method:'POST',headers:{'idempotency-key':idempotencyKey()},body:JSON.stringify(payload())}); setNotice('پیش‌نویس درخواست سازمان ذخیره شد.'); await load(); } catch (cause) { setError(cause instanceof Error ? cause.message : 'ذخیرهٔ پیش‌نویس ناموفق بود.'); } finally { setBusy(false); } };
  const submit = async () => { if(!active) return; setBusy(true); setError(''); try { await request(`/organization-applications/${active.id}/submit`,session,'',{method:'POST',headers:{'idempotency-key':idempotencyKey()}}); setNotice('درخواست سازمان برای بررسی ارسال شد.'); await load(); } catch (cause) { setError(cause instanceof Error ? cause.message : 'ارسال درخواست ناموفق بود.'); } finally { setBusy(false); } };
  const cancel = async () => { if(!active) return; setBusy(true); setError(''); try { await request(`/organization-applications/${active.id}/cancel`,session,'',{method:'POST',headers:{'idempotency-key':idempotencyKey()}}); setCancelOpen(false); setNotice('درخواست سازمان لغو شد.'); await load(); } catch (cause) { setError(cause instanceof Error ? cause.message : 'لغو درخواست ناموفق بود.'); } finally { setBusy(false); } };
  const resend = async () => { setBusy(true); setError(''); try { const result=await request('/public/accounts/verification/resend',session,'',{method:'POST'}) as {alreadyVerified:boolean;verificationDeliveryStatus:string}; setNotice(result.alreadyVerified?'ایمیل این حساب قبلاً تأیید شده است.':result.verificationDeliveryStatus==='DELIVERED'?'پیام تأیید دوباره ارسال شد.':'امکان ارسال پیام تأیید در این محیط پیکربندی نشده است.'); await load(); } catch (cause) { setError(cause instanceof Error ? cause.message : 'ارسال مجدد پیام تأیید ناموفق بود.'); } finally { setBusy(false); } };
  const localVerify = async () => { if(!account) return; setBusy(true); setError(''); try { const response=await fetch(`${api}/public/accounts/test/verification-deliveries?email=${encodeURIComponent(account.email)}`,{credentials:'include',headers:{authorization:`Bearer ${session.accessToken}`}}); if(!response.ok) throw new Error('پیام آزمایشی محلی پیدا نشد.'); const delivery=await response.json() as {token:string}; await publicPost('/public/accounts/verify-email',{token:delivery.token}); setNotice('ایمیل در صندوق آزمایشی محلی تأیید شد.'); await load(); } catch(cause) { setError(cause instanceof Error?cause.message:'تأیید محلی ناموفق بود.'); } finally { setBusy(false); } };
  const currentStatus = displayed?.status;
  return <main className="public-access applicant-access" dir="rtl"><section className="public-access-card"><header className="public-workspace-header"><div><p className="eyebrow">JUPITER / درخواست سازمان</p><h1>راه‌اندازی سازمان شما</h1><p>اطلاعات سازمان را ذخیره کنید و پس از تأیید ایمیل، درخواست را برای بررسی ارسال کنید.</p></div><button type="button" className="secondary" onClick={onLogout}>خروج</button></header>{notice&&<p className="notice" role="status">{notice}</p>}{error&&<p className="error" role="alert">{error}</p>}{loading?<p className="hint" role="status">در حال دریافت اطلاعات حساب…</p>:<><section className={`verification-panel ${account?.emailVerified?'verified':'pending'}`}><div>{account?.emailVerified?<CheckCircle2 aria-hidden="true"/>:<CircleAlert aria-hidden="true"/>}<div><strong>{account?.emailVerified?'ایمیل تأیید شده است':'تأیید ایمیل لازم است'}</strong><p dir="ltr">{account?.email}</p></div></div>{!account?.emailVerified&&<div className="inline-actions"><button type="button" className="secondary" onClick={resend} disabled={busy}><RefreshCw size={16}/>ارسال دوباره</button>{import.meta.env.DEV&&<button type="button" className="secondary" onClick={localVerify} disabled={busy}>تأیید از صندوق محلی</button>}</div>}</section>{displayed&&<><section className="application-status"><FileText size={18} aria-hidden="true"/><span>وضعیت درخواست: <strong>{applicationLabels[currentStatus!]}</strong></span>{displayed.submittedAt&&<small>آخرین ارسال: {new Date(displayed.submittedAt).toLocaleDateString('fa-IR')}</small>}</section>{displayed.reviewNote&&<section className="application-review-note"><strong>{currentStatus==='NEEDS_INFORMATION'?'اطلاعات درخواستی از سوی تیم Jupiter':'پیام تیم Jupiter'}</strong><p>{displayed.reviewNote}</p></section>}</>}{(!active||editable(active.status))?<form className="public-form applicant-form" onSubmit={save}><label>نام سازمان<input value={form.organizationName} onChange={(event)=>setForm({...form,organizationName:event.target.value})} minLength={2} maxLength={160} required autoFocus/></label><label>شناسهٔ پیشنهادی سازمان (اختیاری)<input dir="ltr" value={form.preferredSlug} onChange={(event)=>setForm({...form,preferredSlug:event.target.value.toLowerCase()})} pattern="[a-z0-9-]{3,63}" placeholder="example-company"/></label><label>نام مسئول پیگیری<input value={form.contactName} onChange={(event)=>setForm({...form,contactName:event.target.value})} minLength={2} maxLength={160} required/></label><label>شماره تماس (اختیاری)<input dir="ltr" value={form.contactPhone} onChange={(event)=>setForm({...form,contactPhone:event.target.value})} minLength={5} maxLength={40}/></label><label className="form-span">توضیح کوتاه دربارهٔ سازمان (اختیاری)<textarea value={form.description} onChange={(event)=>setForm({...form,description:event.target.value})} maxLength={5000} rows={4}/></label><div className="public-actions form-span"><Button loading={busy}>{active?'ذخیرهٔ تغییرات':'ساخت پیش‌نویس درخواست'}</Button>{active&&<><Button type="button" variant="secondary" loading={busy} disabled={!account?.emailVerified} onClick={submit}>ارسال برای بررسی</Button><button type="button" className="danger-text" onClick={()=>setCancelOpen(true)} disabled={busy}>لغو درخواست</button></>}</div></form>:<section className="application-complete"><p>{currentStatus==='SUBMITTED'?'درخواست شما ثبت شده و در صف بررسی است. در صورت نیاز، تیم Jupiter اطلاعات تکمیلی را درخواست می‌کند.':currentStatus==='APPROVED'?<>درخواست تأیید شده است؛ سازمان با شناسهٔ <span dir="ltr">{displayed.assignedSlug??'—'}</span> در وضعیت راه‌اندازی قرار گرفت و مراحل ورود به فضای اختصاصی در ادامه فعال می‌شود.</>:'این درخواست در این مرحله قابل ویرایش نیست.'}</p></section>}</>}</section><ConfirmDialog open={cancelOpen} title="لغو درخواست سازمان" body="این درخواست از چرخهٔ بررسی خارج می‌شود. تا پیش از تأیید نهایی می‌توانید بعداً درخواست تازه‌ای ثبت کنید." confirmLabel="لغو درخواست" danger onConfirm={()=>void cancel()} onClose={()=>setCancelOpen(false)}/></main>;
}
