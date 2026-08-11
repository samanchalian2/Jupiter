import { FormEvent, useEffect, useState } from 'react';

type Actor = { session: { accessToken: string }; organizationId: string };
type Ticket = { id: string; title: string };
type AiRequest = { id: string; status: string; redacted_input?: { text?: string }; output?: { title?: string; normalizedDescription?: string; priority?: string; confidence?: number }; usage?: { inputTokens?: number; outputTokens?: number } };
type Attachment = { id: string; original_filename: string };
type Job = { id: string; attachment_id: string; status: string; attempts: number; transcript?: string; last_error?: string };
const api = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

function request(path: string, actor: Actor, init?: RequestInit) {
  return fetch(`${api}${path}`, { ...init, headers: { 'content-type': 'application/json', authorization: `Bearer ${actor.session.accessToken}`, 'x-organization-id': actor.organizationId, ...(init?.headers ?? {}) } }).then(async (response) => {
    if (!response.ok) throw new Error((await response.json().catch(() => ({ message: 'خطا در ارتباط با سرور' }))).message);
    return response.status === 204 ? undefined : response.json();
  });
}

export function AiAssistant({ actor, ticket, onRefresh }: { actor: Actor; ticket: Ticket; onRefresh: () => void }) {
  const [text, setText] = useState(ticket.title); const [requests, setRequests] = useState<AiRequest[]>([]); const [attachments, setAttachments] = useState<Attachment[]>([]); const [jobs, setJobs] = useState<Job[]>([]); const [notice, setNotice] = useState('');
  const load = () => { request(`/platform/ai-settings/requests/ticket/${ticket.id}`, actor).then(setRequests).catch(() => setRequests([])); request(`/tickets/${ticket.id}/attachments`, actor).then(setAttachments).catch(() => setAttachments([])); request(`/tickets/${ticket.id}/transcription`, actor).then(setJobs).catch(() => setJobs([])); };
  useEffect(() => { void load(); }, [ticket.id, actor.organizationId, actor.session.accessToken]);
  const submitAi = async (event: FormEvent) => { event.preventDefault(); const created = await request(`/platform/ai-settings/requests/${ticket.id}`, actor, { method: 'POST', body: JSON.stringify({ text }) }) as AiRequest; setNotice(`پیشنهاد AI در صف پردازش قرار گرفت (${created.status}). شما می‌توانید بدون انتظار، تیکت را دستی پیگیری کنید.`); setText(ticket.title); load(); };
  const confirm = async (item: AiRequest) => { await request(`/platform/ai-settings/requests/${item.id}/confirm`, actor, { method: 'POST' }); setNotice('پیشنهاد پس از تأیید شما روی تیکت اعمال شد.'); onRefresh(); load(); };
  const createJob = async (attachmentId: string) => { await request(`/tickets/${ticket.id}/transcription`, actor, { method: 'POST', body: JSON.stringify({ attachmentId }) }); setNotice('تبدیل صوت در صف قرار گرفت؛ ادامهٔ دستی تیکت همچنان در دسترس است.'); load(); };
  const retry = async (job: Job) => { await request(`/tickets/${ticket.id}/transcription/${job.id}/retry`, actor, { method: 'POST' }); setNotice('تلاش مجدد برای تبدیل صوت در صف قرار گرفت.'); load(); };
  return <section className="card"><h3>دستیار هوشمند</h3><p className="hint">AI اختیاری است و هیچ مرحله‌ای از ثبت یا پیگیری دستی تیکت را متوقف نمی‌کند. خروجی فقط پس از تأیید شما اعمال می‌شود.</p><form onSubmit={(event) => submitAi(event).catch((cause) => setNotice(cause.message))}><label>متن برای بررسی AI<textarea value={text} onChange={(event) => setText(event.target.value)} minLength={3} maxLength={20000} required /></label><button>دریافت پیشنهاد AI</button></form>{requests.map((item) => <article key={item.id}><strong>وضعیت پیشنهاد: {item.status}</strong>{item.status === 'SUCCEEDED' && item.output && <><p>{item.output.title ?? 'بدون عنوان'} · {item.output.priority ?? 'بدون اولویت'} · اطمینان {item.output.confidence ?? '—'}</p><p>{item.output.normalizedDescription}</p><button className="secondary" onClick={() => confirm(item).catch((cause) => setNotice(cause.message))}>تأیید و اعمال پیشنهاد</button></>}{item.status === 'FAILED' && <p className="hint">پیشنهاد AI در دسترس نیست؛ لطفاً رسیدگی دستی را ادامه دهید.</p>}</article>)}<h3>تبدیل صوت پیوست</h3>{attachments.length === 0 && <p className="hint">برای تبدیل صوت، ابتدا یک پیوست در تیکت بارگذاری کنید.</p>}{attachments.map((attachment) => <p key={attachment.id}><span>{attachment.original_filename}</span> <button className="secondary" onClick={() => createJob(attachment.id).catch((cause) => setNotice(cause.message))}>درخواست تبدیل صوت</button></p>)}{jobs.map((job) => <article key={job.id}><strong>وضعیت تبدیل: {job.status}</strong><p className="hint">تلاش‌ها: {job.attempts}{job.last_error ? ' · خطای ارائه‌دهنده' : ''}</p>{job.transcript && <p>{job.transcript}</p>}{['RETRY', 'DEAD_LETTER'].includes(job.status) && <button className="secondary" onClick={() => retry(job).catch((cause) => setNotice(cause.message))}>تلاش مجدد</button>}</article>)}{notice && <p className="hint">{notice}</p>}</section>;
}
