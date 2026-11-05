import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
it('provides wrapping 8px shared action gaps across administration and settings without changing controls',()=>{
  const css=readFileSync(new URL('./design-system.css',import.meta.url),'utf8');
  const rules=css.slice(css.indexOf('/* Compact action spacing:'));
  for(const scope of ['.platform-pro','.admin-console','.setup-workspace','.account-menu','.dialog-layer'])expect(rules).toContain(scope);
  for(const group of ['.inline-actions','.table-actions','.member-actions','.button-row','.dialog-actions','.appearance-preview-row'])expect(rules).toContain(group);
  expect(rules).toContain('flex-wrap: wrap');expect(rules).toContain('gap: 8px');
  expect(rules).toContain('margin-inline-start: 8px');expect(rules).toContain('margin: 0');
  expect(rules).not.toMatch(/font-weight|background:|padding:|min-height:/);
});
