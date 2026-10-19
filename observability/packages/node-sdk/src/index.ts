import { AsyncLocalStorage } from 'node:async_hooks';
import { SCHEMA_VERSION, isRecord, encodedBytes, type IdentityScope, type TelemetryEvent } from '@observability/contracts';
import { sanitizeEvent, sanitizeStack, redactText, enforceScope, newTrace, retryDelay, SdkMetricBuffer } from '@observability/core';
export interface NodeContext extends IdentityScope {requestId?:string;traceId?:string;spanId?:string;}
export interface NodeSdkConfiguration {
  endpoint:string;
  applicationId:string;
  environmentId:string;
  release?:string;
  credentialProvider:()=>Promise<string|null>;
  transport?:typeof fetch;
  fallback?:(entry:Record<string,unknown>)=>void;
  maxQueueCount?:number;
  maxQueueBytes?:number;
  reportMetrics?:boolean;
}
type Pending={event:TelemetryEvent;bytes:number;attempts:number;nextRetryAt:number};
export class NodeSdk {
  private readonly contexts=new AsyncLocalStorage<NodeContext>();
  private readonly pending:Pending[]=[];
  private pendingBytes=0;
  private busy=false;
  private stopped=false;
  private timer?:ReturnType<typeof setInterval>;
  private abort?:AbortController;
  private nextFlush=0;
  private dropped=0;
  private readonly metrics=new SdkMetricBuffer();
  private metricBusy=false;
  private nextMetricAt=0;
  private metricAbort?:AbortController;
  private metricAttempts=0;
  getMetricReport(){return this.metrics.snapshot();}
  acknowledgeMetricReport(id:string){this.metrics.acknowledge(id);}
  async flushMetrics(){
    if(this.config.reportMetrics===false||this.stopped||this.metricBusy||Date.now()<this.nextMetricAt)return;
    const report=this.metrics.snapshot();if(!report)return;
    if(Date.parse(report.observedAt)<Date.now()-48*3_600_000){this.metrics.acknowledge(report.reportId);this.metricAttempts=0;return;}
    this.metricBusy=true;this.nextMetricAt=Date.now()+10_000;
    try{
      // Diagnostic deltas belong to the process/App, never the last request's ALS.
      const credential=await this.contexts.run({applicationId:this.config.applicationId,environmentId:this.config.environmentId,actorReference:null,tenantReference:null},()=>this.config.credentialProvider());if(!credential)return;
      this.metricAbort=new AbortController();const timeout=setTimeout(()=>this.metricAbort?.abort(),5000);
      try{
        const response=await (this.config.transport??fetch)(`${this.config.endpoint}/sdk-metrics`,{method:'POST',headers:{authorization:`Bearer ${credential}`,'content-type':'application/json','x-observability-application-id':this.config.applicationId,'x-observability-environment-id':this.config.environmentId},body:JSON.stringify(report),signal:this.metricAbort.signal});
        if(response.ok){const ack:unknown=await response.json();if(!isRecord(ack)||ack.accepted!==true||typeof ack.duplicate!=='boolean')throw Error('INVALID_METRIC_ACK');this.metrics.acknowledge(report.reportId);this.metricAttempts=0;}
        else if([400,403,404,409,410,422].includes(response.status)){this.metrics.acknowledge(report.reportId);this.metricAttempts=0;this.fallback('METRIC_REPORT_REJECTED');}
        else throw Error('METRIC_RETRY');
      }finally{clearTimeout(timeout);}
    }catch{this.metricAttempts++;if(this.metricAttempts>=12){this.metrics.acknowledge(report.reportId);this.metricAttempts=0;this.fallback('METRIC_RETRY_EXHAUSTED');}else{this.nextMetricAt=Date.now()+Math.max(10_000,retryDelay(this.metricAttempts));this.fallback('METRICS_UNAVAILABLE');}}
    finally{this.metricBusy=false;}
  }
  constructor(private readonly config:NodeSdkConfiguration){
    const url=new URL(config.endpoint);if(url.protocol!=='https:'&&!(url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname)))throw new Error('SDK_ENDPOINT_REQUIRES_HTTPS');
    if(url.username||url.password||url.search||url.hash)throw new Error('INVALID_SDK_ENDPOINT');
  }
  context(){return this.contexts.getStore();}
  run<T>(context:NodeContext,work:()=>T):T {
    if(context.applicationId!==this.config.applicationId||context.environmentId!==this.config.environmentId)throw new Error('SDK_CONTEXT_MISMATCH');
    return this.contexts.run(context,work);
  }
  trace(parent?:string){return newTrace(parent);}
  private fallback(code:string,event?:TelemetryEvent){
    const entry={event:'observability.fallback',code,...(event?{telemetry:event}:{})};
    try{if(this.config.fallback)this.config.fallback(entry);else console.error(JSON.stringify(entry));}catch{/* A logging sink cannot affect application execution. */}
  }
  capture(input:Pick<TelemetryEvent,'category'|'severity'|'eventCode'|'normalizedMessage'> & Partial<TelemetryEvent>):string|null {
    if(this.stopped)return null;
    try{
      const context=this.context()??{applicationId:this.config.applicationId,environmentId:this.config.environmentId,actorReference:null,tenantReference:null};
      const event=sanitizeEvent(enforceScope({...input,eventId:input.eventId??crypto.randomUUID(),schemaVersion:SCHEMA_VERSION,applicationId:context.applicationId,environmentId:context.environmentId,occurredAt:input.occurredAt??new Date().toISOString(),source:input.source??'SERVER',releaseVersion:this.config.release,requestId:context.requestId,traceId:context.traceId,spanId:context.spanId},context));
      const eventBytes=encodedBytes(event),bytes=this.pendingBytes+eventBytes;
      if(this.pending.length>=Math.min(500,this.config.maxQueueCount??500)||bytes>Math.min(2_097_152,this.config.maxQueueBytes??2_097_152)){this.dropped++;this.metrics.add('dropped');this.fallback('QUEUE_FULL',event);return null;}
      this.pending.push({event,bytes:eventBytes,attempts:0,nextRetryAt:Date.now()});this.pendingBytes+=eventBytes;return event.eventId;
    }catch{this.dropped++;this.metrics.add('dropped');this.fallback('EVENT_REJECTED');return null;}
  }
  captureException(error:unknown,input:{category?:TelemetryEvent['category'];operationName?:string;eventCode?:string;source?:TelemetryEvent['source']}={}){
    return this.capture({category:input.category??'BACKEND',source:input.source??'SERVER',severity:'ERROR',eventCode:input.eventCode??'server.exception',normalizedMessage:error instanceof Error?redactText(error.message).slice(0,2000):'Unexpected operation failure',exceptionType:error instanceof Error?error.name:'UnknownError',sanitizedStack:error instanceof Error?sanitizeStack(error.stack??''):undefined,operationName:input.operationName});
  }
  async flush(){
    if(this.busy||this.stopped||Date.now()<this.nextFlush)return;const batch=this.pending.filter(p=>p.nextRetryAt<=Date.now()).slice(0,50);if(!batch.length){await this.flushMetrics();return;}this.busy=true;
    try{
      const credential=await this.config.credentialProvider();if(!credential){this.nextFlush=Date.now()+30_000;return;}
      this.abort=new AbortController();const timeout=setTimeout(()=>this.abort?.abort(),15_000);
      try{
        const response=await (this.config.transport??fetch)(`${this.config.endpoint}/events/batch`,{method:'POST',headers:{authorization:`Bearer ${credential}`,'content-type':'application/json'},body:JSON.stringify({events:batch.map(p=>p.event)}),signal:this.abort.signal});
        if(!response.ok)throw new Error(`INGESTION_HTTP_${response.status}`);
        const value:unknown=await response.json();if(!isRecord(value)||value.schemaVersion!=='1.1'||!Array.isArray(value.acknowledgements))throw new Error('INVALID_ACK');
        const ids=new Set(batch.map(p=>p.event.eventId)),seen=new Set<string>();
        for(const ack of value.acknowledgements){if(!isRecord(ack)||typeof ack.eventId!=='string'||!ids.has(ack.eventId)||seen.has(ack.eventId)||!['ACCEPTED','DUPLICATE','REJECTED','RETRYABLE'].includes(String(ack.status)))throw new Error('INVALID_ACK');seen.add(ack.eventId);}
        const complete=new Set<string>(value.acknowledgements.filter(a=>a.status!=='RETRYABLE').map(a=>a.eventId));
        for(const item of batch){if(complete.has(item.event.eventId)){const rejected=value.acknowledgements.some(a=>a.eventId===item.event.eventId&&a.status==='REJECTED');if(rejected){this.dropped++;this.metrics.add('dropped');if(item.attempts>0)this.metrics.add('retryDropped');}else if(item.attempts>0)this.metrics.add('retryDelivered');this.remove(item);}else this.defer(item);}
      }finally{clearTimeout(timeout);}
    }catch{
      for(const item of batch){this.fallback('INGESTION_UNAVAILABLE',item.event);this.defer(item);}
    }finally{await this.flushMetrics();this.busy=false;}
  }
  private remove(item:Pending){const index=this.pending.indexOf(item);if(index>=0){this.pending.splice(index,1);this.pendingBytes-=item.bytes;}}
  private defer(item:Pending){item.attempts++;if(item.attempts>=12){this.remove(item);this.dropped++;this.metrics.add('dropped');this.metrics.add('retryDropped');}else item.nextRetryAt=Date.now()+retryDelay(item.attempts);}
  stats(){return {queued:this.pending.length,dropped:this.dropped};}
  start(){if(!this.timer){this.stopped=false;this.timer=setInterval(()=>void this.flush(),10_000);this.timer.unref();}return this;}
  async shutdown(){if(this.timer)clearInterval(this.timer);await this.flush();this.stopped=true;this.abort?.abort();this.metricAbort?.abort();for(const item of this.pending)this.fallback('SHUTDOWN_UNDELIVERED',item.event);this.pending.splice(0);this.pendingBytes=0;}
}
