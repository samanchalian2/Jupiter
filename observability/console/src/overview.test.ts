import {describe,it,expect} from 'vitest';
import {observationLabel,overviewStateLabel} from './overview.js';
describe('Overview observed health wording',()=>{
 it('never treats absent or unknown data as a healthy application',()=>{for(const value of [null,undefined,'UNKNOWN','HEALTHY',0])expect(observationLabel(value)).toBe('شاهدی برای ارزیابی این محدوده وجود ندارد');});
 it('describes observations rather than uptime or guaranteed health',()=>{expect(observationLabel('ERRORS_OBSERVED')).toContain('خطا در داده‌های');expect(observationLabel('NO_ERRORS_OBSERVED')).toContain('در داده‌های این بازه');expect(observationLabel('NO_ERRORS_OBSERVED')).not.toContain('سالم');});
 it('translates presentation states without changing stored codes or inventing unknown values',()=>{expect(overviewStateLabel('CRITICAL')).toBe('بحرانی');expect(overviewStateLabel('REOPENED')).toBe('بازگشایی‌شده');expect(overviewStateLabel('ISSUE')).toBe('خطا');expect(overviewStateLabel('FUTURE_CODE')).toBe('FUTURE_CODE');expect(overviewStateLabel(null)).toBe('—');});
});
