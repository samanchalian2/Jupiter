import { useEffect, useState } from 'react';
import type { Actor } from './App';
import { request } from './App';
import { AppearancePreview } from './AppearancePreview';
import { JUPITER_PRIMARY, type PlatformAppearanceValue } from './AppearanceTokens';

const hex = (value: string) => /^#[0-9a-fA-F]{6}$/.test(value.trim());
const sourceLabel = { SYSTEM: 'پیش‌فرض ژوپیتر', PLATFORM: 'پلتفرم', ORGANIZATION: 'سازمان' } as const;

export function OrganizationAppearance({ actor, onNotice }: { actor: Actor; onNotice: (message: string) => void }) {
  const [appearance, setAppearance] = useState<PlatformAppearanceValue | null>(null);
  const [customPrimary, setCustomPrimary] = useState('');
  const [error, setError] = useState('');
  const load = () => request('/appearance/organization', actor.session, actor.organizationId).then((next) => { const value = next as PlatformAppearanceValue; setAppearance(value); setCustomPrimary(value.customPrimary ?? ''); }).catch((cause) => setError(cause instanceof Error ? cause.message : 'دریافت ظاهر سازمان ناموفق بود.'));
  useEffect(() => { void load(); }, [actor.organizationId]);
  const save = async () => { if (!hex(customPrimary)) { setError('رنگ باید در قالب #RRGGBB وارد شود.'); return; } try { const next = await request('/appearance/organization', actor.session, actor.organizationId, { method: 'POST', body: JSON.stringify({ customPrimary }) }) as PlatformAppearanceValue; setAppearance(next); setCustomPrimary(next.customPrimary ?? ''); setError(''); onNotice('رنگ اصلی سازمان به‌روزرسانی شد.'); } catch (cause) { setError(cause instanceof Error ? cause.message : 'ذخیرهٔ رنگ سازمان ناموفق بود.'); } };
  const reset = async () => { try { const next = await request('/appearance/organization/reset-primary', actor.session, actor.organizationId, { method: 'POST' }) as PlatformAppearanceValue; setAppearance(next); setCustomPrimary(''); setError(''); onNotice('رنگ سازمان حذف شد و از پلتفرم ارث می‌برد.'); } catch (cause) { setError(cause instanceof Error ? cause.message : 'بازگشت رنگ سازمان ناموفق بود.'); } };
  const effective = customPrimary || appearance?.effectivePrimary || JUPITER_PRIMARY;
  return <section className="organization-primary-controls"><h4>رنگ اصلی سازمان</h4><p className="hint">در نبود رنگ سفارشی، سازمان رنگ مؤثر پلتفرم را دریافت می‌کند.</p><label>رنگ سفارشی<input dir="ltr" value={customPrimary} onChange={(event) => setCustomPrimary(event.target.value)} placeholder="#014348" aria-invalid={Boolean(customPrimary && !hex(customPrimary))}/></label>{customPrimary && !hex(customPrimary) && <p className="error" role="alert">رنگ باید در قالب #RRGGBB وارد شود.</p>}<p className="hint">رنگ مؤثر: <b dir="ltr">{effective}</b> · منبع: {sourceLabel[appearance?.primarySource ?? 'SYSTEM']}</p><AppearancePreview primary={effective}/><div className="inline-actions"><button type="button" onClick={() => void save()} disabled={!customPrimary || !hex(customPrimary)}>ذخیرهٔ رنگ سازمان</button><button type="button" className="secondary" onClick={() => void reset()} disabled={!appearance?.customPrimary}>بازگشت به پیش‌فرض</button></div>{error && <p className="error" role="alert">{error}</p>}</section>;
}
