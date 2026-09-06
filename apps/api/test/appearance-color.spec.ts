import { describe, expect, it } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { contrastRatio, derivePrimaryTokens, JUPITER_PRIMARY, normalizeCustomPrimary } from '../src/appearance/appearance-color.js';

describe('appearance custom-primary validation', () => {
  it('normalizes accepted hex input and derives the canonical Jupiter blue tokens', () => {
    expect(normalizeCustomPrimary('#315399')).toBe(JUPITER_PRIMARY);
    expect(normalizeCustomPrimary('#1a6f55')).toBe('#1A6F55');
    expect(derivePrimaryTokens(JUPITER_PRIMARY)).toMatchObject({ primary: '#315399', primaryHover: '#2A4782', primaryActive: '#233C6E', primarySubtle: '#EFF1F7', primaryBorder: '#C5CFE2', onPrimary: '#FFFFFF' });
  });

  it('uses a deterministic light or dark onPrimary foreground and keeps links readable', () => {
    const light = derivePrimaryTokens('#FFFFE0');
    expect(light.onPrimary).toBe('#172033');
    expect(contrastRatio(light.primaryText, '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
    expect(derivePrimaryTokens('#204080').onPrimary).toBe('#FFFFFF');
  });

  it.each(['#fff', '315399', '#GGGGGG', '#31539900', 'rgb(49,83,153)', 'rgba(49,83,153,.5)', 'hsl(210 50% 40%)', 'blue', 'var(--primary)', 'url(x)', 'linear-gradient(red,blue)', '<style>', '   ', '#808080'])('rejects malformed or unsafe primary %s', (value) => {
    expect(() => normalizeCustomPrimary(value)).toThrow(BadRequestException);
  });
});
