import { describe, expect, it } from 'vitest';
import { contrastRatio, derivePrimaryTokens, JUPITER_PRIMARY } from './AppearanceTokens';

describe('appearance tokens', () => {
  it('derives the canonical Jupiter blue palette', () => {
    expect(derivePrimaryTokens(JUPITER_PRIMARY)).toMatchObject({ primary:'#315399', primaryHover:'#2A4782', primaryActive:'#233C6E', primarySubtle:'#EFF1F7', primaryBorder:'#C5CFE2', onPrimary:'#FFFFFF' });
  });

  it('selects dark onPrimary for a light but safe custom primary', () => {
    const tokens=derivePrimaryTokens('#FFFFE0');
    expect(tokens.onPrimary).toBe('#172033');
    expect(contrastRatio(tokens.primaryText,'#FFFFFF')).toBeGreaterThanOrEqual(4.5);
  });
});
