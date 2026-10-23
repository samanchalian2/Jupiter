import {describe,it,expect} from 'vitest';
import {investigatorConfigurationCommand as command,type InvestigatorConfig} from './investigator-configuration.js';
describe('optional operational policy form',()=>{
 const base:InvestigatorConfig={enabled:true,externalProcessingAllowed:false,hasCredential:true,endpoint:'https://fixture.invalid/v1',model:'fixture',monthlyTokenBudget:100000};
 it('preserves omission and distinguishes explicit blank reset from zero',()=>{expect(command(base,'','Fixture policy')).not.toHaveProperty('monthlyRequestLimit');expect(command({...base,monthlyRequestLimit:''},'','Fixture policy')).toHaveProperty('monthlyRequestLimit',null);expect(command({...base,monthlyRequestLimit:'0'},'','Fixture policy')).toHaveProperty('monthlyRequestLimit',0);});
 it('parses safe integer micro-unit rates and requires both explicit estimates',()=>{expect(command({...base,monthlyEstimatedCostMicros:'1000000',inputRateMicrosPerMillion:'2000000',outputRateMicrosPerMillion:'0'},'','Fixture policy')).toMatchObject({monthlyEstimatedCostMicros:1000000,inputRateMicrosPerMillion:2000000,outputRateMicrosPerMillion:0});expect(()=>command({...base,monthlyEstimatedCostMicros:1},'','Fixture policy')).toThrow('هر دو نرخ');for(const value of ['1.1','1e3','-1','Infinity',NaN,1000000001])expect(()=>command({...base,monthlyRequestLimit:value},'','Fixture policy')).toThrow();});
});
