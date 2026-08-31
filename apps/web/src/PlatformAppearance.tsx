import { FormEvent, useEffect, useState } from 'react';
import type { Actor } from './App';
import { request } from './App';
import { applyPlatformAppearance, type PlatformAppearanceValue as Appearance } from './AppearanceTokens';

const blank: Appearance = { brandPreset: 'JUPITER', densityPreset: 'STANDARD', radiusPreset: 'MEDIUM', logoUrl: null };
const labels = { JUPITER: 'بنفش ژوپیتر', OCEAN: 'آبی متین', TEAL: 'سبز نفتی', COMFORTABLE: 'راحت', STANDARD: 'استاندارد', COMPACT: 'فشرده', SMALL: 'کوچک', MEDIUM: 'متوسط', LARGE: 'بزرگ' } as const;

export function PlatformAppearance({ actor, onSaved, onError }: { actor: Actor; onSaved: (message: string) => void; onError: (message: string) => void }) {
  const [value, setValue] = useState<Appearance>(blank);
  const [loading, setLoading] = useState(true);
  const load = () => request('/appearance', actor.session, actor.organizationId).then((next) => { const safe = next as Appearance; setValue(safe); applyPlatformAppearance(safe); }).catch((cause) => onError(cause instanceof Error ? cause.message : 'دریافت تنظیمات ظاهر ناموفق بود.')).finally(() => setLoading(false));
  useEffect(() => { void load(); }, [actor.session.accessToken]);
  const save = async (event: FormEvent) => { event.preventDefault(); try { const next = await request('/appearance', actor.session, actor.organizationId, { method: 'POST', body: JSON.stringify(value) }) as Appearance; setValue(next); applyPlatformAppearance(next); onSaved('ظاهر و هویت بصری پلتفرم به‌روزرسانی شد.'); } catch (cause) { onError(cause instanceof Error ? cause.message : 'ذخیره تنظیمات ظاهر ناموفق بود.'); } };
  if (loading) return <p className="hint" role="status">در حال دریافت تنظیمات ظاهر…</p>;
  return <section className="card platform-appearance"><h3>ظاهر و هویت بصری</h3><p className="hint">فقط presetهای تأییدشده اعمال می‌شوند. سازمان‌ها می‌توانند لوگوی خود را نمایش دهند، اما رنگ‌های معنایی، ساختار و کنترل‌های امنیتی پلتفرم را تغییر نمی‌دهند.</p><form onSubmit={save} className="compact-form"><label>رنگ اصلی<select value={value.brandPreset} onChange={(event) => setValue({ ...value, brandPreset: event.target.value as Appearance['brandPreset'] })}>{(['JUPITER','OCEAN','TEAL'] as const).map((item) => <option key={item} value={item}>{labels[item]}</option>)}</select></label><label>تراکم نمایش<select value={value.densityPreset} onChange={(event) => setValue({ ...value, densityPreset: event.target.value as Appearance['densityPreset'] })}>{(['COMFORTABLE','STANDARD','COMPACT'] as const).map((item) => <option key={item} value={item}>{labels[item]}</option>)}</select></label><label>گردی گوشه‌ها<select value={value.radiusPreset} onChange={(event) => setValue({ ...value, radiusPreset: event.target.value as Appearance['radiusPreset'] })}>{(['SMALL','MEDIUM','LARGE'] as const).map((item) => <option key={item} value={item}>{labels[item]}</option>)}</select></label><label>نشانی لوگوی پیش‌فرض (داخلی)<input dir="ltr" value={value.logoUrl ?? ''} onChange={(event) => setValue({ ...value, logoUrl: event.target.value || null })} placeholder="/jupiter-logo.png" pattern="/[A-Za-z0-9._/-]{1,512}" /></label><button>ذخیرهٔ ظاهر</button></form><p className="hint">لوگو باید یک مسیر داخلیِ مدیریت‌شده باشد. CSS یا JavaScript دلخواه پذیرفته نمی‌شود؛ کنتراست presetها پیش از انتشار بررسی شده است.</p></section>;
}
