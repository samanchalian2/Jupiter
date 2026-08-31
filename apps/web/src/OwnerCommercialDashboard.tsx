import { useEffect, useState } from 'react';
import type { Actor } from './App';
import { request } from './App';

type Allowance = { capability_code: string; allocation_type: string; granted_units: number; period_ends_at: string };
type Addon = { capability_code: string; granted_units: number; created_at: string };
type Dashboard = {
  allowances: Allowance[];
  addons: Addon[];
  ai: { request_count: number; token_count: number };
  assist: { capacity_units: number; request_policy: string; default_access_scope: string; assist_sla_minutes: number; active_cases: number } | null;
};

const policyLabel: Record<string, string> = {
  DISABLED: 'غیرفعال',
  ADMIN_APPROVAL_REQUIRED: 'نیازمند تأیید مدیر',
  USER_REQUEST_ALLOWED: 'درخواست کاربران مجاز است',
};

function number(value: number) { return Number(value ?? 0).toLocaleString('fa-IR'); }
function date(value: string) { return new Date(value).toLocaleDateString('fa-IR'); }

export function OwnerCommercialDashboard({ actor }: { actor: Actor }) {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setData(null);
    setError('');
    void request('/platform/commercial/owner-dashboard', actor.session, actor.organizationId)
      .then((result) => setData(result as Dashboard))
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'دریافت نمای تجاری ناموفق بود.'));
  }, [actor.organizationId, actor.session]);

  if (error) return <p className="error" role="alert">{error}</p>;
  if (!data) return <p className="hint" role="status">در حال دریافت نمای تجاری…</p>;

  return <div className="admin-stack owner-commercial-dashboard">
    <section className="card">
      <h3>نمای تجاری سازمان</h3>
      <p className="hint">این نما فقط اطلاعات سازمان شما را نشان می‌دهد. قرارداد، قیمت‌گذاری و تخصیص‌ها توسط تیم پلتفرم مدیریت می‌شوند.</p>
      <div className="metrics-grid" aria-label="خلاصه تجاری">
        <article className="metric-card"><span>سهمیه فعال</span><strong>{number(data.allowances.reduce((sum, item) => sum + item.granted_units, 0))}</strong><small>واحد در دوره‌های فعال</small></article>
        <article className="metric-card"><span>بسته افزایشی</span><strong>{number(data.addons.reduce((sum, item) => sum + item.granted_units, 0))}</strong><small>واحد تخصیص‌یافته</small></article>
        <article className="metric-card"><span>تکمیل هوشمند</span><strong>{number(data.ai.request_count)}</strong><small>{number(data.ai.token_count)} توکن عملیاتی ثبت‌شده</small></article>
        <article className="metric-card"><span>درخواست کمک</span><strong>{number(data.assist?.active_cases ?? 0)}</strong><small>پرونده فعال نزد Jupiter</small></article>
      </div>
    </section>
    <div className="admin-grid">
      <section className="card">
        <h3>سهمیه و بسته‌ها</h3>
        {data.allowances.length ? <div className="table-wrap"><table><thead><tr><th>قابلیت</th><th>نوع</th><th>واحد</th><th>انقضا</th></tr></thead><tbody>{data.allowances.map((item, index) => <tr key={`${item.capability_code}-${index}`}><td dir="ltr">{item.capability_code}</td><td>{item.allocation_type === 'EMERGENCY' ? 'مصرف مازاد' : 'دوره‌ای'}</td><td>{number(item.granted_units)}</td><td>{date(item.period_ends_at)}</td></tr>)}</tbody></table></div> : <p className="hint">در حال حاضر سهمیه فعالی ثبت نشده است.</p>}
        {data.addons.length ? <div className="list-compact">{data.addons.map((item, index) => <p key={`${item.capability_code}-${item.created_at}-${index}`}><span dir="ltr">{item.capability_code}</span> · {number(item.granted_units)} واحد · {date(item.created_at)}</p>)}</div> : <p className="hint">بسته افزایشی فعالی ثبت نشده است.</p>}
      </section>
      <section className="card">
        <h3>پشتیبانی موردی Jupiter</h3>
        {data.assist ? <div className="list-compact"><p>روش درخواست: {policyLabel[data.assist.request_policy] ?? data.assist.request_policy}</p><p>ظرفیت باقیمانده: {number(data.assist.capacity_units)} واحد</p><p>دامنه پیش‌فرض: {data.assist.default_access_scope === 'ROUTED_ONLY' ? 'فقط تیکت ارجاع‌شده' : data.assist.default_access_scope}</p><p>هدف پاسخ‌گویی: {number(data.assist.assist_sla_minutes)} دقیقه</p><p className="hint">پذیرش پرونده توسط کارشناس Jupiter، نه صرف ثبت درخواست، از ظرفیت استفاده می‌کند.</p></div> : <p className="hint">پشتیبانی موردی برای این سازمان فعال نشده است.</p>}
      </section>
    </div>
  </div>;
}
