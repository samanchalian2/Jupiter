import { describe, expect, it } from 'vitest';
import { contrastRatio, derivePrimaryTokens, JUPITER_PRIMARY } from './AppearanceTokens';

describe('appearance tokens', () => {
  it('derives the canonical Jupiter lavender palette', () => {
    expect(derivePrimaryTokens(JUPITER_PRIMARY)).toMatchObject({ primary:'#796E89', primaryHover:'#6D627D', primaryActive:'#61566F', primarySubtle:'#F4F1F6', primaryBorder:'#D9D1E0', primaryText:'#796E89', onPrimary:'#FFFFFF' });
    expect(contrastRatio(JUPITER_PRIMARY, '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
    expect(derivePrimaryTokens(JUPITER_PRIMARY, 'dark')).toMatchObject({ primary:'#796E89', primaryHover:'#6D627D', primaryActive:'#61566F', primarySubtle:'#29242E', primaryBorder:'#51465A', onPrimary:'#FFFFFF' });
  });

  it('selects dark onPrimary for a light but safe custom primary', () => {
    const tokens=derivePrimaryTokens('#FFFFE0');
    expect(tokens.onPrimary).toBe('#211D25');
    expect(contrastRatio(tokens.primaryText,'#FFFFFF')).toBeGreaterThanOrEqual(4.5);
  });
});
