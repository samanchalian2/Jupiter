export type PlatformAppearanceValue = { brandPreset: 'JUPITER' | 'OCEAN' | 'TEAL'; densityPreset: 'COMFORTABLE' | 'STANDARD' | 'COMPACT'; radiusPreset: 'SMALL' | 'MEDIUM' | 'LARGE'; logoUrl: string | null };

const palette: Record<PlatformAppearanceValue['brandPreset'], { brand: string; hover: string; soft: string; border: string; focus: string }> = {
  JUPITER: { brand: '#6d5587', hover: '#59436f', soft: '#f4f0f6', border: '#d8cddd', focus: 'rgba(109, 85, 135, 0.28)' },
  OCEAN: { brand: '#266a91', hover: '#1c526f', soft: '#edf5f8', border: '#c7dfe9', focus: 'rgba(38, 106, 145, 0.28)' },
  TEAL: { brand: '#176c68', hover: '#10534f', soft: '#edf7f5', border: '#c5e1dc', focus: 'rgba(23, 108, 104, 0.28)' },
};

export function applyPlatformAppearance(value: PlatformAppearanceValue) {
  const root = document.documentElement;
  const colors = palette[value.brandPreset] ?? palette.JUPITER;
  root.style.setProperty('--color-brand', colors.brand); root.style.setProperty('--color-brand-hover', colors.hover); root.style.setProperty('--color-brand-soft', colors.soft); root.style.setProperty('--color-brand-border', colors.border);
  root.style.setProperty('--primary', colors.brand); root.style.setProperty('--primary-dark', colors.hover); root.style.setProperty('--primary-soft', colors.soft); root.style.setProperty('--primary-border', colors.border); root.style.setProperty('--primary-text', colors.brand); root.style.setProperty('--focus', `0 0 0 3px ${colors.focus}`);
  root.dataset.uiDensity = value.densityPreset.toLowerCase(); root.dataset.uiRadius = value.radiusPreset.toLowerCase();
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute('content', colors.brand);
  window.dispatchEvent(new CustomEvent('jupiter:platform-appearance-updated', { detail: { logoUrl: value.logoUrl } }));
}
