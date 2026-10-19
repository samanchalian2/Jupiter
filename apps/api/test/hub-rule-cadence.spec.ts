import {describe,expect,it,vi} from 'vitest';
import {HubBindingService,monitoringRuleIntervalMs} from '../src/observability/hub-binding.service.js';

describe('bounded host rule evaluation cadence',()=>{
 it('preserves one-minute default and accepts only bounded integer milliseconds',()=>{
  expect(monitoringRuleIntervalMs(undefined)).toBe(60000);
  for(const input of ['', 'invalid', '0','9999','300001','10000.5','1e4','-10000','Infinity','9007199254740992'])expect(monitoringRuleIntervalMs(input)).toBe(60000);
  expect(monitoringRuleIntervalMs('10000')).toBe(10000);expect(monitoringRuleIntervalMs('300000')).toBe(300000);expect(monitoringRuleIntervalMs(' 45000 ')).toBe(45000);
 });
 it('evaluates immediately and only at the configured boundary without changing maintenance cadence',async()=>{
  const host=new HubBindingService(undefined as never,undefined as never,undefined as never),evaluate=vi.fn(async()=>0);
  Object.assign(host,{configuration:{ruleEvaluationIntervalMs:10000},lastMaintenance:1234});
  const run=(now:number)=>(host as unknown as {evaluateRulesIfDue(rules:{evaluate:()=>Promise<number>},now:number):Promise<void>}).evaluateRulesIfDue({evaluate},now);
  await run(0);expect(evaluate).toHaveBeenCalledTimes(1);await run(9999);expect(evaluate).toHaveBeenCalledTimes(1);await run(10000);expect(evaluate).toHaveBeenCalledTimes(2);await run(19999);expect(evaluate).toHaveBeenCalledTimes(2);await run(20000);expect(evaluate).toHaveBeenCalledTimes(3);
  expect((host as unknown as {lastMaintenance:number}).lastMaintenance).toBe(1234);
 });
 it('contains failures and throttles the next attempt without leaking the error or stopping maintenance',async()=>{
  const host=new HubBindingService(undefined as never,undefined as never,undefined as never),report=vi.fn(),evaluate=vi.fn(async()=>{throw Error('Controlled private failure');});
  Object.assign(host,{configuration:{ruleEvaluationIntervalMs:300000},diagnostics:{report},lastMaintenance:1234});
  const run=(now:number)=>(host as unknown as {evaluateRulesIfDue(rules:{evaluate:()=>Promise<number>},now:number):Promise<void>}).evaluateRulesIfDue({evaluate},now);
  await expect(run(0)).resolves.toBeUndefined();await run(299999);expect(evaluate).toHaveBeenCalledTimes(1);expect(report).toHaveBeenCalledExactlyOnceWith('WORKER_DRAIN_FAILED');await run(300000);expect(evaluate).toHaveBeenCalledTimes(2);expect(report.mock.calls.flat()).not.toContain('Controlled private failure');expect((host as unknown as {lastMaintenance:number}).lastMaintenance).toBe(1234);
 });
});
