import { FormEvent, useEffect, useMemo, useState } from 'react';

type Membership = { organization_id: string; role_codes: string[] };
type Session = { accessToken: string; user: { displayName: string; memberships: Membership[] } };
type Ticket = { id: string; ticket_number: number; title: string; status: string; priority: string; created_at: string };
type Message = { id: string; author_display_name: string; body: string; created_at: string };
const api = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

function request(path: string, session: Session, organizationId: string, init?: RequestInit) {
  return fetch(`${api}${path}`, { ...init, headers: { 'content-type': 'application/json', authorization: `Bearer ${session.accessToken}`, 'x-organization-id': organizationId, ...(init?.headers ?? {}) } }).then(async (response) => {
    if (!response.ok) throw new Error((await response.json().catch(() => ({ message: 'خطای ارتباط با سرور' }))).message);
    return response.status === 204 ? undefined : response.json();
  });
}

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [organizationId, setOrganizationId] = useState('');
  if (!session) return <Login onSession={(value) => { setSession(value); setOrganizationId(value.user.memberships[0]?.organization_id ?? ''); }} />;
  const membership = session.user.memberships.find((item) => item.organization_id === organizationId) ?? session.user.memberships[0];
  if (!membership) return <main className="shell"><section className="card"><h1>ژوپیتر</h1><p>برای این حساب سازمان فعالی وجود ندارد.</p></section></main>;
  return <Portal session={session} organizationId={organizationId} membership={membership} onOrganization={setOrganizationId} onLogout={() => setSession(null)} />;
}

function Login({ onSession }: { onSession: (session: Session) => void }) {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); setBusy(true); setError(''); try { const response = await fetch(`${api}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) }); if (!response.ok) throw new Error('اطلاعات ورود صحیح نیست.'); onSession(await response.json()); } catch (cause) { setError(cause instanceof Error ? cause.message : 'ورود ناموفق بود.'); } finally { setBusy(false); } }
  return <main className="shell login"><section className="card"><p className="eyebrow">JUPITER</p><h1>سامانه تیکتینگ سازمانی</h1><p>با حساب سازمانی خود وارد شوید.</p><form onSubmit={submit}><label>ایمیل<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required /></label><label>رمز عبور<input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required /></label>{error && <p className="error">{error}</p>}<button disabled={busy}>{busy ? 'در حال ورود…' : 'ورود'}</button></form></section></main>;
}

function Portal({ session, organizationId, membership, onOrganization, onLogout }: { session: Session; organizationId: string; membership: Membership; onOrganization: (id: string) => void; onLogout: () => void }) {
  const [tickets, setTickets] = useState<Ticket[]>([]); const [selected, setSelected] = useState<Ticket | null>(null); const [error, setError] = useState(''); const [refresh, setRefresh] = useState(0);
  const staff = membership.role_codes.some((role) => ['ORG_ADMIN', 'SUPERVISOR', 'EXPERT'].includes(role));
  useEffect(() => { setSelected(null); request('/tickets', session, organizationId).then(setTickets).catch((cause) => setError(cause.message)); }, [session, organizationId, refresh]);
  const roleTitle = useMemo(() => membership.role_codes.map((role) => ({ REQUESTER: 'درخواست‌کننده', EXPERT: 'کارشناس', SUPERVISOR: 'سرپرست', ORG_ADMIN: 'مدیر سازمان' }[role] ?? role)).join('، '), [membership]);
  return <main className="portal"><header><div><p className="eyebrow">JUPITER / {roleTitle}</p><h1>میز کار تیکت‌ها</h1></div><div className="header-actions"><select aria-label="سازمان" value={organizationId} onChange={(e) => onOrganization(e.target.value)}>{session.user.memberships.map((item) => <option key={item.organization_id} value={item.organization_id}>سازمان {item.organization_id.slice(0, 8)}</option>)}</select><button className="secondary" onClick={onLogout}>خروج</button></div></header><section className="workspace"><aside className="card sidebar"><button onClick={() => setRefresh((value) => value + 1)}>تازه‌سازی تیکت‌ها</button><p>{staff ? 'صف تیکت‌های مجاز شما' : 'تیکت‌های ثبت‌شده شما'}</p>{tickets.map((ticket) => <button className={`ticket ${selected?.id === ticket.id ? 'active' : ''}`} key={ticket.id} onClick={() => setSelected(ticket)}><strong>#{ticket.ticket_number} · {ticket.title}</strong><span>{ticket.status} · {ticket.priority}</span></button>)}{tickets.length === 0 && <p>تیکتی برای نمایش وجود ندارد.</p>}</aside><section className="card content">{error && <p className="error">{error}</p>}{selected ? <TicketPanel session={session} organizationId={organizationId} ticket={selected} staff={staff} onRefresh={() => setRefresh((value) => value + 1)} /> : <NewTicket session={session} organizationId={organizationId} onCreated={() => setRefresh((value) => value + 1)} />}</section></section></main>;
}

function NewTicket({ session, organizationId, onCreated }: { session: Session; organizationId: string; onCreated: () => void }) { const [title, setTitle] = useState(''); const [description, setDescription] = useState(''); const [notice, setNotice] = useState(''); async function submit(event: FormEvent) { event.preventDefault(); const draft = await request('/tickets/drafts', session, organizationId, { method: 'POST', body: JSON.stringify({ title, description }) }); await request(`/tickets/${draft.id}/submit`, session, organizationId, { method: 'POST' }); setNotice('تیکت با موفقیت ثبت شد.'); setTitle(''); setDescription(''); onCreated(); } return <><h2>ثبت درخواست جدید</h2><form onSubmit={(event) => submit(event).catch((cause) => setNotice(cause.message))}><label>عنوان<input value={title} onChange={(e) => setTitle(e.target.value)} minLength={3} required /></label><label>شرح درخواست<textarea value={description} onChange={(e) => setDescription(e.target.value)} required /></label><button>ثبت و ارسال</button>{notice && <p>{notice}</p>}</form></>; }

function TicketPanel({ session, organizationId, ticket, staff, onRefresh }: { session: Session; organizationId: string; ticket: Ticket; staff: boolean; onRefresh: () => void }) { const [messages, setMessages] = useState<Message[]>([]); const [body, setBody] = useState(''); const [notice, setNotice] = useState(''); const load = () => request(`/tickets/${ticket.id}/messages`, session, organizationId).then(setMessages).catch((cause) => setNotice(cause.message)); useEffect(() => { load(); }, [ticket.id]); async function send(event: FormEvent) { event.preventDefault(); await request(`/tickets/${ticket.id}/messages`, session, organizationId, { method: 'POST', body: JSON.stringify({ body }) }); setBody(''); load(); } async function status(status: string) { await request(`/tickets/${ticket.id}/status`, session, organizationId, { method: 'POST', body: JSON.stringify({ status }) }); setNotice('وضعیت تیکت به‌روزرسانی شد.'); onRefresh(); } return <><div className="ticket-heading"><div><p className="eyebrow">#{ticket.ticket_number} · {ticket.status}</p><h2>{ticket.title}</h2></div>{staff && <div className="actions"><button className="secondary" onClick={() => status('IN_PROGRESS')}>شروع رسیدگی</button><button className="secondary" onClick={() => status('RESOLVED')}>حل شد</button></div>}</div><h3>گفت‌وگو</h3><div className="messages">{messages.map((message) => <article key={message.id}><strong>{message.author_display_name}</strong><p>{message.body}</p></article>)}</div><form onSubmit={(event) => send(event).catch((cause) => setNotice(cause.message))}><label>پیام<textarea value={body} onChange={(e) => setBody(e.target.value)} required /></label><button>ارسال پیام</button></form>{staff && <p className="hint">یادداشت‌های داخلی فقط از API کارکنان خوانده می‌شوند و در این نمای درخواست‌کننده نمایش داده نمی‌شوند.</p>}{notice && <p>{notice}</p>}</>;
}
