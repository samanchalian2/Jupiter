import { BadRequestException } from '@nestjs/common';

export const JUPITER_PRIMARY = '#315399';
export const DARK_ON_PRIMARY = '#172033';
export const LIGHT_SURFACE = '#FFFFFF';

export type PrimaryTokens = {
  primary: string;
  primaryHover: string;
  primaryActive: string;
  primarySubtle: string;
  primaryBorder: string;
  primaryText: string;
  onPrimary: string;
};

type Rgb = { r: number; g: number; b: number };

function toRgb(value: string): Rgb {
  return { r: Number.parseInt(value.slice(1, 3), 16), g: Number.parseInt(value.slice(3, 5), 16), b: Number.parseInt(value.slice(5, 7), 16) };
}

function toHex({ r, g, b }: Rgb) {
  return `#${[r, g, b].map((channel) => Math.round(channel).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

function mix(from: string, to: string, amount: number) {
  const start = toRgb(from); const end = toRgb(to);
  return toHex({ r: start.r + (end.r - start.r) * amount, g: start.g + (end.g - start.g) * amount, b: start.b + (end.b - start.b) * amount });
}

function luminanceChannel(channel: number) {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

export function contrastRatio(left: string, right: string) {
  const luminance = (value: string) => { const rgb = toRgb(value); return 0.2126 * luminanceChannel(rgb.r) + 0.7152 * luminanceChannel(rgb.g) + 0.0722 * luminanceChannel(rgb.b); };
  const [lighter, darker] = [luminance(left), luminance(right)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

function accessibleTextPrimary(primary: string) {
  if (contrastRatio(primary, LIGHT_SURFACE) >= 4.5) return primary;
  for (let amount = 0.01; amount <= 1; amount += 0.01) {
    const candidate = mix(primary, DARK_ON_PRIMARY, amount);
    if (contrastRatio(candidate, LIGHT_SURFACE) >= 4.5) return candidate;
  }
  return DARK_ON_PRIMARY;
}

export function derivePrimaryTokens(primary: string): PrimaryTokens {
  const canonical = primary.toUpperCase();
  const whiteContrast = contrastRatio(canonical, LIGHT_SURFACE);
  const darkContrast = contrastRatio(canonical, DARK_ON_PRIMARY);
  const onPrimary = whiteContrast >= 4.5 ? LIGHT_SURFACE : darkContrast >= 4.5 ? DARK_ON_PRIMARY : null;
  if (!onPrimary) throw new BadRequestException('رنگ انتخاب‌شده برای استفاده در رابط کاربری کنتراست کافی ندارد.');
  return {
    primary: canonical,
    primaryHover: mix(canonical, '#000000', 0.15),
    primaryActive: mix(canonical, '#000000', 0.28),
    primarySubtle: mix(canonical, LIGHT_SURFACE, 0.92),
    primaryBorder: mix(canonical, LIGHT_SURFACE, 0.72),
    primaryText: accessibleTextPrimary(canonical),
    onPrimary,
  };
}

export function normalizeCustomPrimary(value: unknown) {
  if (typeof value !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(value.trim())) throw new BadRequestException('رنگ باید در قالب #RRGGBB وارد شود.');
  const canonical = value.trim().toUpperCase();
  derivePrimaryTokens(canonical);
  return canonical;
}
