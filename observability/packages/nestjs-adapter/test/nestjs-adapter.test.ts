import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { NodeSdk } from '@observability/node-sdk';
import { observeJob } from '../src/index.js';
describe('generic background adapter',()=>{
  it('captures failure and rethrows original exception without storing job payload',async()=>{const app=crypto.randomUUID(),env=crypto.randomUUID();const sdk=new NodeSdk({applicationId:app,environmentId:env,endpoint:'https://hub.example.test',credentialProvider:async()=>null,fallback:()=>{}}),error=new Error('Controlled failure');await expect(observeJob(sdk,{applicationId:app,environmentId:env,actorReference:null,tenantReference:'scope'},'directory.sync',async()=>{throw error;})).rejects.toBe(error);expect(sdk.stats().queued).toBe(1);});
  it('leaves successful consumer return value intact',async()=>{const app=crypto.randomUUID(),env=crypto.randomUUID();const sdk=new NodeSdk({applicationId:app,environmentId:env,endpoint:'https://hub.example.test',credentialProvider:async()=>null});expect(await observeJob(sdk,{applicationId:app,environmentId:env,actorReference:null,tenantReference:null},'test',async()=>42)).toBe(42);expect(sdk.stats().queued).toBe(0);});
});
