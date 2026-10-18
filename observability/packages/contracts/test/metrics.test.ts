import {describe,it,expect} from 'vitest';
import {validateSdkMetricReport} from '../src/index.js';
const sample=()=>({reportId:crypto.randomUUID(),observedAt:new Date().toISOString(),counters:{dropped:1,retryDelivered:2,retryDropped:1}});
describe('fixed SDK counter contract',()=>{
 it('accepts the minimal counters without arbitrary metadata',()=>{const value=sample();expect(validateSdkMetricReport(value)).toEqual(value);});
 it('rejects identity/provenance/payload injection and invalid counts',()=>{const value=sample();for(const invalid of [{...value,applicationId:crypto.randomUUID()},{...value,source:'SERVER_MEASURED'},{...value,counters:{...value.counters,secret:'unsafe'}},{...value,counters:{dropped:-1,retryDelivered:0,retryDropped:0}},{...value,counters:{dropped:0,retryDelivered:0,retryDropped:0}},{...value,counters:{dropped:1.2,retryDelivered:0,retryDropped:0}},{...value,counters:{dropped:1000001,retryDelivered:0,retryDropped:0}}])expect(()=>validateSdkMetricReport(invalid)).toThrow('INVALID_SDK_METRICS');});
 it('bounds observation/replay time and requires ISO UTC rather than free-form dates',()=>{for(const time of [Date.now()-49*3600000,Date.now()+360000])expect(()=>validateSdkMetricReport({...sample(),observedAt:new Date(time).toISOString()})).toThrow('INVALID_METRIC_TIME');for(const observedAt of ['invalidZ',new Date().toISOString().slice(0,10)+'Z'])expect(()=>validateSdkMetricReport({...sample(),observedAt})).toThrow();});
});
