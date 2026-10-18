import { SCHEMA_VERSION, LIMITS, ContractError, encodedBytes, validateFeedback, isRecord, type IdentityScope, type TelemetryEvent, type BatchAcknowledgement, type FeedbackSubmission } from '@observability/contracts';
import { sanitizeEvent, redactText, sanitizeStack, scopeKey, retryDelay, routeTemplate, newTrace } from '@observability/core';
import { IndexedDbQueue, MemoryQueue, type QueueStorage, type OfflineEnvelope } from './storage.js';
export { IndexedDbQueue, MemoryQueue, type QueueStorage, type OfflineEnvelope } from './storage.js';
export { redactText, sanitizeStack, routeTemplate } from '@observability/core';
export type Credential={token:string;scope:IdentityScope;expiresAt:number};
export type SdkStatus={queued:number;storage:'DURABLE'|'MEMORY';lastFailure:string|null;dropped:number};
export interface BrowserSdkConfiguration {
  applicationId:string;
  environmentId:string;
  endpoint:string;
  release?:string;
  authProvider:(scope:IdentityScope)=>Promise<Credential|null>;
  contextProvider:()=>IdentityScope;
  storage?:QueueStorage;
  transport?:typeof fetch;
  sampling?:Partial<Record<TelemetryEvent['category'],number>>;
  categories?:TelemetryEvent['category'][];
  maxQueueCount?:number;
  maxQueueBytes?:number;
  onStatus?:(status:SdkStatus)=>void;
  onFeedbackAcknowledged?:(feedbackId:string,trackingId:string)=>void;
  clock?:()=>number;
}
export type EventInput=Pick<TelemetryEvent,'category'|'severity'|'eventCode'|'normalizedMessage'> & Partial<Omit<TelemetryEvent,'eventId'|'schemaVersion'|'applicationId'|'environmentId'|'occurredAt'|'actorReference'|'tenantReference'>>;
export class BrowserSdk {
  private storage:QueueStorage;
  private mode:'DURABLE'|'MEMORY';
  private readonly transport:typeof fetch;
  private readonly clock:()=>number;
  private partition:string;
  private generation=0;
  private stopped=false;
  private flushing=false;
  private queueChain:Promise<void>=Promise.resolve();
  private abort?:AbortController;
  private timer?:ReturnType<typeof setInterval>;
  private cleanups:(()=>void)[]=[];
  private status:SdkStatus={queued:0,storage:'DURABLE',lastFailure:null,dropped:0};
  private readonly sessionId=crypto.randomUUID();
  constructor(private readonly config:BrowserSdkConfiguration){
    const url=new URL(config.endpoint);
    if(url.protocol!=='https:'&&!(url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname)))throw new ContractError('SDK_ENDPOINT_REQUIRES_HTTPS');
    if(url.username||url.password||url.search||url.hash)throw new ContractError('INVALID_SDK_ENDPOINT');
    this.storage=config.storage??(typeof indexedDB!=='undefined'?new IndexedDbQueue():new MemoryQueue());
    this.mode=this.storage instanceof MemoryQueue?'MEMORY':'DURABLE';
    // Native Window.fetch must not be invoked with the SDK instance as receiver.
    // A wrapper also leaves injected transports independent of browser binding.
    this.status.storage=this.mode;this.transport=config.transport??((input,init)=>fetch(input,init));this.clock=config.clock??Date.now;
    this.partition=scopeKey(this.context());
  }
  private context(){const scope=this.config.contextProvider();if(scope.applicationId!==this.config.applicationId||scope.environmentId!==this.config.environmentId)throw new ContractError('SDK_CONTEXT_MISMATCH');return scope;}
  private async degrade(){this.storage.close();this.storage=new MemoryQueue();this.mode='MEMORY';this.status.storage='MEMORY';this.status.lastFailure='OFFLINE_STORAGE_UNAVAILABLE';this.emit();}
  private emit(){try{this.config.onStatus?.({...this.status});}catch{/* Consumer callbacks cannot break telemetry. */}}
  private async entries(){try{return await this.storage.list();}catch{await this.degrade();return this.storage.list();}}
  private serialize<T>(work:()=>Promise<T>):Promise<T>{const next=this.queueChain.then(work,work);this.queueChain=next.then(()=>undefined,()=>undefined);return next;}
  async setContext():Promise<void>{
    const next=scopeKey(this.context());if(next===this.partition)return;
    this.generation++;this.abort?.abort();this.partition=next;
    await this.serialize(async()=>{const old=await this.entries();await this.storage.remove(old.filter(e=>e.partition!==next).map(e=>e.id));});
    await this.updateStatus();
  }
  async logout():Promise<void>{this.generation++;this.abort?.abort();await this.serialize(async()=>{const old=await this.entries();await this.storage.remove(old.map(e=>e.id));});await this.updateStatus();}
  private async enqueue(envelope:OfflineEnvelope):Promise<boolean>{
    return this.serialize(async()=>{
      if(this.stopped||envelope.partition!==this.partition)return false;
      let items=await this.entries();const expired=items.filter(e=>e.expiresAt<=this.clock());await this.storage.remove(expired.map(e=>e.id));items=items.filter(e=>e.expiresAt>this.clock());
      const maximumCount=Math.min(500,Math.max(1,this.config.maxQueueCount??500)),maximumBytes=Math.min(2_097_152,Math.max(16_384,this.config.maxQueueBytes??2_097_152));
      const bytes=items.reduce((n,e)=>n+encodedBytes(e),0)+encodedBytes(envelope);
      if(items.length>=maximumCount||bytes>maximumBytes){this.status.dropped++;this.status.lastFailure='OFFLINE_QUEUE_FULL';this.emit();return false;}
      try{await this.storage.put(envelope);}catch{await this.degrade();await this.storage.put(envelope);}
      await this.updateStatus();return true;
    });
  }
  async capture(input:EventInput):Promise<string|null>{
    try{
      await this.setContext();if(this.stopped||(this.config.categories&&!this.config.categories.includes(input.category)))return null;
      const sampling=Math.max(0,Math.min(1,this.config.sampling?.[input.category]??1));if(sampling===0||Math.random()>sampling)return null;
      const scope=this.context(),now=this.clock(),eventId=crypto.randomUUID();
      const event=sanitizeEvent({...input,eventId,schemaVersion:SCHEMA_VERSION,applicationId:scope.applicationId,environmentId:scope.environmentId,occurredAt:new Date(now).toISOString(),source:input.source??'BROWSER',releaseVersion:this.config.release,actorReference:scope.actorReference,tenantReference:scope.tenantReference,sessionCorrelationId:this.sessionId,safeMetadata:{...input.safeMetadata,sdkVersion:'0.1.0',sampleRate:sampling,sampleWeight:sampling?1/sampling:1}});
      const stored=await this.enqueue({id:eventId,partition:scopeKey(scope),kind:'EVENT',payload:event,createdAt:now,expiresAt:now+48*3_600_000,attempts:0,nextRetryAt:now});
      return stored?eventId:null;
    }catch{this.status.lastFailure='EVENT_CAPTURE_REJECTED';this.emit();return null;}
  }
  async submitFeedback(input:FeedbackSubmission):Promise<boolean>{
    await this.setContext();const scope=this.context();if(!scope.actorReference)throw new ContractError('AUTHENTICATED_FEEDBACK_REQUIRED');
    const feedback=validateFeedback(input);feedback.subject=redactText(feedback.subject);feedback.description=redactText(feedback.description);
    const now=this.clock();return this.enqueue({id:feedback.feedbackId,partition:scopeKey(scope),kind:'FEEDBACK',payload:feedback,createdAt:now,expiresAt:now+24*3_600_000,attempts:0,nextRetryAt:now});
  }
  private async updateStatus(){this.status.queued=(await this.entries()).filter(e=>e.partition===this.partition&&e.expiresAt>this.clock()).length;this.emit();}
  async getStatus(){await this.updateStatus();return {...this.status};}
  private async postpone(entries:OfflineEnvelope[],permanent=false){
    if(permanent){await this.storage.remove(entries.map(e=>e.id));this.status.dropped+=entries.length;return;}
    for(const item of entries){const attempts=item.attempts+1;if(attempts>=12){await this.storage.remove([item.id]);this.status.dropped++;continue;}await this.storage.put({...item,attempts,nextRetryAt:this.clock()+retryDelay(attempts)});}
  }
  async flush():Promise<void>{
    if(this.stopped||this.flushing)return;this.flushing=true;
    const generation=this.generation;
    try{
      await this.setContext();const scope=this.context(),partition=scopeKey(scope),startedGeneration=this.generation;
      const all=await this.entries();await this.storage.remove(all.filter(e=>e.expiresAt<=this.clock()).map(e=>e.id));
      const pending=all.filter(e=>e.partition===partition&&e.expiresAt>this.clock()&&e.nextRetryAt<=this.clock());if(!pending.length)return;
      const credential=await this.config.authProvider(scope);
      if(!credential||credential.expiresAt<=this.clock()||scopeKey(credential.scope)!==partition||startedGeneration!==this.generation)return;
      this.abort=new AbortController();const timeout=setTimeout(()=>this.abort?.abort(),15_000);
      try{
        const events=pending.filter(e=>e.kind==='EVENT').slice(0,LIMITS.batch);
        if(events.length){
          const response=await this.transport(`${this.config.endpoint}/events/batch`,{method:'POST',headers:{authorization:`Bearer ${credential.token}`,'content-type':'application/json'},body:JSON.stringify({events:events.map(e=>e.payload)}),signal:this.abort.signal,credentials:'omit'});
          if(startedGeneration!==this.generation)return;
          if(response.ok){
            const value:unknown=await response.json();
            if(!isRecord(value)||value.schemaVersion!=='1.1'||!Array.isArray(value.acknowledgements))throw new Error('INVALID_ACK');
            const allowed=new Set(events.map(e=>e.id)),seen=new Set<string>();
            const ack=(value as unknown as BatchAcknowledgement).acknowledgements;
            if(ack.some(a=>!isRecord(a)||!allowed.has(a.eventId as string)||seen.has(a.eventId as string)||(seen.add(a.eventId as string),!['ACCEPTED','DUPLICATE','REJECTED','RETRYABLE'].includes(String(a.status)))))throw new Error('INVALID_ACK');
            await this.storage.remove(ack.filter(a=>a.status==='ACCEPTED'||a.status==='DUPLICATE'||a.status==='REJECTED').map(a=>a.eventId));
            this.status.dropped+=ack.filter(a=>a.status==='REJECTED').length;
            const unfinished=new Set(ack.filter(a=>a.status!=='RETRYABLE').map(a=>a.eventId));await this.postpone(events.filter(e=>!unfinished.has(e.id)));
          }else{await this.postpone(events,[400,403,404,410,413,422].includes(response.status));this.status.lastFailure=`INGESTION_HTTP_${response.status}`;}
        }
        for(const item of pending.filter(e=>e.kind==='FEEDBACK').slice(0,5)){
          if(startedGeneration!==this.generation)return;
          const response=await this.transport(`${this.config.endpoint}/feedback`,{method:'POST',headers:{authorization:`Bearer ${credential.token}`,'content-type':'application/json'},body:JSON.stringify(item.payload),signal:this.abort.signal,credentials:'omit'});
          if(startedGeneration!==this.generation)return;
          if(response.ok){const value:unknown=await response.json();if(!isRecord(value)||value.feedbackId!==item.id||typeof value.trackingId!=='string'||!/^FB-[A-Z0-9-]{8,64}$/.test(value.trackingId))throw new Error('INVALID_FEEDBACK_ACK');await this.storage.remove([item.id]);try{this.config.onFeedbackAcknowledged?.(item.id,value.trackingId);}catch{}}
          else await this.postpone([item],[400,403,404,410,413,422].includes(response.status));
        }
      }finally{clearTimeout(timeout);}
    }catch{
      this.status.lastFailure='INGESTION_UNAVAILABLE';
      if(generation===this.generation){const entries=await this.entries();await this.postpone(entries.filter(e=>e.partition===this.partition&&e.nextRetryAt<=this.clock()));}
    }finally{this.flushing=false;await this.updateStatus();}
  }
  trace(){return newTrace();}
  async reportApiFailure(input:{operationName:string;url:string;httpStatus?:number;durationMs?:number;requestId?:string;traceId?:string;error?:unknown}){
    if(input.url.startsWith(this.config.endpoint))return null;
    const expected=input.httpStatus!==undefined&&input.httpStatus>=400&&input.httpStatus<500;
    return this.capture({category:input.httpStatus?'BUSINESS_OPERATION':'CONNECTIVITY',severity:expected?'INFO':'ERROR',eventCode:expected?'api.expected_rejection':'api.failed',normalizedMessage:expected?'Operation rejected':'API operation failed',operationName:input.operationName,routeTemplate:routeTemplate(input.url),httpStatus:input.httpStatus,durationMs:input.durationMs,requestId:input.requestId,traceId:input.traceId});
  }
  start():()=>void{
    if(this.cleanups.length||typeof window==='undefined')return()=>void this.shutdown();
    this.stopped=false;
    const listener=<K extends keyof WindowEventMap>(name:K,fn:(event:WindowEventMap[K])=>void,capture=false)=>{window.addEventListener(name,fn,capture);this.cleanups.push(()=>window.removeEventListener(name,fn,capture));};
    // Resource errors do not bubble; capture phase is necessary and we never
    // inspect DOM text, form values, resource URLs or uploaded content.
    listener('error',event=>{const resource=!(event instanceof ErrorEvent);void this.capture({category:'FRONTEND',severity:'ERROR',eventCode:resource?'resource.load_failed':'js.exception',normalizedMessage:resource?'Resource loading failed':redactText(event.message||'JavaScript error').slice(0,LIMITS.message),exceptionType:!resource&&event.error instanceof Error?event.error.name:'ResourceError',sanitizedStack:!resource&&event.error instanceof Error?sanitizeStack(event.error.stack??''):undefined});},true);
    listener('unhandledrejection',event=>{void this.capture({category:'FRONTEND',severity:'ERROR',eventCode:'promise.unhandled',normalizedMessage:event.reason instanceof Error?redactText(event.reason.message).slice(0,LIMITS.message):'Unhandled promise rejection',exceptionType:event.reason instanceof Error?event.reason.name:'UnhandledRejection',sanitizedStack:event.reason instanceof Error?sanitizeStack(event.reason.stack??''):undefined});});
    listener('online',()=>{void this.capture({category:'CONNECTIVITY',severity:'INFO',eventCode:'network.restored',normalizedMessage:'Browser reports network restored',connectivityState:'ONLINE'});void this.flush();});
    listener('offline',()=>{void this.capture({category:'CONNECTIVITY',severity:'WARNING',eventCode:'network.offline',normalizedMessage:'Browser reports network unavailable',connectivityState:'OFFLINE'});});
    const visible=()=>{if(document.visibilityState==='visible')void this.flush();};document.addEventListener('visibilitychange',visible);this.cleanups.push(()=>document.removeEventListener('visibilitychange',visible));
    if(typeof PerformanceObserver!=='undefined'){
      try{const observer=new PerformanceObserver(list=>{for(const entry of list.getEntries().slice(0,20)){if(!Number.isFinite(entry.duration)||entry.duration<0)continue;void this.capture({category:'PERFORMANCE',severity:'INFO',eventCode:entry.entryType==='navigation'?'page.duration':'ui.long_task',normalizedMessage:'Browser performance measurement',durationMs:Math.min(86_400_000,Math.round(entry.duration)),routeTemplate:routeTemplate(window.location.pathname),safeMetadata:{metricName:entry.entryType,metricValue:Math.round(entry.duration)}});}});const supported=PerformanceObserver.supportedEntryTypes??[];for(const type of ['navigation','longtask'])if(supported.includes(type))observer.observe({type,buffered:true});this.cleanups.push(()=>observer.disconnect());}catch{/* Optional browser capability. */}
    }
    this.timer=setInterval(()=>void this.flush(),10_000);void this.flush();return()=>void this.shutdown();
  }
  async shutdown(){this.stopped=true;this.generation++;this.abort?.abort();if(this.timer)clearInterval(this.timer);for(const cleanup of this.cleanups.splice(0))cleanup();await this.queueChain;this.storage.close();}
}
