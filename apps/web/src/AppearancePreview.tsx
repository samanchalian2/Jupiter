import { derivePrimaryTokens } from './AppearanceTokens';

export function AppearancePreview({ primary }: { primary: string }) {
  let tokens;
  try { tokens = derivePrimaryTokens(primary); } catch { return null; }
  return <section className="appearance-preview" aria-label="پیش‌نمایش رنگ اصلی">
    <div className="appearance-preview-row"><button type="button" style={{ backgroundColor: tokens.primary, color: tokens.onPrimary }}>دکمهٔ اصلی</button><button type="button" className="secondary">دکمهٔ خنثی</button><a href="#appearance-preview" onClick={(event) => event.preventDefault()} style={{ color: tokens.primaryText }}>پیوند تعاملی</a></div>
    <div className="appearance-preview-row"><span className="appearance-preview-nav" style={{ backgroundColor: tokens.primarySubtle, color: tokens.primaryText, borderColor: tokens.primaryBorder }}>ناوبری انتخاب‌شده</span><span className="appearance-preview-chip" style={{ backgroundColor: tokens.primarySubtle, color: tokens.primaryText, borderColor: tokens.primaryBorder }}>برچسب اصلی</span><button type="button" className="appearance-preview-focus" style={{ boxShadow: `0 0 0 2px #fff, 0 0 0 4px ${tokens.primaryText}` }}>focus</button></div>
    <div className="appearance-preview-row appearance-preview-semantics"><span className="success">موفق</span><span className="warning">هشدار</span><span className="error">خطا</span></div>
  </section>;
}
