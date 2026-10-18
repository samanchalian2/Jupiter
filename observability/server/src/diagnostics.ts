export type HubDiagnosticCode='HUB_NOT_READY'|'WORKER_DRAIN_FAILED'|'METRICS_BUFFER_FULL'|'METRICS_STORAGE_UNAVAILABLE';
export interface HubDiagnosticEntry {event:'observability.diagnostic';code:HubDiagnosticCode;severity:'WARNING';}
/** Out-of-band fallback: fixed fields only, no exception, payload, URL or secret.
 * This path must never re-enter ingestion or make business execution fail. */
export class HubDiagnosticReporter {
 private readonly last=new Map<HubDiagnosticCode,number>();
 constructor(private readonly sink:(entry:HubDiagnosticEntry)=>void,private readonly clock:()=>number=Date.now){}
 report(code:HubDiagnosticCode){
  const now=this.clock(),prior=this.last.get(code);if(prior!==undefined&&now-prior<60_000)return;
  this.last.set(code,now);try{this.sink({event:'observability.diagnostic',code,severity:'WARNING'});}catch{/* Broken logging is not a product exception. */}
 }
}
