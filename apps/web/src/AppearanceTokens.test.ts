import { describe, expect, it } from 'vitest';
import { contrastRatio, derivePrimaryTokens, JUPITER_PRIMARY } from './AppearanceTokens';

describe('appearance tokens', () => {
  it('derives the canonical Jupiter blue palette', () => {
    expect(derivePrimaryTokens(JUPITER_PRIMARY)).toMatchObject({ primary:'#014348', primaryHover:'#00383C', primaryActive:'#002D31', primarySubtle:'#EFF7F7', primaryBorder:'#BFD9D9', onPrimary:'#FFFFFF' });
    expect(contrastRatio(JUPITER_PRIMARY, '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
  });

  it('selects dark onPrimary for a light but safe custom primary', () => {
    const tokens=derivePrimaryTokens('#FFFFE0');
    expect(tokens.onPrimary).toBe('#0B292C');
    expect(contrastRatio(tokens.primaryText,'#FFFFFF')).toBeGreaterThanOrEqual(4.5);
  });
});
