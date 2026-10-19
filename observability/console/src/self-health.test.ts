import {describe,it,expect} from 'vitest';
import {metricText} from './SelfHealthPanel.js';
describe('Persian diagnostic measurement display',()=>{
 it('does not manufacture zero for unknown or unobserved data',()=>{expect(metricText(null)).toBe('هنوز اندازه‌گیری نشده');expect(metricText(0,false)).toBe('هنوز اندازه‌گیری نشده');expect(metricText(NaN)).toBe('هنوز اندازه‌گیری نشده');expect(metricText(0)).toBe('۰');});
 it('shows recovery percentages and negative storage growth without changing semantics',()=>{expect(metricText(.5,true,true)).toBe('۵۰٪');expect(metricText(-123)).toContain('۱۲۳');});
});
