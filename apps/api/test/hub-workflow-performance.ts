import { randomUUID } from 'node:crypto';
import { Controller, Get, Headers, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { expect } from 'vitest';
import { NodeSdk } from '@observability/node-sdk';
import { AuthService } from '../src/auth/auth.service.js';
import { DatabaseService } from '../src/database/database.service.js';
import { TicketActorService } from '../src/tickets/ticket-actor.service.js';
import { TicketController } from '../src/tickets/ticket.controller.js';
import { TicketService } from '../src/tickets/ticket.service.js';
import { HubBindingService } from '../src/observability/hub-binding.service.js';
import { HubInterceptor } from '../src/observability/hub.interceptor.js';
import { NotificationService } from '../src/notifications/notification.service.js';

/** Existing supported tenant fixture only; no host role, password or config changes. */
export async function measureTicketWorkflow(database:DatabaseService,tickets:TicketService,userId:string,organizationId:string){
 const applicationId=randomUUID(),environmentId=randomUUID(),jwt=new JwtService({secret:randomUUID(),signOptions:{expiresIn:'5m'}});
 const auth=new AuthService(database,jwt),actors=new TicketActorService(auth,database),controller=new TicketController(actors,tickets);
 const binding=new HubBindingService(auth,database,new NotificationService(database));
 // Scope configuration is fixture-only; use the ACTUAL host resolver, never fake identity.
 Object.assign(binding,{configuration:{applicationId,environmentId,enabled:true}});
 let enabled=false,networkCalls=0;
 const sdk=new NodeSdk({applicationId,environmentId,endpoint:'http://127.0.0.1:1',credentialProvider:async()=>null,reportMetrics:false,fallback:()=>undefined,transport:async()=>{networkCalls++;throw Error('No Hub network in overhead fixture');}});
 const port={instrumentation:()=>enabled?sdk:undefined,requestContext:(request:Parameters<HubBindingService['requestContext']>[0])=>binding.requestContext(request)} as HubBindingService;
 @Controller('tickets') class MeasuredController {
  @Get('queue') queue(@Headers('authorization') authorization?:string,@Headers('x-organization-id') organization?:string){return controller.queue(undefined!,undefined!,undefined!,undefined!,'recent','1','20',authorization,organization);}
 }
 @Module({controllers:[MeasuredController]}) class MeasuredModule {}
 const app=await NestFactory.create(MeasuredModule,{logger:false});app.useGlobalInterceptors(new HubInterceptor(port));await app.listen(0,'127.0.0.1');
 const url=await app.getUrl(),token=await jwt.signAsync({sub:userId}),headers={authorization:`Bearer ${token}`,'x-organization-id':organizationId};
 const baseline:number[]=[],observed:number[]=[];
 const stats=(values:number[])=>{const sorted=[...values].sort((a,b)=>a-b);return{samples:sorted.length,p50Ms:sorted[9],p95Ms:sorted[18],maxMs:sorted[19]};};
 try{
  expect(await binding.requestContext({headers})).toMatchObject({actorReference:userId,tenantReference:organizationId});
  const read=async(instrumented:boolean)=>{enabled=instrumented;const started=performance.now(),response=await fetch(`${url}/tickets/queue`,{headers});expect(response.status).toBe(200);const body=await response.json();expect(Array.isArray(body.items)).toBe(true);expect(body.items.length).toBeGreaterThan(0);if(instrumented)expect(response.headers.get('traceparent')).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/);return{duration:performance.now()-started,body};};
  // Warm both paths before alternating order to reduce cold-path/order bias.
  for(let index=0;index<4;index++){await read(false);await read(true);}
  for(let index=0;index<20;index++){
   const order=index%2?[true,false]:[false,true];const pair=[];
   for(const mode of order){const value=await read(mode);(mode?observed:baseline).push(value.duration);pair.push(value.body);}
   expect(pair[0]).toEqual(pair[1]);
  }
  expect(sdk.stats().queued).toBe(24);expect(networkCalls).toBe(0);
  // Saturated/unavailable telemetry cannot stop the same authorized read path.
  while(sdk.stats().queued<500)sdk.capture({category:'BACKEND',severity:'INFO',eventCode:'fixture.fill',normalizedMessage:'Controlled capacity fill'});
  const dropped=sdk.stats().dropped;for(let index=0;index<3;index++)await read(true);expect(sdk.stats().queued).toBe(500);expect(sdk.stats().dropped).toBe(dropped+3);
  // The actual ticket actor service still rejects missing/foreign membership.
  for(const invalidHeaders of [{},{...headers,'x-organization-id':randomUUID()}]){const response=await fetch(`${url}/tickets/queue`,{headers:invalidHeaders});expect(response.status).toBe(401);}
  console.log(JSON.stringify({event:'observability.local_jupiter_ticket_queue_overhead',baseline:stats(baseline),observed:stats(observed),p95DifferenceMs:stats(observed).p95Ms-stats(baseline).p95Ms,alternatingPairs:20,identicalBusinessResponses:true,realJwtAndMembership:true,saturatedTelemetryReads:3,deniedInvalidMembership:true,hubNetworkCalls:networkCalls,limits:'LOCAL ephemeral Nest HTTP wrapper invoking actual TicketController/Actor/Service and HubInterceptor/identity resolver; existing fixture tenant. SDK queue only/no timer or flush/provider. Not full AppModule middleware, production cadence, Browser shell, write lifecycle, PostgreSQL CPU or production SLO.'}));
 }finally{await sdk.shutdown();await app.close();}
}
