import {describe,it,expect} from 'vitest';
import {SdkMetricBuffer} from '../src/index.js';
describe('fixed SDK metric deltas',()=>{
 it('checks pending state without generating a report or consuming deltas',()=>{const metrics=new SdkMetricBuffer();expect(metrics.hasPending()).toBe(false);metrics.add('dropped');expect(metrics.hasPending()).toBe(true);const report=metrics.snapshot()!;expect(metrics.hasPending()).toBe(true);metrics.acknowledge(report.reportId);expect(metrics.hasPending()).toBe(false);metrics.add('retryDelivered');metrics.reset();expect(metrics.hasPending()).toBe(false);});
 it('keeps one immutable report through lost ACK while retaining subsequent counts',()=>{
  const metrics=new SdkMetricBuffer();expect(metrics.snapshot()).toBeUndefined();metrics.add('dropped',3);const first=metrics.snapshot()!;metrics.add('retryDelivered',2);first.counters.dropped=99;expect(metrics.snapshot()!.counters).toEqual({dropped:3,retryDelivered:0,retryDropped:0});metrics.acknowledge(crypto.randomUUID());expect(metrics.snapshot()!.reportId).toBe(first.reportId);metrics.acknowledge(first.reportId);expect(metrics.snapshot()!.counters).toEqual({dropped:0,retryDelivered:2,retryDropped:0});
 });
 it('bounds each contract report without losing a larger valid delta',()=>{const metrics=new SdkMetricBuffer();metrics.add('dropped',1000001);const first=metrics.snapshot()!;expect(first.counters.dropped).toBe(1000000);metrics.acknowledge(first.reportId);expect(metrics.snapshot()!.counters.dropped).toBe(1);});
 it('clears all pending scope data on reset and marks saturation rather than overflowing',()=>{const metrics=new SdkMetricBuffer();metrics.add('dropped',1000000001);expect(metrics.hasMeasurementLoss()).toBe(true);metrics.snapshot();metrics.reset();expect(metrics.snapshot()).toBeUndefined();expect(metrics.hasMeasurementLoss()).toBe(false);});
});
