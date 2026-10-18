import type {SdkMetricReport} from '@observability/contracts';
type Key=keyof SdkMetricReport['counters'];
const zero=()=>({dropped:0,retryDelivered:0,retryDropped:0});
/** Fixed-cardinality, payload-free deltas. A lost ACK reuses the same report. */
export class SdkMetricBuffer {
 private counts=zero();private pending?:SdkMetricReport;private overflow=false;
 add(key:Key,count=1){if(!Number.isSafeInteger(count)||count<0)return;const next=this.counts[key]+count;if(next>1_000_000_000)this.overflow=true;this.counts[key]=Math.min(1_000_000_000,next);}
 snapshot(now=Date.now()):SdkMetricReport|undefined {
  if(!this.pending){if(Object.values(this.counts).every(n=>n===0))return;const counters=zero();for(const key of Object.keys(counters) as Key[]){counters[key]=Math.min(1_000_000,this.counts[key]);this.counts[key]-=counters[key];}this.pending={reportId:crypto.randomUUID(),observedAt:new Date(now).toISOString(),counters};}
  return{...this.pending,counters:{...this.pending.counters}};
 }
 acknowledge(id:string){if(this.pending?.reportId===id)this.pending=undefined;}
 reset(){this.pending=undefined;this.counts=zero();this.overflow=false;}
 hasMeasurementLoss(){return this.overflow;}
}
