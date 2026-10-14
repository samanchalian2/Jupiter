import { AsyncLocalStorage } from 'node:async_hooks';
import { SCHEMA_VERSION, isRecord, encodedBytes, type IdentityScope, type TelemetryEvent } from '@observability/contracts';
import { sanitizeEvent, sanitizeStack, redactText, enforceScope, newTrace, retryDelay } from '@observability/core';
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
}
type Pending={event:TelemetryEvent;attempts:number;nextRetryAt:number};
export class NodeSdk {
  private readonly contexts=new AsyncLocalStorage<NodeContext>();
  private readonly pending:Pending[]=[];
  private busy=false;
  private stopped=false;
  private timer?:ReturnType<typeof setInterval>;
  private abort?:AbortController;
  private nextFlush=0;
  private dropped=0;
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
      const bytes=this.pending.reduce((n,item)=>n+encodedBytes(item.event),0)+encodedBytes(event);
      if(this.pending.length>=Math.min(500,this.config.maxQueueCount??500)||bytes>Math.min(2_097_152,this.config.maxQueueBytes??2_097_152)){this.dropped++;this.fallback('QUEUE_FULL',event);return null;}
      this.pending.push({event,attempts:0,nextRetryAt:Date.now()});return event.eventId;
    }catch{this.fallback('EVENT_REJECTED');return null;}
  }
  captureException(error:unknown,input:{category?:TelemetryEvent['category'];operationName?:string;eventCode?:string;source?:TelemetryEvent['source']}={}){
    return this.capture({category:input.category??'BACKEND',source:input.source??'SERVER',severity:'ERROR',eventCode:input.eventCode??'server.exception',normalizedMessage:error instanceof Error?redactText(error.message).slice(0,2000):'Unexpected operation failure',exceptionType:error instanceof Error?error.name:'UnknownError',sanitizedStack:error instanceof Error?sanitizeStack(error.stack??''):undefined,operationName:input.operationName});
  }
  async flush(){
    if(this.busy||this.stopped||Date.now()<this.nextFlush)return;const batch=this.pending.filter(p=>p.nextRetryAt<=Date.now()).slice(0,50);if(!batch.length)return;this.busy=true;
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
        for(const item of batch){if(complete.has(item.event.eventId)){const i=this.pending.indexOf(item);if(i>=0)this.pending.splice(i,1);}else this.defer(item);}
      }finally{clearTimeout(timeout);}
    }catch{
      for(const item of batch){this.fallback('INGESTION_UNAVAILABLE',item.event);this.defer(item);}
    }finally{this.busy=false;}
  }
  private defer(item:Pending){item.attempts++;if(item.attempts>=12){const index=this.pending.indexOf(item);if(index>=0)this.pending.splice(index,1);this.dropped++;}else item.nextRetryAt=Date.now()+retryDelay(item.attempts);}
  stats(){return {queued:this.pending.length,dropped:this.dropped};}
  start(){if(!this.timer){this.stopped=false;this.timer=setInterval(()=>void this.flush(),10_000);this.timer.unref();}return this;}
  async shutdown(){if(this.timer)clearInterval(this.timer);await this.flush();this.stopped=true;this.abort?.abort();for(const item of this.pending)this.fallback('SHUTDOWN_UNDELIVERED',item.event);this.pending.splice(0);}
}
