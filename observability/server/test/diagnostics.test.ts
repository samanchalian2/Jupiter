import {describe,it,expect} from 'vitest';
import {HubDiagnosticReporter} from '../src/diagnostics.js';
describe('out-of-band Hub diagnostic logging',()=>{
 it('uses fixed fields, bounds repeated failures, and permits a later report',()=>{
  let now=0;const entries:unknown[]=[],reporter=new HubDiagnosticReporter(entry=>entries.push(entry),()=>now);
  reporter.report('WORKER_DRAIN_FAILED');for(let i=0;i<100;i++)reporter.report('WORKER_DRAIN_FAILED');
  expect(entries).toEqual([{event:'observability.diagnostic',code:'WORKER_DRAIN_FAILED',severity:'WARNING'}]);
  reporter.report('HUB_NOT_READY');expect(entries).toHaveLength(2);now=60_000;reporter.report('WORKER_DRAIN_FAILED');expect(entries).toHaveLength(3);
 });
 it('does not propagate logging-sink failures into product execution',()=>{const reporter=new HubDiagnosticReporter(()=>{throw Error('controlled sink failure');});expect(()=>reporter.report('HUB_NOT_READY')).not.toThrow();});
});
