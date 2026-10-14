import { Injectable, HttpException, type CallHandler, type ExecutionContext, type NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { NodeSdk, type NodeContext } from '@observability/node-sdk';
import { routeTemplate } from '@observability/core';
export interface ScopeResolver {resolve(request:unknown):Promise<NodeContext>;}
/** Product host injects identity resolution; the adapter knows no membership. */
@Injectable()
export class ObservabilityInterceptor implements NestInterceptor {
  constructor(private readonly sdk:NodeSdk,private readonly resolver:ScopeResolver){}
  async intercept(context:ExecutionContext,next:CallHandler):Promise<Observable<unknown>>{
    const request=context.switchToHttp().getRequest<{url?:string;method?:string;route?:{path?:string};headers?:Record<string,string|undefined>}>();
    if(request.url?.includes('/observability/'))return next.handle();
    let scope:NodeContext;
    try{scope=await this.resolver.resolve(request);}catch{return next.handle();}
    const trace=this.sdk.trace(request.headers?.traceparent),requestId=request.headers?.['x-request-id'];
    const completeScope={...scope,traceId:trace.traceId,spanId:trace.spanId,requestId:requestId&&/^[A-Za-z0-9_.:-]{1,100}$/.test(requestId)?requestId:crypto.randomUUID()};
    const response=context.switchToHttp().getResponse<{setHeader?:(name:string,value:string)=>void;statusCode?:number}>();
    response.setHeader?.('X-Request-Id',completeScope.requestId);response.setHeader?.('traceparent',trace.traceparent);
    const operation=`${request.method??'HTTP'} ${routeTemplate(request.route?.path??request.url??'/')}`,started=performance.now();
    return new Observable(subscriber=>{
      const subscription=this.sdk.run(completeScope,()=>next.handle().subscribe({
        next:value=>subscriber.next(value),
        error:error=>{this.sdk.run(completeScope,()=>{const status=error instanceof HttpException?error.getStatus():500;if(status>=500)this.sdk.captureException(error,{operationName:operation});this.sdk.capture({category:'PERFORMANCE',severity:status>=500?'ERROR':'INFO',eventCode:'http.operation',normalizedMessage:'HTTP operation completed',operationName:operation,routeTemplate:routeTemplate(request.route?.path??request.url??'/'),httpStatus:status,durationMs:Math.round(performance.now()-started),safeMetadata:{outcome:status>=500?'FAILURE':'REJECTED'}});});subscriber.error(error);},
        complete:()=>{this.sdk.run(completeScope,()=>this.sdk.capture({category:'PERFORMANCE',severity:'INFO',eventCode:'http.operation',normalizedMessage:'HTTP operation completed',operationName:operation,routeTemplate:routeTemplate(request.route?.path??request.url??'/'),httpStatus:response.statusCode??200,durationMs:Math.round(performance.now()-started),safeMetadata:{outcome:'SUCCESS'}}));subscriber.complete();}
      }));
      return()=>subscription.unsubscribe();
    });
  }
}
export async function observeJob<T>(sdk:NodeSdk,context:NodeContext,jobType:string,work:()=>Promise<T>):Promise<T>{
  return sdk.run(context,async()=>{try{return await work();}catch(error){sdk.captureException(error,{category:'WORKER',source:'WORKER',operationName:jobType,eventCode:'worker.job_failed'});throw error;}});
}
