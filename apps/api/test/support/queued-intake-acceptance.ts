import { expect } from 'vitest';
import type { DatabaseService } from '../../src/database/database.service.js';
import type { TicketIntakeService } from '../../src/ticket-intake/ticket-intake.service.js';
import type { TicketService } from '../../src/tickets/ticket.service.js';

/** Executed by the disposable-DB worker integration, not a provider function mock. */
export async function acceptQueuedIntakeRecovery(input:{
 database:DatabaseService;intakes:TicketIntakeService;tickets:TicketService;
 actor:{organizationId:string;userId:string;roles:string[]};drain:()=>Promise<void>;
 requests:Array<{path:string;contentType:string}>;privateMarker:string;failNextAnalysis:()=>void;
 afterFirstRetry?:()=>Promise<void>;
}){
 const {database,intakes,tickets,actor,drain,requests}=input;
 const organizationId=actor.organizationId;
 const ticketCount=async()=>(await database.query('SELECT count(*)::int total FROM tickets WHERE organization_id=$1',[organizationId])).rows[0].total as number;
 const initialTickets=await ticketCount();
 const summaries:Array<{mode:string;chatCalls:number;audioCalls:number;settlements:number}>=[];
 for(const mode of ['text','conversation','legacy-voice','conversation-voice'] as const){
  const voice=mode.endsWith('voice'),conversation=mode.startsWith('conversation');
  const session=await intakes.create(actor,{description:conversation||voice?'':`Synthetic input ${input.privateMarker}`});
  if(conversation)await intakes.addTextMessage(actor,session.id,{text:`Synthetic conversation ${input.privateMarker}`});
  if(mode==='conversation')await intakes.addTextMessage(actor,session.id,{text:'Synthetic clarification'});
  if(voice){
   const upload={filename:'fixture.wav',contentType:'audio/wav',byteSize:4,durationSeconds:1};
   if(conversation){const result=await intakes.requestMessageVoiceUpload(actor,session.id,upload);await intakes.completeMessageVoiceUpload(actor,session.id,result.message.id);}
   else{await intakes.requestVoiceUpload(actor,session.id,upload);await intakes.completeVoiceUpload(actor,session.id);}
  }
  const analyze=()=>conversation?intakes.analyzeConversation(actor,session.id):intakes.analyze(actor,session.id);
  input.failNextAnalysis();const before=requests.length;
  await analyze();await analyze();
  const action=async()=>(await database.query<{id:string;status:string}>("SELECT id,status FROM commercial_smart_actions WHERE organization_id=$1 AND capability_code='AI_SMART_INTAKE' AND subject_id=$2",[organizationId,session.id])).rows;
  expect(await action()).toHaveLength(1);expect((await action())[0].status).toBe('RESERVED');
  const actionId=(await action())[0].id;
  const settlements=async()=>(await database.query("SELECT unit_count FROM commercial_usage_ledger WHERE organization_id=$1 AND metadata->>'smartActionId'=$2 AND event_type='SMART_ACTION_SETTLED'",[organizationId,actionId])).rows;
  await drain();
  const retry=(await database.query('SELECT status,next_attempt_at,ticket_id FROM ticket_intake_sessions WHERE id=$1 AND organization_id=$2',[session.id,organizationId])).rows[0];
  // Conversation retains its original TRANSCRIBING stage on a later analysis
  // failure; persisted message transcript prevents a second audio provider call.
  expect(retry.status).toBe(mode==='conversation-voice'?'TRANSCRIBING':'ANALYZING');expect(retry.next_attempt_at).toBeTruthy();expect(retry.ticket_id).toBeNull();
  expect(await settlements()).toEqual([]);expect((await action())[0].status).toBe('RESERVED');expect(await ticketCount()).toBe(initialTickets);
  if(mode==='text')await input.afterFirstRetry?.();
  // Advance only this disposable intake's due date, not retry counters/state.
  await database.query('UPDATE ticket_intake_sessions SET next_attempt_at=now() WHERE id=$1 AND organization_id=$2',[session.id,organizationId]);
  await drain();const completed=await intakes.get(actor,session.id);
  expect(completed.status).toBe('SUCCEEDED');expect(completed.suggestions).toMatchObject({title:'درخواست آزمایشی پشتیبانی چاپگر',priority:'NORMAL'});
  expect((await database.query('SELECT ticket_id FROM ticket_intake_sessions WHERE id=$1',[session.id])).rows[0].ticket_id).toBeNull();
  expect(await ticketCount()).toBe(initialTickets);expect(await settlements()).toEqual([{unit_count:-1}]);
  expect((await action())[0].status).toBe('SETTLED');expect(await action()).toHaveLength(1);
  const after=requests.length;await analyze();await drain();await drain();expect(requests).toHaveLength(after);expect(await settlements()).toEqual([{unit_count:-1}]);
  const calls=requests.slice(before),chatCalls=calls.filter(row=>row.path==='/v1/chat/completions').length,audioCalls=calls.filter(row=>row.path==='/v1/audio/transcriptions').length;
  expect(chatCalls).toBe(2);expect(audioCalls).toBe(voice?1:0);
  expect(calls.filter(row=>row.path==='/v1/audio/transcriptions').every(row=>row.contentType.startsWith('multipart/form-data;'))).toBe(true);
  const telemetry=(await database.query('SELECT operation_code,audio_duration_seconds::float8 audio_duration_seconds FROM ai_operation_telemetry WHERE organization_id=$1 AND commercial_smart_action_id=$2',[organizationId,actionId])).rows;
  expect(telemetry.every(row=>row.operation_code==='AI_SMART_INTAKE')).toBe(true);
  expect(telemetry.filter(row=>row.audio_duration_seconds!==null)).toEqual(voice?[{operation_code:'AI_SMART_INTAKE',audio_duration_seconds:1}]:[]);
  summaries.push({mode,chatCalls,audioCalls,settlements:1});
 }
 // Only an explicit caller command creates a draft; analysis did not do so.
 const successful=(await database.query("SELECT id FROM ticket_intake_sessions WHERE organization_id=$1 AND status='SUCCEEDED' ORDER BY created_at DESC LIMIT 1",[organizationId])).rows[0];
 const draft=await intakes.createDraft(actor,{intakeSessionId:successful.id,title:'Explicit confirmed fixture',description:'Explicit synthetic confirmation'});
 expect(await ticketCount()).toBe(initialTickets+1);
 expect((await database.query('SELECT status FROM tickets WHERE id=$1',[draft.id])).rows[0].status).toBe('DRAFT');
 await tickets.submit(actor,draft.id);expect((await database.query('SELECT status FROM tickets WHERE id=$1',[draft.id])).rows[0].status).toBe('OPEN');
 console.log(JSON.stringify({event:'observability.local_queued_intake_recovery',result:'PASS',modes:summaries,automaticTickets:0,explicitSubmit:'OPEN',limits:'Disposable PostgreSQL, real QueueWorker and loopback HTTP providers; invalid structured response then retry. Not external AI, full AppModule or browser acceptance.'}));
}
