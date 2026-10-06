import { describe, expect, it } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { contrastRatio, derivePrimaryTokens, JUPITER_PRIMARY, normalizeCustomPrimary } from '../src/appearance/appearance-color.js';

describe('appearance custom-primary validation', () => {
  it('normalizes accepted hex input and derives the canonical Jupiter lavender tokens', () => {
    expect(normalizeCustomPrimary('#796e89')).toBe(JUPITER_PRIMARY);
    expect(normalizeCustomPrimary('#1a6f55')).toBe('#1A6F55');
    expect(derivePrimaryTokens(JUPITER_PRIMARY)).toMatchObject({ primary: '#796E89', primaryHover: '#6D627D', primaryActive: '#61566F', primarySubtle: '#F4F1F6', primaryBorder: '#D9D1E0', primaryText: '#796E89', onPrimary: '#FFFFFF' });
    expect(contrastRatio(JUPITER_PRIMARY, '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
  });

  it('uses a deterministic light or dark onPrimary foreground and keeps links readable', () => {
    const light = derivePrimaryTokens('#FFFFE0');
    expect(light.onPrimary).toBe('#211D25');
    expect(contrastRatio(light.primaryText, '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
    expect(derivePrimaryTokens('#204080').onPrimary).toBe('#FFFFFF');
  });

  it.each(['#fff', '796E89', '#GGGGGG', '#796E8900', 'rgb(121,110,137)', 'rgba(121,110,137,.5)', 'hsl(270 11% 48%)', 'blue', 'var(--primary)', 'url(x)', 'linear-gradient(red,blue)', '<style>', '   ', '#808080'])('rejects malformed or unsafe primary %s', (value) => {
    expect(() => normalizeCustomPrimary(value)).toThrow(BadRequestException);
  });
});
