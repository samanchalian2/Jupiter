import 'reflect-metadata';
import { HttpException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { lastValueFrom, of, throwError } from 'rxjs';
import { NodeSdk } from '@observability/node-sdk';
import { ObservabilityInterceptor, observeJob } from '../src/index.js';

function httpFixture(sdk:NodeSdk,path='/tickets'){
  const headers:Record<string,string>={};
  const context={switchToHttp:()=>({getRequest:()=>({url:path,method:'POST',route:{path},headers:{}}),getResponse:()=>({statusCode:201,setHeader:(name:string,value:string)=>{headers[name]=value;}})})} as never;
  const interceptor=new ObservabilityInterceptor(sdk,{resolve:async()=>({applicationId:sdk.context()?.applicationId??'',environmentId:sdk.context()?.environmentId??'',actorReference:null,tenantReference:null})});
  return{headers,context,interceptor};
}
describe('generic background adapter',()=>{
  it('does not attribute a fallback failure to an enclosing human when context setup fails',async()=>{const app=crypto.randomUUID(),env=crypto.randomUUID(),sdk=new NodeSdk({applicationId:app,environmentId:env,endpoint:'https://hub.example.test',credentialProvider:async()=>null}),run=sdk.run.bind(sdk),error=Error('Original');vi.spyOn(sdk,'run').mockImplementation(()=>{throw Error('Context unavailable');});await expect(run({applicationId:app,environmentId:env,actorReference:'human',tenantReference:'other'},()=>observeJob(sdk,{applicationId:app,environmentId:env,actorReference:null,tenantReference:null},'worker.test',async()=>{throw error;}))).rejects.toBe(error);expect(sdk.stats().queued).toBe(0);});
  it('runs business work exactly once even if instrumentation throws before or after entering',async()=>{
    for(const after of [false,true]){const app=crypto.randomUUID(),env=crypto.randomUUID(),sdk=new NodeSdk({applicationId:app,environmentId:env,endpoint:'https://hub.example.test',credentialProvider:async()=>null}),work=vi.fn(async()=>42);
      vi.spyOn(sdk,'run').mockImplementation(((_context:unknown,run:()=>Promise<number>)=>{if(after)void run();throw Error('Controlled instrumentation failure');}) as never);
      expect(await observeJob(sdk,{applicationId:app,environmentId:env,actorReference:null,tenantReference:null},'test',work)).toBe(42);expect(work).toHaveBeenCalledTimes(1);
    }
  });
  it('preserves the business exception when capture itself throws',async()=>{const app=crypto.randomUUID(),env=crypto.randomUUID(),sdk=new NodeSdk({applicationId:app,environmentId:env,endpoint:'https://hub.example.test',credentialProvider:async()=>null}),error=Error('Original operation failure');vi.spyOn(sdk,'captureException').mockImplementation(()=>{throw Error('Controlled observer failure');});await expect(observeJob(sdk,{applicationId:app,environmentId:env,actorReference:null,tenantReference:null},'test',async()=>{throw error;})).rejects.toBe(error);});
  it('captures failure and rethrows original exception without storing job payload',async()=>{const app=crypto.randomUUID(),env=crypto.randomUUID();const sdk=new NodeSdk({applicationId:app,environmentId:env,endpoint:'https://hub.example.test',credentialProvider:async()=>null,fallback:()=>{}}),error=new Error('Controlled failure');await expect(observeJob(sdk,{applicationId:app,environmentId:env,actorReference:null,tenantReference:'scope'},'directory.sync',async()=>{throw error;})).rejects.toBe(error);expect(sdk.stats().queued).toBe(1);});
  it('leaves successful consumer return value intact',async()=>{const app=crypto.randomUUID(),env=crypto.randomUUID();const sdk=new NodeSdk({applicationId:app,environmentId:env,endpoint:'https://hub.example.test',credentialProvider:async()=>null});expect(await observeJob(sdk,{applicationId:app,environmentId:env,actorReference:null,tenantReference:null},'test',async()=>42)).toBe(42);expect(sdk.stats().queued).toBe(0);});
});

describe('generic HTTP adapter failure isolation',()=>{
  const setup=()=>{const applicationId=crypto.randomUUID(),environmentId=crypto.randomUUID(),sdk=new NodeSdk({applicationId,environmentId,endpoint:'https://hub.example.test',credentialProvider:async()=>null});const fixture=httpFixture(sdk);Object.assign(fixture.interceptor,{resolver:{resolve:async()=>({applicationId,environmentId,actorReference:null,tenantReference:null})}});return{sdk,...fixture};};
  it('preserves a successful business response when completion capture throws',async()=>{const f=setup(),work=vi.fn(()=>of({created:true}));vi.spyOn(f.sdk,'capture').mockImplementation(()=>{throw Error('Observer unavailable');});const stream=await f.interceptor.intercept(f.context,{handle:work});expect(await lastValueFrom(stream)).toEqual({created:true});expect(work).toHaveBeenCalledTimes(1);});
  it('preserves expected and unexpected HTTP exceptions when capture throws',async()=>{for(const error of [new HttpException('Denied',403),Error('Controlled secret=password-value')]){const f=setup(),work=vi.fn(()=>throwError(()=>error));vi.spyOn(f.sdk,'capture').mockImplementation(()=>{throw Error('Observer unavailable');});vi.spyOn(f.sdk,'captureException').mockImplementation(()=>{throw Error('Observer unavailable');});const stream=await f.interceptor.intercept(f.context,{handle:work});await expect(lastValueFrom(stream)).rejects.toBe(error);expect(work).toHaveBeenCalledTimes(1);}});
  it('subscribes to business work exactly once if context setup throws before or after entry',async()=>{for(const after of [false,true]){const f=setup(),work=vi.fn(()=>of('ok'));vi.spyOn(f.sdk,'run').mockImplementation(((_scope:unknown,start:()=>unknown)=>{if(after)start();throw Error('Context unavailable');}) as never);const stream=await f.interceptor.intercept(f.context,{handle:work});expect(await lastValueFrom(stream)).toBe('ok');expect(work).toHaveBeenCalledTimes(1);}});
  it('keeps expected rejection non-critical and classifies controlled cross-domain failures by operation',async()=>{
    const expected=setup(),capture=vi.spyOn(expected.sdk,'capture'),captureException=vi.spyOn(expected.sdk,'captureException'),denied=new HttpException('Denied',403);
    await expect(lastValueFrom(await expected.interceptor.intercept(expected.context,{handle:()=>throwError(()=>denied)}))).rejects.toBe(denied);
    expect(captureException).not.toHaveBeenCalled();expect(capture).toHaveBeenCalledWith(expect.objectContaining({severity:'INFO',httpStatus:403,safeMetadata:{outcome:'REJECTED'}}));
    for(const path of ['/tickets','/auth/session','/organizations/configuration','/ai/reviews','/assist/cases','/external/dependency']){
      const f=setup(),failure=Error('Controlled failure password=fixture-secret'),exception=vi.spyOn(f.sdk,'captureException');Object.assign(f.context,{switchToHttp:()=>({getRequest:()=>({url:path,method:'POST',route:{path},headers:{}}),getResponse:()=>({statusCode:500,setHeader:()=>undefined})})});
      await expect(lastValueFrom(await f.interceptor.intercept(f.context,{handle:()=>throwError(()=>failure)}))).rejects.toBe(failure);
      expect(exception).toHaveBeenCalledWith(failure,expect.objectContaining({operationName:`POST ${path}`}));
    }
  });
});
