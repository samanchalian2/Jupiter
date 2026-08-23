import { BadRequestException, NotFoundException } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AiCredentialService } from '../src/ai/ai-credential.service.js';
import { AttachmentService } from '../src/attachments/attachment.service.js';
import type { AttachmentStorage, StoredObject } from '../src/attachments/attachment-storage.js';
import { DatabaseService } from '../src/database/database.service.js';
import { TicketIntakeService } from '../src/ticket-intake/ticket-intake.service.js';
import { TICKET_INTAKE_CONTRACT_VERSION, type TicketIntakeContext, type TicketIntakeProvider } from '../src/ticket-intake/ticket-intake-provider.js';
import { TicketService } from '../src/tickets/ticket.service.js';
import type { TranscriptionProvider } from '../src/transcription/transcription-provider.js';

type FakeObject=StoredObject&{bytes?:Uint8Array};
class IntakeStorage implements AttachmentStorage {
  readonly objects=new Map<string,FakeObject>(); readonly deleted:string[]=[];
  lastUpload?:{key:string;contentType:string;metadata?:Record<string,string>};
  async createUploadUrl(key:string,contentType:string,_expires:number,metadata?:Record<string,string>){this.lastUpload={key,contentType,metadata};return `https://storage.test/upload/${key}`;}
  async createDownloadUrl(key:string){return `https://storage.test/download/${key}`;}
  async createViewUrl(key:string){return `https://storage.test/view/${key}`;}
  async head(key:string){return this.objects.get(key);}
  async read(key:string){const object=this.objects.get(key);if(!object?.bytes)throw new Error('missing object');return object.bytes;}
  async delete(key:string){this.deleted.push(key);this.objects.delete(key);}
}

process.env.AI_CREDENTIAL_ENCRYPTION_KEY=Buffer.alloc(32,12).toString('base64');
const database=new DatabaseService(); const storage=new IntakeStorage(); const credentials=new AiCredentialService();
const tickets=new TicketService(database); const attachments=new AttachmentService(database,storage);
const intakes=new TicketIntakeService(database,tickets,attachments,credentials,storage);
let orgA='';let orgB='';let userA='';let userB='';let category='';let subcategory='';let department='';let location='';let discipline='';let titleLibraryId='';let tagId='';
const actorA=()=>({organizationId:orgA,userId:userA,roles:['REQUESTER']}); const actorB=()=>({organizationId:orgB,userId:userB,roles:['REQUESTER']});

function analysis(context?:{capture?:(value:TicketIntakeContext)=>void;disciplineConfidence?:number}):TicketIntakeProvider {
  return {analyzeIntake:async(input)=>{context?.capture?.(input.context);return {output:{contractVersion:TICKET_INTAKE_CONTRACT_VERSION,title:'Printer is offline',titleLibraryId:null,categoryId:category,subcategoryId:'00000000-0000-0000-0000-000000000001',departmentId:department,locationId:location,disciplineId:discipline,priority:'HIGH',customFields:{device_type:'printer',asset_number:42},tags:[],missingFields:[],confidenceByField:{title:.98,categoryId:.97,subcategoryId:.95,departmentId:.9,locationId:.88,disciplineId:context?.disciplineConfidence??.7,priority:.91,'customFields.device_type':.82,'customFields.asset_number':.5,tags:.9},primaryIssue:{summary:'Printer is offline',serviceAsset:'printer',issueType:'outage',confidence:.98}},usage:{inputTokens:20,outputTokens:10}};}};
}
const noVoice:TranscriptionProvider={transcribe:async()=>{throw new Error('unexpected transcription');}};

beforeAll(async()=>{
  const orgs=await database.query<{id:string;slug:string}>("INSERT INTO organizations(slug,name) VALUES('goal14-a','Goal 14 A'),('goal14-b','Goal 14 B') ON CONFLICT(slug) DO UPDATE SET name=EXCLUDED.name RETURNING id,slug");
  orgA=orgs.rows.find(row=>row.slug==='goal14-a')!.id;orgB=orgs.rows.find(row=>row.slug==='goal14-b')!.id;
  const users=await database.query<{id:string;email:string}>("INSERT INTO users(email,display_name,password_hash) VALUES('goal14-a@jupiter.local','Goal 14 A','scrypt$AA$AA'),('goal14-b@jupiter.local','Goal 14 B','scrypt$AA$AA') ON CONFLICT(email) DO UPDATE SET display_name=EXCLUDED.display_name RETURNING id,email");
  userA=users.rows.find(row=>row.email==='goal14-a@jupiter.local')!.id;userB=users.rows.find(row=>row.email==='goal14-b@jupiter.local')!.id;
  for(const table of ['ticket_intake_secondary_ticket_links','ticket_intake_provenance','ticket_attachments','ticket_custom_field_values','ticket_sla_clocks','ticket_activities','ticket_assignments','ticket_status_transitions','ticket_tag_links','tickets','ticket_intake_messages','ticket_intake_sessions','outbox_events','organization_ai_settings','audit_logs','ticket_title_library','ticket_tags','ticket_custom_field_definitions','subcategories','categories','departments','locations','disciplines','memberships']) await database.query(`DELETE FROM ${table} WHERE organization_id IN($1,$2)`,[orgA,orgB]);
  await database.query('INSERT INTO memberships(organization_id,user_id) VALUES($1,$2),($3,$4) ON CONFLICT DO NOTHING',[orgA,userA,orgB,userB]);
  await database.query("INSERT INTO membership_roles(membership_id,role_id) SELECT m.id,r.id FROM memberships m CROSS JOIN roles r WHERE m.organization_id IN($1,$2) AND r.code='REQUESTER' ON CONFLICT DO NOTHING",[orgA,orgB]);
  category=(await database.query<{id:string}>("INSERT INTO categories(organization_id,code,name) VALUES($1,'hardware','Hardware') RETURNING id",[orgA])).rows[0].id;
  subcategory=(await database.query<{id:string}>("INSERT INTO subcategories(organization_id,category_id,code,name) VALUES($1,$2,'printer','Printer') RETURNING id",[orgA,category])).rows[0].id;
  department=(await database.query<{id:string}>("INSERT INTO departments(organization_id,code,name) VALUES($1,'it','IT') RETURNING id",[orgA])).rows[0].id;
  location=(await database.query<{id:string}>("INSERT INTO locations(organization_id,code,name) VALUES($1,'hq','HQ') RETURNING id",[orgA])).rows[0].id;
  discipline=(await database.query<{id:string}>("INSERT INTO disciplines(organization_id,code,name) VALUES($1,'support','Support') RETURNING id",[orgA])).rows[0].id;
  titleLibraryId=(await database.query<{id:string}>("INSERT INTO ticket_title_library(organization_id,title,normalized_title,status) VALUES($1,'خطای چاپ پرینتر','خطای چاپ پرینتر','ACTIVE') RETURNING id",[orgA])).rows[0].id;
  tagId=(await database.query<{id:string}>("INSERT INTO ticket_tags(organization_id,name,color,kind,status,normalized_name) VALUES($1,'پرینتر','#6d5587','SERVICE_ASSET','ACTIVE','پرینتر') RETURNING id",[orgA])).rows[0].id;
  await database.query("INSERT INTO ticket_custom_field_definitions(organization_id,field_key,label,field_type,options,is_required) VALUES($1,'device_type','Device type','SELECT','[\"printer\",\"scanner\"]',false),($1,'asset_number','Asset number','NUMBER','[]',false)",[orgA]);
  for(const org of [orgA,orgB]){const encrypted=credentials.encrypt(`key-${org}`);await database.query(`INSERT INTO organization_ai_settings(organization_id,enabled,smart_intake_enabled,model,analysis_model,transcription_model,provider_base_url,api_key_ciphertext,api_key_iv,api_key_auth_tag) VALUES($1,true,true,'analysis-test','analysis-test','transcription-test','https://ai.test/v1',$2,$3,$4) ON CONFLICT(organization_id) DO UPDATE SET enabled=true,smart_intake_enabled=true,analysis_model='analysis-test',transcription_model='transcription-test',api_key_ciphertext=$2,api_key_iv=$3,api_key_auth_tag=$4`,[org,encrypted.ciphertext,encrypted.iv,encrypted.authTag]);}
});

afterAll(async()=>{
  for(const table of ['ticket_intake_secondary_ticket_links','ticket_intake_provenance','ticket_attachments','ticket_custom_field_values','ticket_sla_clocks','ticket_activities','ticket_assignments','ticket_status_transitions','ticket_tag_links','tickets','ticket_intake_messages','ticket_intake_sessions','outbox_events','organization_ai_settings','audit_logs','ticket_title_library','ticket_tags','ticket_custom_field_definitions','subcategories','categories','departments','locations','disciplines','memberships']) await database.query(`DELETE FROM ${table} WHERE organization_id IN($1,$2)`,[orgA,orgB]);
  await database.query('DELETE FROM organizations WHERE id IN($1,$2)',[orgA,orgB]);await database.query("DELETE FROM users WHERE email IN('goal14-a@jupiter.local','goal14-b@jupiter.local')");await database.onModuleDestroy();
});

describe('ticket intake pipeline',()=>{
  it('keeps manual intake available when organization smart intake is disabled',async()=>{
    await database.withOrganization(orgA,client=>client.query('UPDATE organization_ai_settings SET smart_intake_enabled=false WHERE organization_id=$1',[orgA]));
    expect(await intakes.capabilities(actorA())).toEqual({smartIntakeEnabled:false});
    const session=await intakes.create(actorA(),{description:'درخواست دستی بدون تحلیل',idempotencyKey:'goal24-manual-001'});
    const voice=await intakes.requestMessageVoiceUpload(actorA(),session.id,{filename:'manual.wav',contentType:'audio/wav',byteSize:5,durationSeconds:2});
    storage.objects.set(storage.lastUpload!.key,{contentType:'audio/wav',contentLength:5,metadata:{'duration-seconds':'2'},bytes:new Uint8Array([1,2,3,4,5])});
    await intakes.completeMessageVoiceUpload(actorA(),session.id,voice.message.id);
    await expect(intakes.analyze(actorA(),session.id)).rejects.toMatchObject({message:'AI is not configured for this organization'});
    const draft=await intakes.createDraft(actorA(),{title:'درخواست دستی',description:'درخواست دستی بدون تحلیل',intakeSessionId:session.id});
    expect(draft.id).toBeTruthy();
    expect((await database.withOrganization(orgA,client=>client.query('SELECT count(*)::int AS count FROM ticket_attachments WHERE ticket_id=$1',[draft.id]))).rows[0].count).toBe(1);
    await database.withOrganization(orgA,client=>client.query('UPDATE organization_ai_settings SET smart_intake_enabled=true WHERE organization_id=$1',[orgA]));
    expect(await intakes.capabilities(actorA())).toEqual({smartIntakeEnabled:true});
  });

  it('is tenant/user scoped, idempotent and applies only valid high-confidence suggestions',async()=>{
    const first=await intakes.create(actorA(),{description:'Contact me at user@example.com about the printer.',idempotencyKey:'goal14-text-0001'});
    const repeated=await intakes.create(actorA(),{description:'different text',idempotencyKey:'goal14-text-0001'});expect(repeated.id).toBe(first.id);expect(repeated.description).toBe(first.description);
    await expect(intakes.get(actorB(),first.id)).rejects.toBeInstanceOf(NotFoundException);
    await expect(intakes.get({...actorA(),userId:userB},first.id)).rejects.toBeInstanceOf(NotFoundException);
    await intakes.analyze(actorA(),first.id);await intakes.analyze(actorA(),first.id);
    const queued=await database.withOrganization(orgA,c=>c.query<{count:number}>("SELECT count(*)::int AS count FROM outbox_events WHERE topic='ticket_intake.process' AND payload->>'sessionId'=$1",[first.id]));expect(queued.rows[0].count).toBe(1);
    let sentDescription='';await intakes.process(orgA,first.id,analysis({capture:value=>{sentDescription=value.description;}}),noVoice);
    const result=await intakes.get(actorA(),first.id);expect(result.lastErrorCode).toBeNull();expect(result.status).toBe('SUCCEEDED');expect(result.description).toContain('user@example.com');expect(sentDescription).toContain('[email redacted]');
    expect(result.suggestions).toMatchObject({title:'Printer is offline',categoryId:category,departmentId:department,locationId:location,priority:'HIGH',customFields:{device_type:'printer'}});
    expect(result.suggestions).not.toHaveProperty('subcategoryId');expect(result.suggestions).not.toHaveProperty('disciplineId');expect(result.missingFields).toEqual(expect.arrayContaining(['subcategoryId','disciplineId','customFields.asset_number']));
  });

  it('supplies only active title/tag vocabulary and records new tag candidates only on final draft submission',async()=>{
    const session=await intakes.create(actorA(),{description:'پرینتر اتاق جلسات خطای چاپ می‌دهد',idempotencyKey:'goal18-title-tag-001'}); await intakes.analyze(actorA(),session.id);
    let context:TicketIntakeContext|undefined;
    const provider:TicketIntakeProvider={analyzeIntake:async input=>{context=input.context;return {output:{contractVersion:TICKET_INTAKE_CONTRACT_VERSION,title:'خطای چاپ پرینتر',titleLibraryId,categoryId:category,subcategoryId:subcategory,departmentId:null,locationId:null,disciplineId:null,priority:'NORMAL',customFields:{},tags:[{tagId,name:'پرینتر',kind:'SERVICE_ASSET'},{tagId:null,name:'خطای چاپ',kind:'ISSUE_TYPE'}],missingFields:[],confidenceByField:{title:.96,titleLibraryId:.96,categoryId:.9,subcategoryId:.9,priority:.8,serviceAssetTag:.91,issueTypeTag:.91}},usage:{}};}};
    await intakes.process(orgA,session.id,provider,noVoice);
    expect(context?.titleLibrary).toEqual(expect.arrayContaining([{id:titleLibraryId,title:'خطای چاپ پرینتر'}])); expect(context?.tags).toEqual(expect.arrayContaining([{id:tagId,name:'پرینتر',kind:'SERVICE_ASSET'}]));
    const processed=await intakes.get(actorA(),session.id); expect(processed.suggestions).toMatchObject({title:'خطای چاپ پرینتر',titleLibraryId,tags:[{id:tagId,name:'پرینتر',kind:'SERVICE_ASSET'},{name:'خطای چاپ',kind:'ISSUE_TYPE'}]});
    expect((await database.withOrganization(orgA,c=>c.query("SELECT count(*)::int AS count FROM ticket_tags WHERE name='خطای چاپ'"))).rows[0].count).toBe(0);
    const draft=await intakes.createDraft(actorA(),{title:'خطای چاپ پرینتر',description:processed.description,intakeSessionId:session.id});
    const evidence=await database.withOrganization(orgA,async c=>({tags:(await c.query('SELECT name,kind,status FROM ticket_tags ORDER BY name')).rows,links:(await c.query('SELECT count(*)::int AS count FROM ticket_tag_links WHERE ticket_id=$1',[draft.id])).rows[0],title:(await c.query('SELECT usage_count FROM ticket_title_library WHERE id=$1',[titleLibraryId])).rows[0]}));
    expect(evidence.tags).toEqual(expect.arrayContaining([{name:'خطای چاپ',kind:'ISSUE_TYPE',status:'PENDING'}])); expect(evidence.links.count).toBe(2); expect(evidence.title.usage_count).toBe(1);
  });

  it('preserves the established primary issue as context for a later clarification',async()=>{
    const session=await intakes.create(actorA(),{idempotencyKey:'goal23-primary-anchor-001'});await intakes.addTextMessage(actorA(),session.id,{text:'پرینتر اتاق جلسات کار نمی‌کند.'});await intakes.analyzeConversation(actorA(),session.id);await intakes.process(orgA,session.id,analysis(),noVoice);
    await intakes.addTextMessage(actorA(),session.id,{text:'نرم‌افزار پرگار هم اجرا نمی‌شود؛ درباره همین موضوع جزئیات بیشتری دارم.'});await intakes.analyzeConversation(actorA(),session.id);
    let prior:TicketIntakeContext['previousPrimaryIssue'];await intakes.process(orgA,session.id,{analyzeIntake:async input=>{prior=input.context.previousPrimaryIssue;return analysis().analyzeIntake(input);}},noVoice);
    expect(prior).toMatchObject({summary:'Printer is offline'});
  });

  it('verifies voice metadata, transcribes before analysis, and atomically attaches provenance to the draft',async()=>{
    const session=await intakes.create(actorA(),{description:'Typed context',idempotencyKey:'goal14-voice-001'});
    await expect(intakes.requestVoiceUpload(actorA(),session.id,{filename:'voice.webm',contentType:'audio/webm',byteSize:5,durationSeconds:61})).rejects.toBeInstanceOf(BadRequestException);
    await expect(intakes.requestVoiceUpload(actorA(),session.id,{filename:'voice.exe',contentType:'application/octet-stream',byteSize:5,durationSeconds:2})).rejects.toBeInstanceOf(BadRequestException);
    await expect(intakes.requestVoiceUpload(actorA(),session.id,{filename:'voice.webm',contentType:'audio/webm',byteSize:10*1024*1024+1,durationSeconds:2})).rejects.toBeInstanceOf(BadRequestException);
    const requested=await intakes.requestVoiceUpload(actorA(),session.id,{filename:'voice.webm',contentType:'audio/webm',byteSize:5,durationSeconds:12.5});expect(requested.requiredHeaders['x-amz-meta-duration-seconds']).toBe('12.5');
    const badKey=storage.lastUpload!.key;storage.objects.set(badKey,{contentType:'audio/webm',contentLength:4,metadata:{'duration-seconds':'12.5'},bytes:new Uint8Array([1,2,3,4])});
    await expect(intakes.completeVoiceUpload(actorA(),session.id)).rejects.toBeInstanceOf(BadRequestException);
    await expect(intakes.analyze(actorA(),session.id)).rejects.toThrow('verified');
    await intakes.requestVoiceUpload(actorA(),session.id,{filename:'voice.webm',contentType:'audio/webm',byteSize:5,durationSeconds:12.5});
    const key=storage.lastUpload!.key;storage.objects.set(key,{contentType:'audio/webm',contentLength:5,metadata:{'duration-seconds':'12.5'},bytes:new Uint8Array([1,2,3,4,5])});
    await intakes.completeVoiceUpload(actorA(),session.id);await intakes.analyze(actorA(),session.id);
    const transcription:TranscriptionProvider={transcribe:async(input)=>{expect('audio' in input&&input.configuration.model).toBe('transcription-test');return {text:'The printer on floor two is offline.'};}};
    await intakes.process(orgA,session.id,analysis({disciplineConfidence:.9}),transcription);
    const processed=await intakes.get(actorA(),session.id);expect(processed.lastErrorCode).toBeNull();expect(processed.status).toBe('SUCCEEDED');expect(processed.transcript).toContain('floor two');expect(processed.combinedDescription).toContain('Typed context');expect(processed.combinedDescription).toContain('متن پیاده‌سازی‌شده صدا');
    storage.objects.set(key,{...storage.objects.get(key)!,contentLength:4});await expect(intakes.createDraft(actorA(),{title:String(processed.suggestions!.title),description:processed.combinedDescription!,intakeSessionId:session.id})).rejects.toThrow('metadata has changed');storage.objects.set(key,{contentType:'audio/webm',contentLength:5,metadata:{'duration-seconds':'12.5'},bytes:new Uint8Array([1,2,3,4,5])});
    const draft=await intakes.createDraft(actorA(),{title:String(processed.suggestions!.title),description:processed.combinedDescription!,priority:'HIGH',categoryId:category,departmentId:department,locationId:location,disciplineId:discipline,customFields:{device_type:'printer'},intakeSessionId:session.id});
    const evidence=await database.withOrganization(orgA,async client=>({attachment:(await client.query("SELECT storage_key,state FROM ticket_attachments WHERE ticket_id=$1",[draft.id])).rows[0],provenance:(await client.query("SELECT analysis_contract_version FROM ticket_intake_provenance WHERE ticket_id=$1",[draft.id])).rows[0],session:(await client.query("SELECT status,ticket_id FROM ticket_intake_sessions WHERE id=$1",[session.id])).rows[0]}));
    expect(evidence.attachment).toMatchObject({storage_key:key,state:'AVAILABLE'});expect(evidence.provenance.analysis_contract_version).toBe(TICKET_INTAKE_CONTRACT_VERSION);expect(evidence.session).toMatchObject({status:'CONSUMED',ticket_id:draft.id});
  });

  it('keeps multimodal raw messages separate from the AI interpretation and makes clarification optional',async()=>{
    const session=await intakes.create(actorA(),{idempotencyKey:'goal20-conversation-001'});
    await intakes.addTextMessage(actorA(),session.id,{text:'می‌خواهم یک سند را اسکن کنم؛ ابتدا اشتباه گفتم پرینت.'});
    const requested=await intakes.requestMessageVoiceUpload(actorA(),session.id,{filename:'detail.wav',contentType:'audio/wav',byteSize:5,durationSeconds:3});
    storage.objects.set(storage.lastUpload!.key,{contentType:'audio/wav',contentLength:5,metadata:{'duration-seconds':'3'},bytes:new Uint8Array([1,2,3,4,5])});
    await intakes.completeMessageVoiceUpload(actorA(),session.id,requested.message.id);
    const secondVoice=await intakes.requestMessageVoiceUpload(actorA(),session.id,{filename:'detail-2.wav',contentType:'audio/wav',byteSize:5,durationSeconds:2});
    storage.objects.set(storage.lastUpload!.key,{contentType:'audio/wav',contentLength:5,metadata:{'duration-seconds':'2'},bytes:new Uint8Array([5,4,3,2,1])});
    await intakes.completeMessageVoiceUpload(actorA(),session.id,secondVoice.message.id);
    await intakes.analyzeConversation(actorA(),session.id);
    const provider:TicketIntakeProvider={analyzeIntake:async()=>({output:{contractVersion:TICKET_INTAKE_CONTRACT_VERSION,title:'اختلال در اسکن سند',titleLibraryId:null,categoryId:category,subcategoryId:subcategory,departmentId:null,locationId:null,disciplineId:null,priority:'NORMAL',customFields:{},tags:[],missingFields:[],confidenceByField:{title:.95,categoryId:.9,subcategoryId:.9,priority:.9},interpretation:'درخواست اصلی مربوط به اسکن سند است؛ خرابی پرینتر مورد ثانویه است.',primaryIssue:{summary:'عدم امکان اسکن سند',serviceAsset:'اسکنر',issueType:'خرابی',confidence:.94},secondaryIssues:[{summary:'خرابی احتمالی پرینتر',confidence:.62}],clarificationQuestion:'آیا خرابی پرینتر نیز درخواست جداگانه‌ای است؟',clarificationConfidence:.62},usage:{}})};
    let transcriptCall=0;const transcription:TranscriptionProvider={transcribe:async()=>({text:++transcriptCall===1?'پرینتر هم کار نمی‌کند.':'مشکل اصلی اسکن سند است.'})};
    await intakes.process(orgA,session.id,provider,transcription);
    const result=await intakes.get(actorA(),session.id) as unknown as {status:string;description:string;messages:Array<{role:string;transcript:string|null}>;interpretation:string;primaryIssue:{summary:string};secondaryIssues:Array<{summary:string}>;clarificationQuestion:string};
    expect(result.status).toBe('SUCCEEDED');expect(result.description).toContain('اسکن');expect(result.description).toContain('پرینتر هم کار نمی‌کند');
    expect(result.messages).toEqual(expect.arrayContaining([expect.objectContaining({role:'USER',transcript:'پرینتر هم کار نمی‌کند.'}),expect.objectContaining({role:'ASSISTANT'})]));
    expect(result.interpretation).toContain('اسکن');expect(result.primaryIssue.summary).toContain('اسکن');expect(result.secondaryIssues[0].summary).toContain('پرینتر');expect(result.clarificationQuestion).toContain('درخواست جداگانه');
    const draft=await intakes.createDraft(actorA(),{title:'اختلال در اسکن سند',description:result.description,intakeSessionId:session.id});
    const attachments=(await database.withOrganization(orgA,client=>client.query('SELECT count(*)::int AS count FROM ticket_attachments WHERE ticket_id=$1',[draft.id]))).rows[0] as {count:number};expect(attachments.count).toBe(2);
  });

  it('allows a structurally valid low-confidence secondary proposal only after explicit batch confirmation',async()=>{
    const session=await intakes.create(actorA(),{description:'اتصال اینترنت کند است و پرینتر هم کار نمی‌کند.',idempotencyKey:'goal22-low-confidence-001'});
    await intakes.addTextMessage(actorA(),session.id,{text:'مشکل پرینتر را هم جداگانه ثبت کنید.'});await intakes.analyzeConversation(actorA(),session.id);
    const provider:TicketIntakeProvider={analyzeIntake:async()=>({output:{contractVersion:TICKET_INTAKE_CONTRACT_VERSION,title:'کندی اتصال اینترنت',titleLibraryId:null,categoryId:category,subcategoryId:subcategory,departmentId:null,locationId:null,disciplineId:null,priority:'NORMAL',customFields:{},tags:[],missingFields:[],confidenceByField:{title:.95,categoryId:.95,subcategoryId:.95,priority:.95},interpretation:'کندی اینترنت موضوع اصلی و اختلال پرینتر موضوع ثانویه است.',primaryIssue:{summary:'کندی اتصال اینترنت',serviceAsset:'شبکه',issueType:'کندی',confidence:.95},secondaryIssues:[{summary:'اختلال در عملکرد پرینتر',title:'اختلال در عملکرد پرینتر',description:'پرینتر کاربر کار نمی‌کند و نیاز به بررسی دارد.',categoryId:category,subcategoryId:subcategory,departmentId:null,locationId:null,disciplineId:null,priority:'NORMAL',customFields:{},tags:[],confidenceByField:{title:.62,categoryId:.62,subcategoryId:.62,priority:.62},confidence:.62}],clarificationQuestion:null,clarificationConfidence:null},usage:{}})};
    await intakes.process(orgA,session.id,provider,noVoice);
    const processed=await intakes.get(actorA(),session.id) as unknown as {secondaryIssues:Array<{id:string;selectable:boolean;requiresReview:boolean;ticket:{title:string}}>};
    expect(processed.secondaryIssues[0]).toMatchObject({selectable:true,requiresReview:true,ticket:{title:'اختلال در عملکرد پرینتر'}});
    const batch=await intakes.createBatch(actorA(),{title:'کندی اتصال اینترنت',description:'اتصال اینترنت کند است.',priority:'NORMAL',intakeSessionId:session.id,secondaryProposalIds:[processed.secondaryIssues[0].id]});
    expect(batch.secondary).toHaveLength(1);expect(batch.secondary[0].title).toBe('اختلال در عملکرد پرینتر');
    const links=await database.withOrganization(orgA,client=>client.query('SELECT primary_ticket_id,secondary_ticket_id FROM ticket_intake_secondary_ticket_links WHERE intake_session_id=$1',[session.id]));expect(links.rows).toHaveLength(1);
  });

  it('retries provider failures, preserves manual input, and expires orphaned voice objects',async()=>{
    const failed=await intakes.create(actorA(),{description:'Manual fallback remains available.',idempotencyKey:'goal14-fail-0001'});await intakes.analyze(actorA(),failed.id);
    const unavailable:TicketIntakeProvider={analyzeIntake:async()=>{throw new Error('provider unavailable');}};
    for(let attempt=1;attempt<=3;attempt++){await database.withOrganization(orgA,c=>c.query('UPDATE ticket_intake_sessions SET next_attempt_at=now(),processing_started_at=NULL WHERE id=$1',[failed.id]));await intakes.process(orgA,failed.id,unavailable,noVoice);}
    const result=await intakes.get(actorA(),failed.id);expect(result.status).toBe('FAILED');expect(result.description).toBe('Manual fallback remains available.');expect(result.attemptCount).toBe(3);
    const manual=await intakes.createDraft(actorA(),{title:'Manual fallback ticket',description:result.description,intakeSessionId:failed.id});expect(manual.id).toBeTruthy();expect((await intakes.get(actorA(),failed.id)).status).toBe('CONSUMED');
    const expiring=await intakes.create(actorA(),{description:'',idempotencyKey:'goal14-expire-01'});await intakes.requestVoiceUpload(actorA(),expiring.id,{filename:'orphan.ogg',contentType:'audio/ogg',byteSize:3,durationSeconds:2});const key=storage.lastUpload!.key;storage.objects.set(key,{contentType:'audio/ogg',contentLength:3,metadata:{'duration-seconds':'2'},bytes:new Uint8Array([1,2,3])});await intakes.completeVoiceUpload(actorA(),expiring.id);
    await database.query("UPDATE ticket_intake_sessions SET expires_at=now()-interval '1 minute' WHERE id=$1",[expiring.id]);expect(await intakes.cleanupExpired()).toBeGreaterThanOrEqual(1);expect(storage.deleted).toContain(key);expect((await intakes.get(actorA(),expiring.id)).status).toBe('EXPIRED');
  });
});
