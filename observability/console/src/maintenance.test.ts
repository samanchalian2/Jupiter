import {describe,expect,it} from 'vitest';
import {retentionCommand} from './MaintenancePanel.js';
describe('explicit retention policy command',()=>{
 const draft={rawDays:'30',aggregateDays:'365',incidentDays:'180',feedbackDays:'180'};
 it('requires acknowledgement, reason and explicit valid day counts',()=>{expect(()=>retentionCommand(draft,'Human explanation',false)).toThrow();expect(()=>retentionCommand(draft,'',true)).toThrow();for(const rawDays of ['','6','366','7.5','1e2'])expect(()=>retentionCommand({...draft,rawDays},'Human explanation',true)).toThrow();});
 it('preserves independent retention categories and trims the auditable reason',()=>{expect(retentionCommand({...draft,rawDays:'7',feedbackDays:'60'},'  Approved policy  ',true)).toEqual({rawDays:7,aggregateDays:365,incidentDays:180,feedbackDays:60,reason:'Approved policy'});});
});
