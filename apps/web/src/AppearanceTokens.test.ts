import { describe, expect, it } from 'vitest';
import { contrastRatio, derivePrimaryTokens, JUPITER_PRIMARY } from './AppearanceTokens';

describe('appearance tokens', () => {
  it('derives the canonical Jupiter lavender palette', () => {
    expect(derivePrimaryTokens(JUPITER_PRIMARY)).toMatchObject({ primary:'#A89BBE', primaryHover:'#9181A8', primaryActive:'#796A8F', primarySubtle:'#F4F1F6', primaryBorder:'#D9D1E0', primaryText:'#62546F', onPrimary:'#211D25' });
    expect(contrastRatio(JUPITER_PRIMARY, '#211D25')).toBeGreaterThanOrEqual(4.5);
    expect(derivePrimaryTokens(JUPITER_PRIMARY, 'dark')).toMatchObject({ primary:'#C8BDD4', primarySubtle:'#29242E', primaryBorder:'#51465A', onPrimary:'#211D25' });
  });

  it('selects dark onPrimary for a light but safe custom primary', () => {
    const tokens=derivePrimaryTokens('#FFFFE0');
    expect(tokens.onPrimary).toBe('#211D25');
    expect(contrastRatio(tokens.primaryText,'#FFFFFF')).toBeGreaterThanOrEqual(4.5);
  });
});
