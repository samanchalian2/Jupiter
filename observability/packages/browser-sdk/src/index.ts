import { SCHEMA_VERSION, LIMITS, ContractError, encodedBytes, validateFeedback, isRecord, isUuid, isPolicyExclusion, type IdentityScope, type TelemetryEvent, type BatchAcknowledgement, type FeedbackSubmission, type SdkMetricReport } from '@observability/contracts';
import { sanitizeEvent, redactText, sanitizeStack, scopeKey, retryDelay, routeTemplate, newTrace, SdkMetricBuffer } from '@observability/core';
import { IndexedDbQueue, MemoryQueue, type QueueStorage, type OfflineEnvelope } from './storage.js';
export { IndexedDbQueue, MemoryQueue, type QueueStorage, type OfflineEnvelope } from './storage.js';
export { redactText, sanitizeStack, routeTemplate } from '@observability/core';
export type Credential={token:string;scope:IdentityScope;expiresAt:number};
export type SdkStatus={queued:number;storage:'DURABLE'|'MEMORY';lastFailure:string|null;dropped:number;metricQueued?:number;metricFailure?:string|null};
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
  /** Enqueue-time offline TTL, 1000ms minimum; maxima/defaults: events 48h, feedback 24h. */
  retentionMs?:{events?:number;feedback?:number};
  reportMetrics?:boolean;
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
  private readonly retentionMs:{events:number;feedback:number};
  private partition:string;
  private generation=0;
  private stopped=false;
  private flushing=false;
  private queueChain:Promise<void>=Promise.resolve();
  private abort?:AbortController;
  private timer?:ReturnType<typeof setInterval>;
  private recoveryTimer?:ReturnType<typeof setTimeout>;
  private nextRecoveryAt=0;
  private recoveryStopped=false;
  private cleanups:(()=>void)[]=[];
  private status:SdkStatus={queued:0,storage:'DURABLE',lastFailure:null,dropped:0};
  private readonly sessionId=crypto.randomUUID();
  private readonly metrics=new SdkMetricBuffer();
  private contextInitialized=false;
  private metricFlushing=false;
  private metricAbort?:AbortController;
  private nextMetricAt=0;
  getMetricReport(){if(scopeKey(this.context())!==this.partition){this.metrics.reset();return;}return this.metrics.snapshot(this.clock());}
  acknowledgeMetricReport(id:string){this.metrics.acknowledge(id);}
  private countDropped(entries:OfflineEnvelope[]){this.status.dropped+=entries.filter(e=>e.kind!=='METRICS').length;const events=entries.filter(e=>e.kind==='EVENT');this.metrics.add('dropped',events.length);this.metrics.add('retryDropped',events.filter(e=>e.attempts>0).length);}
  private async checkpointMetrics(){
    if(this.config.reportMetrics===false||this.stopped||!this.metrics.hasPending())return;
    const generation=this.generation,partition=this.partition;
    try{await this.serialize(async()=>{
      if(generation!==this.generation||scopeKey(this.context())!==partition)return;
      const entries=await this.entries(),reports=entries.filter(e=>e.kind==='METRICS');
      if(generation!==this.generation)return;
      if(reports.length>=10||reports.reduce((n,e)=>n+encodedBytes(e),0)>14_000){this.status.metricFailure='METRICS_QUEUE_FULL';return;}
      const report=this.metrics.snapshot(this.clock());if(!report)return;
      if(Date.parse(report.observedAt)<this.clock()-48*3_600_000){this.metrics.acknowledge(report.reportId);this.status.metricFailure='METRIC_REPORT_EXPIRED';return;}
      const envelope:OfflineEnvelope={id:report.reportId,partition,kind:'METRICS',payload:report,createdAt:this.clock(),expiresAt:Date.parse(report.observedAt)+48*3_600_000,attempts:0,nextRetryAt:this.clock()};
      if(reports.reduce((n,e)=>n+encodedBytes(e),0)+encodedBytes(envelope)>16_384){this.status.metricFailure='METRICS_QUEUE_FULL';return;}
      // A diagnostic-only journal write cannot discard/switch the data queue.
      // Leave the immutable metric snapshot unacknowledged for a later attempt.
      await this.storage.put(envelope);
      this.metrics.acknowledge(report.reportId);
    });}catch{this.status.metricFailure='METRICS_STORAGE_UNAVAILABLE';}
  }
  async flushMetrics(){
    if(this.config.reportMetrics===false||this.stopped||this.metricFlushing)return;this.metricFlushing=true;
    try{
      await this.setContext();await this.checkpointMetrics();const generation=this.generation,partition=this.partition,now=this.clock();
      const report=(await this.entries()).filter(e=>e.kind==='METRICS'&&e.partition===partition&&e.nextRetryAt<=now).sort((a,b)=>a.createdAt-b.createdAt||a.id.localeCompare(b.id))[0];
      if(!report||now<this.nextMetricAt)return;
      if(report.expiresAt<=now){await this.storage.remove([report.id]);this.status.metricFailure='METRIC_REPORT_EXPIRED';return;}
      this.nextMetricAt=now+10_000;const scope=this.context(),credential=await this.config.authProvider(scope);
      if(!credential||credential.expiresAt<=this.clock()||scopeKey(credential.scope)!==partition||generation!==this.generation)return;
      this.metricAbort=new AbortController();const timeout=setTimeout(()=>this.metricAbort?.abort(),5000);
      try{
        const response=await this.transport(`${this.config.endpoint}/sdk-metrics`,{method:'POST',headers:{authorization:`Bearer ${credential.token}`,'content-type':'application/json','x-observability-application-id':this.config.applicationId,'x-observability-environment-id':this.config.environmentId},body:JSON.stringify(report.payload),signal:this.metricAbort.signal,credentials:'omit'});
        if(generation!==this.generation)return;
        if(response.ok){const ack:unknown=await response.json();if(generation!==this.generation)return;if(!isRecord(ack)||ack.accepted!==true||typeof ack.duplicate!=='boolean')throw Error('INVALID_METRIC_ACK');await this.metricWrite(generation,()=>this.storage.remove([report.id]));if(generation===this.generation)this.status.metricFailure=null;}
        else{if([400,403,404,409,410,422].includes(response.status)){await this.metricWrite(generation,()=>this.storage.remove([report.id]));if(generation===this.generation)this.status.metricFailure='METRIC_REPORT_REJECTED';}else throw Error('METRIC_RETRY');}
      }catch{
        if(generation===this.generation){const attempts=report.attempts+1;if(attempts>=12){await this.metricWrite(generation,()=>this.storage.remove([report.id]));if(generation===this.generation)this.status.metricFailure='METRIC_RETRY_EXHAUSTED';}else{await this.metricWrite(generation,()=>this.storage.put({...report,attempts,nextRetryAt:this.clock()+Math.max(10_000,retryDelay(attempts))}));if(generation===this.generation)this.status.metricFailure='METRICS_UNAVAILABLE';}}
      }finally{clearTimeout(timeout);}
    }catch{this.status.metricFailure='METRICS_UNAVAILABLE';}finally{this.metricFlushing=false;}
  }
  constructor(private readonly config:BrowserSdkConfiguration){
    const url=new URL(config.endpoint);
    if(url.protocol!=='https:'&&!(url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname)))throw new ContractError('SDK_ENDPOINT_REQUIRES_HTTPS');
    if(url.username||url.password||url.search||url.hash)throw new ContractError('INVALID_SDK_ENDPOINT');
    const retention=config.retentionMs;
    if(retention!==undefined&&(!isRecord(retention)||Object.keys(retention).some(key=>key!=='events'&&key!=='feedback')))throw new ContractError('INVALID_SDK_RETENTION');
    const duration=(value:unknown,maximum:number)=>{if(value===undefined)return maximum;if(typeof value!=='number'||!Number.isSafeInteger(value)||value<1000||value>maximum)throw new ContractError('INVALID_SDK_RETENTION');return value;};
    this.retentionMs={events:duration(retention?.events,48*3_600_000),feedback:duration(retention?.feedback,24*3_600_000)};
    this.storage=config.storage??(typeof indexedDB!=='undefined'?new IndexedDbQueue():new MemoryQueue());
    this.mode=this.storage instanceof MemoryQueue?'MEMORY':'DURABLE';
    // Native Window.fetch must not be invoked with the SDK instance as receiver.
    // A wrapper also leaves injected transports independent of browser binding.
    this.status.storage=this.mode;this.transport=config.transport??((input,init)=>fetch(input,init));this.clock=config.clock??Date.now;
    this.partition=scopeKey(this.context());
  }
  private context(){const scope=this.config.contextProvider();if(scope.applicationId!==this.config.applicationId||scope.environmentId!==this.config.environmentId)throw new ContractError('SDK_CONTEXT_MISMATCH');if(!isUuid(scope.applicationId)||!isUuid(scope.environmentId)||[scope.actorReference,scope.tenantReference].some(value=>value!==null&&(typeof value!=='string'||!value.trim()||value.length>160)))throw new ContractError('INVALID_SDK_CONTEXT');return scope;}
  private async degrade(){this.storage.close();this.storage=new MemoryQueue();this.mode='MEMORY';this.status.storage='MEMORY';this.status.lastFailure='OFFLINE_STORAGE_UNAVAILABLE';this.emit();}
  private async putData(envelope:OfflineEnvelope){const generation=this.generation;try{await this.storage.put(envelope);}catch{await this.degrade();if(generation!==this.generation||envelope.partition!==this.partition)return false;await this.storage.put(envelope);}return generation===this.generation&&envelope.partition===this.partition;}
  private async removeData(ids:string[]){if(!ids.length)return;const generation=this.generation;try{await this.storage.remove(ids);}catch{await this.degrade();if(generation===this.generation)await this.storage.remove(ids);}}
  private emit(){try{this.config.onStatus?.({...this.status});}catch{/* Consumer callbacks cannot break telemetry. */}}
  private async entries(){try{return await this.storage.list();}catch{await this.degrade();return this.storage.list();}}
  private serialize<T>(work:()=>Promise<T>):Promise<T>{const next=this.queueChain.then(work,work);this.queueChain=next.then(()=>undefined,()=>undefined);return next;}
  private metricWrite(generation:number,work:()=>Promise<void>){return this.serialize(async()=>{if(generation===this.generation)await work();});}
  async setContext():Promise<void>{
    const next=scopeKey(this.context());if(next===this.partition&&this.contextInitialized)return;this.contextInitialized=true;
    if(next!==this.partition){this.cancelRecovery();this.generation++;this.abort?.abort();this.metricAbort?.abort();this.partition=next;this.metrics.reset();this.nextMetricAt=0;this.status.dropped=0;this.status.metricFailure=null;}
    await this.serialize(async()=>{const old=await this.entries();await this.removeData(old.filter(e=>e.partition!==next).map(e=>e.id));});
    await this.updateStatus();
  }
  async logout():Promise<void>{this.cancelRecovery();this.generation++;this.abort?.abort();this.metricAbort?.abort();this.metrics.reset();this.nextMetricAt=0;this.status.metricFailure=null;this.status.dropped=0;await this.serialize(async()=>{const old=await this.entries();await this.removeData(old.map(e=>e.id));});await this.updateStatus();}
  private async enqueue(envelope:OfflineEnvelope):Promise<boolean>{
    return this.serialize(async()=>{
      if(this.stopped||envelope.partition!==this.partition)return false;
      let items=await this.entries();if(envelope.partition!==this.partition)return false;const expired=items.filter(e=>e.expiresAt<=this.clock());await this.removeData(expired.map(e=>e.id));if(envelope.partition!==this.partition)return false;this.countDropped(expired);items=items.filter(e=>e.expiresAt>this.clock());
      const maximumCount=Math.min(500,Math.max(1,this.config.maxQueueCount??500)),maximumBytes=Math.min(2_097_152,Math.max(16_384,this.config.maxQueueBytes??2_097_152));
      const data=items.filter(e=>e.kind!=='METRICS'),bytes=data.reduce((n,e)=>n+encodedBytes(e),0)+encodedBytes(envelope);
      if(data.length>=maximumCount||bytes>maximumBytes){this.countDropped([envelope]);this.status.lastFailure='OFFLINE_QUEUE_FULL';this.emit();return false;}
      if(!await this.putData(envelope))return false;
      await this.updateStatus();return true;
    });
  }
  async capture(input:EventInput):Promise<string|null>{
    try{
      await this.setContext();if(this.stopped||(this.config.categories&&!this.config.categories.includes(input.category)))return null;
      const sampling=Math.max(0,Math.min(1,this.config.sampling?.[input.category]??1));if(sampling===0||Math.random()>sampling)return null;
      const scope=this.context(),now=this.clock(),eventId=crypto.randomUUID();
      const event=sanitizeEvent({...input,eventId,schemaVersion:SCHEMA_VERSION,applicationId:scope.applicationId,environmentId:scope.environmentId,occurredAt:new Date(now).toISOString(),source:input.source??'BROWSER',releaseVersion:this.config.release,actorReference:scope.actorReference,tenantReference:scope.tenantReference,sessionCorrelationId:this.sessionId,safeMetadata:{...input.safeMetadata,sdkVersion:'0.1.0',sampleRate:sampling,sampleWeight:sampling?1/sampling:1}});
      const stored=await this.enqueue({id:eventId,partition:scopeKey(scope),kind:'EVENT',payload:event,createdAt:now,expiresAt:now+this.retentionMs.events,attempts:0,nextRetryAt:now});
      await this.checkpointMetrics();
      return stored?eventId:null;
    }catch{this.metrics.add('dropped');this.status.dropped++;this.status.lastFailure='EVENT_CAPTURE_REJECTED';this.emit();return null;}
  }
  async submitFeedback(input:FeedbackSubmission):Promise<boolean>{
    await this.setContext();const scope=this.context();if(!scope.actorReference)throw new ContractError('AUTHENTICATED_FEEDBACK_REQUIRED');
    const feedback=validateFeedback(input);feedback.subject=redactText(feedback.subject);feedback.description=redactText(feedback.description);
    const now=this.clock();return this.enqueue({id:feedback.feedbackId,partition:scopeKey(scope),kind:'FEEDBACK',payload:feedback,createdAt:now,expiresAt:now+this.retentionMs.feedback,attempts:0,nextRetryAt:now});
  }
  private async updateStatus(){const entries=(await this.entries()).filter(e=>e.partition===this.partition&&e.expiresAt>this.clock());this.status.queued=entries.filter(e=>e.kind!=='METRICS').length;this.status.metricQueued=entries.filter(e=>e.kind==='METRICS').length;this.emit();}
  async getStatus(){if(this.stopped)return{...this.status,queued:0,metricQueued:0,dropped:0};try{await this.setContext();}catch{return{...this.status,queued:0,metricQueued:0,dropped:0,metricFailure:null,lastFailure:'SDK_CONTEXT_UNAVAILABLE'};}await this.updateStatus();return {...this.status};}
  private async postpone(entries:OfflineEnvelope[],permanent=false){
    const generation=this.generation;return this.serialize(async()=>{
      if(generation!==this.generation)return;
      if(permanent){await this.removeData(entries.map(e=>e.id));if(generation===this.generation)this.countDropped(entries);return;}
      for(const item of entries){if(generation!==this.generation||item.partition!==this.partition)return;const attempts=item.attempts+1;if(attempts>=12){await this.removeData([item.id]);if(generation===this.generation)this.countDropped([{...item,attempts}]);continue;}await this.putData({...item,attempts,nextRetryAt:this.clock()+retryDelay(attempts)});}
    });
  }
  async flush():Promise<void>{
    if(this.stopped||this.flushing)return;this.flushing=true;
    const generation=this.generation;
    try{
      await this.setContext();const scope=this.context(),partition=scopeKey(scope),startedGeneration=this.generation;
      const all=await this.entries(),expired=all.filter(e=>e.expiresAt<=this.clock());await this.removeData(expired.map(e=>e.id));if(startedGeneration!==this.generation)return;this.countDropped(expired);
      const pending=all.filter(e=>e.kind!=='METRICS'&&e.partition===partition&&e.expiresAt>this.clock()&&e.nextRetryAt<=this.clock());if(!pending.length)return;
      const credential=await this.config.authProvider(scope);
      if(!credential||credential.expiresAt<=this.clock()||scopeKey(credential.scope)!==partition||startedGeneration!==this.generation)return;
      this.abort=new AbortController();const timeout=setTimeout(()=>this.abort?.abort(),15_000);
      try{
        const events:OfflineEnvelope[]=[];let batchBytes=encodedBytes({events:[]});
        for(const item of pending.filter(e=>e.kind==='EVENT')){const size=encodedBytes(item.payload)+(events.length?1:0);if(events.length>=LIMITS.batch||batchBytes+size>LIMITS.batchBytes)break;events.push(item);batchBytes+=size;}
        if(events.length){
          const response=await this.transport(`${this.config.endpoint}/events/batch`,{method:'POST',headers:{authorization:`Bearer ${credential.token}`,'content-type':'application/json'},body:JSON.stringify({events:events.map(e=>e.payload)}),signal:this.abort.signal,credentials:'omit'});
          if(startedGeneration!==this.generation)return;
          if(response.ok){
            const value:unknown=await response.json();
            if(startedGeneration!==this.generation)return;
            if(!isRecord(value)||value.schemaVersion!=='1.1'||!Array.isArray(value.acknowledgements))throw new Error('INVALID_ACK');
            const allowed=new Set(events.map(e=>e.id)),seen=new Set<string>();
            const ack=(value as unknown as BatchAcknowledgement).acknowledgements;
            if(ack.some(a=>!isRecord(a)||!allowed.has(a.eventId as string)||seen.has(a.eventId as string)||(seen.add(a.eventId as string),!['ACCEPTED','DUPLICATE','REJECTED','RETRYABLE'].includes(String(a.status)))))throw new Error('INVALID_ACK');
            await this.removeData(ack.filter(a=>a.status==='ACCEPTED'||a.status==='DUPLICATE'||a.status==='REJECTED').map(a=>a.eventId));
            if(startedGeneration!==this.generation)return;
            this.countDropped(events.filter(e=>ack.some(a=>a.eventId===e.id&&a.status==='REJECTED'&&!isPolicyExclusion(a))));
            this.metrics.add('retryDelivered',events.filter(e=>e.attempts>0&&ack.some(a=>a.eventId===e.id&&(a.status==='ACCEPTED'||a.status==='DUPLICATE'))).length);
            const unfinished=new Set(ack.filter(a=>a.status!=='RETRYABLE').map(a=>a.eventId));await this.postpone(events.filter(e=>!unfinished.has(e.id)));
          }else{await this.postpone(events,[400,403,404,410,413,422].includes(response.status));this.status.lastFailure=`INGESTION_HTTP_${response.status}`;}
        }
        for(const item of pending.filter(e=>e.kind==='FEEDBACK').slice(0,5)){
          if(startedGeneration!==this.generation)return;
          const response=await this.transport(`${this.config.endpoint}/feedback`,{method:'POST',headers:{authorization:`Bearer ${credential.token}`,'content-type':'application/json'},body:JSON.stringify(item.payload),signal:this.abort.signal,credentials:'omit'});
          if(startedGeneration!==this.generation)return;
          if(response.ok){const value:unknown=await response.json();if(startedGeneration!==this.generation)return;if(!isRecord(value)||value.feedbackId!==item.id||typeof value.trackingId!=='string'||!/^FB-[A-Z0-9-]{8,64}$/.test(value.trackingId))throw new Error('INVALID_FEEDBACK_ACK');await this.removeData([item.id]);if(startedGeneration!==this.generation)return;try{this.config.onFeedbackAcknowledged?.(item.id,value.trackingId);}catch{}}
          else await this.postpone([item],[400,403,404,410,413,422].includes(response.status));
        }
      }finally{clearTimeout(timeout);}
    }catch{
      this.status.lastFailure='INGESTION_UNAVAILABLE';
      if(generation===this.generation){const entries=await this.entries();await this.postpone(entries.filter(e=>e.kind!=='METRICS'&&e.partition===this.partition&&e.nextRetryAt<=this.clock()));}
    }finally{await this.flushMetrics();this.flushing=false;await this.updateStatus();}
  }
  private cancelRecovery(){if(this.recoveryTimer!==undefined)clearTimeout(this.recoveryTimer);this.recoveryTimer=undefined;this.nextRecoveryAt=0;}
  private requestRecovery(expected:IdentityScope,authenticated:boolean){
    try{
      if(this.stopped||this.recoveryStopped)return;
      const current=this.context(),partition=scopeKey(current);
      if(scopeKey(expected)!==partition||authenticated&&!current.actorReference||this.recoveryTimer!==undefined)return;
      const generation=this.generation;
      this.recoveryTimer=setTimeout(()=>{
        this.recoveryTimer=undefined;
        try{
          if(this.stopped||this.recoveryStopped||generation!==this.generation||scopeKey(this.context())!==partition)return;
          this.nextRecoveryAt=this.clock()+2000;
          void this.flush().catch(()=>undefined);
        }catch{/* Recovery notification never propagates into consuming work. */}
      },Math.max(0,this.nextRecoveryAt-this.clock()));
    }catch{/* Unknown identity is not permission to replay old data. */}
  }
  notifyApiConnectivity(expected:IdentityScope,successful:boolean):void{if(successful===true)this.requestRecovery(expected,false);}
  notifyAuthenticatedActivity(expected:IdentityScope):void{this.requestRecovery(expected,true);}
  trace(){return newTrace();}
  async reportApiFailure(input:{operationName:string;url:string;httpStatus?:number;durationMs?:number;requestId?:string;traceId?:string;error?:unknown}){
    if(input.url.startsWith(this.config.endpoint))return null;
    const expected=input.httpStatus!==undefined&&input.httpStatus>=400&&input.httpStatus<500;
    return this.capture({category:input.httpStatus?'BUSINESS_OPERATION':'CONNECTIVITY',severity:expected?'INFO':'ERROR',eventCode:expected?'api.expected_rejection':'api.failed',normalizedMessage:expected?'Operation rejected':'API operation failed',operationName:input.operationName,routeTemplate:routeTemplate(input.url),httpStatus:input.httpStatus,durationMs:input.durationMs,requestId:input.requestId,traceId:input.traceId});
  }
  start():()=>void{
    if(this.cleanups.length||typeof window==='undefined')return()=>void this.shutdown();
    this.stopped=false;this.recoveryStopped=false;
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
  async shutdown(){this.recoveryStopped=true;this.cancelRecovery();await this.checkpointMetrics();this.stopped=true;this.generation++;this.abort?.abort();this.metricAbort?.abort();if(this.timer)clearInterval(this.timer);for(const cleanup of this.cleanups.splice(0))cleanup();await this.queueChain;this.storage.close();}
}
