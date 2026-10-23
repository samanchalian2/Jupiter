import {it,expect} from 'vitest';
import {investigationReason} from './investigation-reason.js';
it('explains safe operational denials in Persian without inventing provider details',()=>{
 for(const code of ['AI_REQUEST_LIMIT_EXHAUSTED','AI_COST_LIMIT_EXHAUSTED','AI_COST_ESTIMATE_UNAVAILABLE','AI_BUDGET_EXHAUSTED','AI_DISABLED','INSUFFICIENT_EVIDENCE','AI_PROVIDER_FAILED','AI_PROVIDER_TIMEOUT'])expect(investigationReason(code)).toMatch(/[آ-ی]/);
 expect(investigationReason('UNKNOWN_FUTURE_CODE')).toContain('کد تشخیصی');expect(investigationReason('UNKNOWN_FUTURE_CODE')).not.toContain('UNKNOWN_FUTURE_CODE');
});
