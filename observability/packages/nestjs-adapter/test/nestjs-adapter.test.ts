import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';
import { NodeSdk } from '@observability/node-sdk';
import { observeJob } from '../src/index.js';
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
