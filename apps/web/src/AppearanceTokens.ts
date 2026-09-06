export type AppearanceSource = 'SYSTEM' | 'PLATFORM' | 'ORGANIZATION';
export type PlatformAppearanceValue = { brandPreset: 'JUPITER' | 'OCEAN' | 'TEAL'; densityPreset: 'COMFORTABLE' | 'STANDARD' | 'COMPACT'; radiusPreset: 'SMALL' | 'MEDIUM' | 'LARGE'; logoUrl: string | null; customPrimary?: string | null; effectivePrimary?: string; primarySource?: AppearanceSource; onPrimary?: string };
export const JUPITER_PRIMARY = '#315399';
const DARK_ON_PRIMARY = '#172033'; const LIGHT_SURFACE = '#FFFFFF';
const presetPrimary: Record<PlatformAppearanceValue['brandPreset'], string> = { JUPITER: JUPITER_PRIMARY, OCEAN: '#266A91', TEAL: '#176C68' };
type Rgb = { r: number; g: number; b: number };
const toRgb = (value: string): Rgb => ({ r: Number.parseInt(value.slice(1, 3), 16), g: Number.parseInt(value.slice(3, 5), 16), b: Number.parseInt(value.slice(5, 7), 16) });
const toHex = ({ r, g, b }: Rgb) => `#${[r, g, b].map((channel) => Math.round(channel).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
const mix = (from: string, to: string, amount: number) => { const start = toRgb(from); const end = toRgb(to); return toHex({ r: start.r + (end.r - start.r) * amount, g: start.g + (end.g - start.g) * amount, b: start.b + (end.b - start.b) * amount }); };
const luminanceChannel = (channel: number) => { const value = channel / 255; return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4; };
export const contrastRatio = (left: string, right: string) => { const luminance = (value: string) => { const rgb = toRgb(value); return 0.2126 * luminanceChannel(rgb.r) + 0.7152 * luminanceChannel(rgb.g) + 0.0722 * luminanceChannel(rgb.b); }; const [lighter, darker] = [luminance(left), luminance(right)].sort((a, b) => b - a); return (lighter + 0.05) / (darker + 0.05); };
export type DerivedPrimaryTokens = { primary: string; primaryHover: string; primaryActive: string; primarySubtle: string; primaryBorder: string; primaryText: string; onPrimary: string };
export function derivePrimaryTokens(primary: string): DerivedPrimaryTokens {
  const canonical = primary.toUpperCase(); const whiteContrast = contrastRatio(canonical, LIGHT_SURFACE); const darkContrast = contrastRatio(canonical, DARK_ON_PRIMARY); const onPrimary = whiteContrast >= 4.5 ? LIGHT_SURFACE : darkContrast >= 4.5 ? DARK_ON_PRIMARY : null;
  if (!onPrimary) throw new Error('رنگ انتخاب‌شده برای استفاده در رابط کاربری کنتراست کافی ندارد.');
  let primaryText = canonical;
  if (contrastRatio(primaryText, LIGHT_SURFACE) < 4.5) for (let amount = 0.01; amount <= 1; amount += 0.01) { const candidate = mix(canonical, DARK_ON_PRIMARY, amount); if (contrastRatio(candidate, LIGHT_SURFACE) >= 4.5) { primaryText = candidate; break; } }
  return { primary: canonical, primaryHover: mix(canonical, '#000000', 0.15), primaryActive: mix(canonical, '#000000', 0.28), primarySubtle: mix(canonical, LIGHT_SURFACE, 0.92), primaryBorder: mix(canonical, LIGHT_SURFACE, 0.72), primaryText, onPrimary };
}
export function applyPlatformAppearance(value: PlatformAppearanceValue) {
  const root = document.documentElement; const primary = value.effectivePrimary ?? value.customPrimary ?? presetPrimary[value.brandPreset] ?? JUPITER_PRIMARY; const colors = derivePrimaryTokens(primary);
  root.style.setProperty('--color-brand', colors.primary); root.style.setProperty('--color-brand-hover', colors.primaryHover); root.style.setProperty('--color-brand-active', colors.primaryActive); root.style.setProperty('--color-brand-soft', colors.primarySubtle); root.style.setProperty('--color-brand-border', colors.primaryBorder);
  root.style.setProperty('--primary', colors.primary); root.style.setProperty('--primary-dark', colors.primaryHover); root.style.setProperty('--primary-soft', colors.primarySubtle); root.style.setProperty('--primary-border', colors.primaryBorder); root.style.setProperty('--primary-text', colors.primaryText); root.style.setProperty('--on-primary', colors.onPrimary); root.style.setProperty('--accent', colors.primary); root.style.setProperty('--focus', `0 0 0 2px var(--color-surface), 0 0 0 4px ${colors.primaryText}`);
  root.dataset.uiDensity = value.densityPreset.toLowerCase(); root.dataset.uiRadius = value.radiusPreset.toLowerCase(); document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute('content', colors.primary); window.dispatchEvent(new CustomEvent('jupiter:platform-appearance-updated', { detail: { logoUrl: value.logoUrl } }));
}
