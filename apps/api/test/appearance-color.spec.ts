import { describe, expect, it } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { contrastRatio, derivePrimaryTokens, JUPITER_PRIMARY, normalizeCustomPrimary } from '../src/appearance/appearance-color.js';

describe('appearance custom-primary validation', () => {
  it('normalizes accepted hex input and derives the canonical Jupiter lavender tokens', () => {
    expect(normalizeCustomPrimary('#a89bbe')).toBe(JUPITER_PRIMARY);
    expect(normalizeCustomPrimary('#1a6f55')).toBe('#1A6F55');
    expect(derivePrimaryTokens(JUPITER_PRIMARY)).toMatchObject({ primary: '#A89BBE', primaryHover: '#9181A8', primaryActive: '#796A8F', primarySubtle: '#F4F1F6', primaryBorder: '#D9D1E0', primaryText: '#62546F', onPrimary: '#211D25' });
    expect(contrastRatio(JUPITER_PRIMARY, '#211D25')).toBeGreaterThanOrEqual(4.5);
  });

  it('uses a deterministic light or dark onPrimary foreground and keeps links readable', () => {
    const light = derivePrimaryTokens('#FFFFE0');
    expect(light.onPrimary).toBe('#211D25');
    expect(contrastRatio(light.primaryText, '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
    expect(derivePrimaryTokens('#204080').onPrimary).toBe('#FFFFFF');
  });

  it.each(['#fff', 'A89BBE', '#GGGGGG', '#A89BBE00', 'rgb(168,155,190)', 'rgba(168,155,190,.5)', 'hsl(270 20% 68%)', 'blue', 'var(--primary)', 'url(x)', 'linear-gradient(red,blue)', '<style>', '   ', '#808080'])('rejects malformed or unsafe primary %s', (value) => {
    expect(() => normalizeCustomPrimary(value)).toThrow(BadRequestException);
  });
});
