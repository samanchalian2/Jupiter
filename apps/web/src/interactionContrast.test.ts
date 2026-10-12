import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const legacyStyles = readFileSync(fileURLToPath(new URL('./styles.css', import.meta.url)), 'utf8');
const designSystemStyles = readFileSync(fileURLToPath(new URL('./design-system.css', import.meta.url)), 'utf8');

type CssRule = { selector: string; declarations: string };

function interactiveRules(css: string): CssRule[] {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  return [...withoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .map((match) => ({ selector: match[1].trim(), declarations: match[2].trim() }))
    .filter(({ selector }) => /:(hover|focus|focus-visible|active)/.test(selector));
}

describe('interactive control contrast', () => {
  it('pairs every strong brand interaction surface with the deterministic foreground', () => {
    const rules = interactiveRules(`${legacyStyles}\n${designSystemStyles}`);
    const strongSurface = /background(?:-color)?\s*:\s*var\(--(?:primary|primary-dark|color-brand|color-brand-hover|color-brand-active)\)/;
    const wrongForeground = rules
      .filter(({ declarations }) => strongSurface.test(declarations))
      .filter(({ declarations }) => !/color\s*:\s*var\(--on-primary\)/.test(declarations))
      .map(({ selector }) => selector.replace(/\s+/g, ' '));

    expect(wrongForeground).toEqual([]);
  });

  it('makes nested button glyphs follow the resolved control foreground', () => {
    expect(legacyStyles).toMatch(/button:hover:not\(:disabled\)\s*>\s*svg[\s\S]*?stroke:\s*currentColor/);
    expect(designSystemStyles).toMatch(/\.icon-button:hover:not\(:disabled\)\s*>\s*svg[\s\S]*?stroke:\s*currentColor/);
  });
});
