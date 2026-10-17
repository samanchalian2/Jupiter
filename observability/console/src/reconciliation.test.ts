import { describe,expect,it } from 'vitest';
import { reconciliationCommand } from './ReconciliationPanel.js';
describe('human usage reconciliation validation',()=>{
 it('requires explicit counts and provider-confirmation rather than default zero',()=>{expect(()=>reconciliationCommand('','0','Verified provider report',true,500)).toThrow();expect(()=>reconciliationCommand('10','5','Verified provider report',false,500)).toThrow();});
 it('rejects fractions, negatives, overflow and missing explanation',()=>{for(const input of ['-1','1.5','Infinity','1e10'])expect(()=>reconciliationCommand(input,'0','Verified provider report',true,500)).toThrow();expect(()=>reconciliationCommand('400','101','Verified provider report',true,500)).toThrow();expect(()=>reconciliationCommand('10','5','short',true,500)).toThrow();});
 it('allows verified zero and trims the auditable explanation',()=>{expect(reconciliationCommand('0','0','  Verified provider zero usage  ',true,500)).toEqual({inputTokens:0,outputTokens:0,reason:'Verified provider zero usage'});});
});
