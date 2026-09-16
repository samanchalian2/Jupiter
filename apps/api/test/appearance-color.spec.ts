import { describe, expect, it } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { contrastRatio, derivePrimaryTokens, JUPITER_PRIMARY, normalizeCustomPrimary } from '../src/appearance/appearance-color.js';

describe('appearance custom-primary validation', () => {
  it('normalizes accepted hex input and derives the canonical Jupiter teal tokens', () => {
    expect(normalizeCustomPrimary('#014348')).toBe(JUPITER_PRIMARY);
    expect(normalizeCustomPrimary('#1a6f55')).toBe('#1A6F55');
    expect(derivePrimaryTokens(JUPITER_PRIMARY)).toMatchObject({ primary: '#014348', primaryHover: '#00383C', primaryActive: '#002D31', primarySubtle: '#EFF7F7', primaryBorder: '#BFD9D9', onPrimary: '#FFFFFF' });
    expect(contrastRatio(JUPITER_PRIMARY, '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
  });

  it('uses a deterministic light or dark onPrimary foreground and keeps links readable', () => {
    const light = derivePrimaryTokens('#FFFFE0');
    expect(light.onPrimary).toBe('#0B292C');
    expect(contrastRatio(light.primaryText, '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
    expect(derivePrimaryTokens('#204080').onPrimary).toBe('#FFFFFF');
  });

  it.each(['#fff', '014348', '#GGGGGG', '#01434800', 'rgb(1,67,72)', 'rgba(1,67,72,.5)', 'hsl(210 50% 40%)', 'blue', 'var(--primary)', 'url(x)', 'linear-gradient(red,blue)', '<style>', '   ', '#808080'])('rejects malformed or unsafe primary %s', (value) => {
    expect(() => normalizeCustomPrimary(value)).toThrow(BadRequestException);
  });
});
