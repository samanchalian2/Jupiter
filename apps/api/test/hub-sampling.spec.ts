import { describe, expect, it, vi } from 'vitest';
import { HubBindingService } from '../src/observability/hub-binding.service.js';
describe('host storage sampling separation',()=>{
 it('dispatches one background pass without awaiting it and waits during shutdown before pool close',async()=>{
  let release!:()=>void;const pass=new Promise<void>(done=>release=done),sampleStorage=vi.fn(()=>pass),close=vi.fn(async()=>undefined);
  const host=new HubBindingService(undefined as never,undefined as never,undefined as never);Object.assign(host,{selfMonitoring:{sampleStorage,flush:async()=>undefined},hub:{close}});
  const schedule=()=> (host as unknown as {scheduleStorageSampling():void}).scheduleStorageSampling();
  expect(schedule()).toBeUndefined();schedule();expect(sampleStorage).toHaveBeenCalledTimes(1);
  const stopping=host.onModuleDestroy();await Promise.resolve();expect(close).not.toHaveBeenCalled();release();await stopping;expect(close).toHaveBeenCalledTimes(1);
 });
});
