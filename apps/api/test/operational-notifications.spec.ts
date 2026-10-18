import { describe,expect,it,vi } from 'vitest';
import { NotificationService,type OperationalNotification } from '../src/notifications/notification.service.js';
import { NotificationController } from '../src/notifications/notification.controller.js';
import type { AuthService } from '../src/auth/auth.service.js';
import type { TicketActorService } from '../src/tickets/ticket-actor.service.js';

describe('account-scoped operational notification port',()=>{
 const notice:OperationalNotification={id:'one',type:'observability.alert',title:'Operational alert',href:'/operations#alerts',occurredAt:'2026-10-18T00:00:00Z',read:false};
 it('passes verified identity on each read and unregisters without touching tenant persistence',async()=>{
  const service=new NotificationService(),source=vi.fn(async(id:string)=>id==='operator'?[notice]:[]),off=service.registerOperationalSource('hub',source);
  expect(await service.operationalInbox('operator')).toEqual([notice]);expect(await service.operationalInbox('ordinary')).toEqual([]);
  expect(source.mock.calls).toEqual([['operator'],['ordinary']]);expect(()=>service.registerOperationalSource('hub',source)).toThrow();off();expect(await service.operationalInbox('operator')).toEqual([]);
 });
 it('surfaces unavailable storage instead of silently treating it as no alerts',async()=>{const service=new NotificationService();service.registerOperationalSource('hub',async()=>{throw new Error('Controlled outage');});await expect(service.operationalInbox('operator')).rejects.toThrow('Controlled outage');});
 it('denies missing, expired and disabled-account sessions before invoking any source',async()=>{
  const service=new NotificationService(),source=vi.fn(async()=>[notice]);service.registerOperationalSource('hub',source);
  const auth={verify:vi.fn(async()=>({sub:'verified'})),profile:vi.fn(async()=>({id:'verified'}))};const controller=new NotificationController({} as TicketActorService,service,auth as unknown as AuthService);
  await expect(controller.operations()).rejects.toThrow();expect(source).not.toHaveBeenCalled();
  auth.verify.mockRejectedValueOnce(new Error('Expired'));await expect(controller.operations('Bearer placeholder')).rejects.toThrow();expect(source).not.toHaveBeenCalled();
  auth.profile.mockRejectedValueOnce(new Error('Disabled'));await expect(controller.operations('Bearer placeholder')).rejects.toThrow();expect(source).not.toHaveBeenCalled();
  expect(await controller.operations('Bearer placeholder')).toEqual([notice]);expect(source).toHaveBeenCalledWith('verified');
 });
});
