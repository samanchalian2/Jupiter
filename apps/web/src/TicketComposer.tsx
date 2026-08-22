import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { ChevronDown, FilePlus2, Mic, Pause, RotateCcw, Send, Sparkles, Trash2 } from 'lucide-react';
import type { Actor } from './App';
import { request } from './App';
import { applyIntakeSuggestions, blocksManualSubmit, intakeFailureMessage, intakeFieldLabel, microphoneErrorMessage, pollIntake, processingStatuses, type IntakeSession, type TicketFormState, type TicketTag } from './ticketIntake';
import { Button, Card } from './ui';
import { beginVoiceRecording, prepareVoiceCapture, type VoiceRecordingHandle } from './voiceRecording';

type Catalog = { id: string; name: string; category_id?: string };
type CustomField = { field_key:string; label:string; field_type:'TEXT'|'NUMBER'|'DATE'|'SELECT'|'BOOLEAN'; options:unknown[]; is_required:boolean };
type Recording = { id:string; blob:Blob; url:string; durationSeconds:number; contentType:string; filename:string };
type PipelinePhase = ''|'UPLOADING'|'TRANSCRIBING'|'ANALYZING'|'SUCCEEDED'|'FAILED';

const initialForm:TicketFormState={title:'',description:'',priority:'NORMAL',departmentId:'',categoryId:'',subcategoryId:'',locationId:'',disciplineId:'',customFields:{},tags:[]};
const phaseLabels:Record<Exclude<PipelinePhase,''>,string>={UPLOADING:'در حال بارگذاری امن صدا…',TRANSCRIBING:'در حال تبدیل صدا به متن…',ANALYZING:'در حال تکمیل فیلدها با AI…',SUCCEEDED:'پیشنهادهای معتبر اعمال شدند و قابل ویرایش‌اند.',FAILED:'تکمیل هوشمند انجام نشد؛ فرم دستی در دسترس است.'};

function formatDuration(seconds:number) { const safe=Math.min(60,Math.max(0,Math.floor(seconds))); return `${String(Math.floor(safe/60)).padStart(2,'0')}:${String(safe%60).padStart(2,'0')}`; }
function extension(contentType:string) { return contentType==='audio/wav'?'wav':contentType==='audio/ogg'?'ogg':contentType==='audio/mp4'?'mp4':'webm'; }
function idempotencyKey() { return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`; }

export function TicketComposer({ actor, onCreated }: { actor:Actor; onCreated:(ticketId:string,notice?:string)=>void }) {
  const [catalogs,setCatalogs]=useState<{departments:Catalog[];categories:Catalog[];subcategories:Catalog[];locations:Catalog[];disciplines:Catalog[]}>({departments:[],categories:[],subcategories:[],locations:[],disciplines:[]});
  const [customFields,setCustomFields]=useState<CustomField[]>([]);
  const [tagVocabulary,setTagVocabulary]=useState<TicketTag[]>([]);
  const [form,setForm]=useState<TicketFormState>(initialForm);
  const [file,setFile]=useState<File|null>(null);
  const [detailsOpen,setDetailsOpen]=useState(false);
  const [submitBusy,setSubmitBusy]=useState(false);
  const [pipeline,setPipeline]=useState<PipelinePhase>('');
  const [error,setError]=useState('');
  const [guidance,setGuidance]=useState<string[]>([]);
  const [aiFields,setAiFields]=useState<Set<string>>(new Set());
  const [intake,setIntake]=useState<IntakeSession|null>(null);
  const [recording,setRecording]=useState<Recording|null>(null);
  const [recordingActive,setRecordingActive]=useState(false);
  const [micRequesting,setMicRequesting]=useState(false);
  const [recordingSeconds,setRecordingSeconds]=useState(0);
  const descriptionRef=useRef<HTMLTextAreaElement>(null);
  const recorderRef=useRef<VoiceRecordingHandle|null>(null);
  const pollAbortRef=useRef<AbortController|null>(null);

  useEffect(()=>{descriptionRef.current?.focus();},[]);
  useEffect(()=>{Promise.all([
    request('/tickets/catalog/departments',actor.session,actor.organizationId),
    request('/tickets/catalog/categories',actor.session,actor.organizationId),
    request('/tickets/catalog/subcategories',actor.session,actor.organizationId),
    request('/tickets/catalog/locations',actor.session,actor.organizationId),
    request('/tickets/catalog/disciplines',actor.session,actor.organizationId),
    request('/tickets/custom-fields',actor.session,actor.organizationId),request('/tickets/tags',actor.session,actor.organizationId),
  ]).then(([departments,categories,subcategories,locations,disciplines,fields,tags])=>{
    setCatalogs({departments:departments as Catalog[],categories:categories as Catalog[],subcategories:subcategories as Catalog[],locations:locations as Catalog[],disciplines:disciplines as Catalog[]});
    setCustomFields(fields as CustomField[]);setTagVocabulary((tags as Array<TicketTag&{status?:string}>).filter(tag=>tag.status===undefined||tag.status==='ACTIVE'));
  }).catch(()=>setError('دریافت فهرست‌های سازمان کامل نشد؛ صفحه را دوباره بارگذاری کنید.'));},[actor.organizationId,actor.session.accessToken]);
  useEffect(()=>()=>{
    pollAbortRef.current?.abort();recorderRef.current?.destroy();
  },[]);
  useEffect(()=>()=>{if(recording?.url)URL.revokeObjectURL(recording.url);},[recording?.url]);

  const markManual=(field:string)=>setAiFields(current=>{if(!current.has(field))return current;const next=new Set(current);next.delete(field);return next;});
  const updateField=<K extends keyof TicketFormState>(field:K,value:TicketFormState[K])=>{setForm(current=>({...current,[field]:value}));markManual(String(field));};
  const aiBadge=(field:string)=>aiFields.has(field)?<span className="ai-field-badge"><Sparkles size={12}/>تکمیل‌شده با AI</span>:null;
  const filteredSubcategories=catalogs.subcategories.filter(item=>!form.categoryId||item.category_id===form.categoryId);
  const toggleTag=(tag:TicketTag)=>{setForm(current=>{const exists=current.tags.some(item=>(tag.id&&item.id===tag.id)||(!tag.id&&item.name===tag.name&&item.kind===tag.kind));return {...current,tags:exists?current.tags.filter(item=>!((tag.id&&item.id===tag.id)||(!tag.id&&item.name===tag.name&&item.kind===tag.kind))):[...current.tags,tag].slice(0,5)};});markManual('tags');};

  const upload=async(ticketId:string,attachment:File)=>{
    const response=await request(`/tickets/${ticketId}/attachments/upload-requests`,actor.session,actor.organizationId,{method:'POST',body:JSON.stringify({filename:attachment.name,contentType:attachment.type,byteSize:attachment.size})}) as {attachment:{id:string};uploadUrl:string};
    const put=await fetch(response.uploadUrl,{method:'PUT',headers:{'content-type':attachment.type},body:attachment});
    if(!put.ok)throw new Error('بارگذاری فایل ناموفق بود.');
    await request(`/tickets/${ticketId}/attachments/${response.attachment.id}/complete`,actor.session,actor.organizationId,{method:'POST'});
  };
  const discardRemoteVoice=async()=>{if(!intake?.voice)return;try{await request(`/ticket-intakes/${intake.id}/voice/discard`,actor.session,actor.organizationId,{method:'POST'});}catch{/* worker cleanup */}setIntake(null);};
  const removeRecording=async()=>{if(recordingActive)recorderRef.current?.stop();await discardRemoteVoice();setRecording(null);setRecordingSeconds(0);setPipeline('');setGuidance([]);markManual('description');};
  const stopRecording=()=>recorderRef.current?.stop();
  const compatibleRecording=async(value:Recording)=>{
    if(value.contentType==='audio/wav')return value;
    const capture=await prepareVoiceCapture(value.blob,value.durationSeconds);
    const next:Recording={...value,blob:capture.blob,url:URL.createObjectURL(capture.blob),durationSeconds:capture.durationSeconds,contentType:capture.contentType,filename:`voice-${Date.now()}.${extension(capture.contentType)}`};
    URL.revokeObjectURL(value.url);setRecording(next);setRecordingSeconds(capture.durationSeconds);return next;
  };
  const startRecording=async()=>{
    setError('');
    if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined'){setError('مرورگر شما از ضبط صدا پشتیبانی نمی‌کند؛ شرح درخواست را دستی بنویسید.');return;}
    if(recording)await removeRecording();
    try{
      setMicRequesting(true);setPipeline('');setGuidance([]);
      recorderRef.current=await beginVoiceRecording({onTick:setRecordingSeconds,onError:()=>{setRecordingActive(false);setError('آماده‌سازی صدای ضبط‌شده کامل نشد؛ دوباره تلاش کنید یا شرح درخواست را دستی بنویسید.');},onReady:({blob,durationSeconds,contentType})=>{
        setRecordingActive(false);if(blob.size>10*1024*1024){setError('حجم صدای ضبط‌شده بیشتر از ۱۰ مگابایت است؛ دوباره کوتاه‌تر ضبط کنید.');return;}
        setRecording({id:idempotencyKey(),blob,url:URL.createObjectURL(blob),durationSeconds,contentType,filename:`voice-${Date.now()}.${extension(contentType)}`});setRecordingSeconds(durationSeconds);
      }});
      setMicRequesting(false);setRecordingActive(true);
    }catch(cause){
      setMicRequesting(false);setRecordingActive(false);setError(microphoneErrorMessage(cause));
    }
  };

  const createSession=async(description:string)=>request('/ticket-intakes',actor.session,actor.organizationId,{method:'POST',headers:{'idempotency-key':idempotencyKey()},body:JSON.stringify({description})}) as Promise<IntakeSession>;
  const uploadVoice=async(session:IntakeSession,voice:Recording)=>{
    setPipeline('UPLOADING');
    const prepared=await request(`/ticket-intakes/${session.id}/voice/upload-request`,actor.session,actor.organizationId,{method:'POST',body:JSON.stringify({filename:voice.filename,contentType:voice.contentType,byteSize:voice.blob.size,durationSeconds:voice.durationSeconds})}) as {session:IntakeSession;uploadUrl:string;requiredHeaders:Record<string,string>};
    const put=await fetch(prepared.uploadUrl,{method:'PUT',headers:prepared.requiredHeaders,body:voice.blob});if(!put.ok)throw new Error('بارگذاری صدای ضبط‌شده ناموفق بود.');
    const completed=await request(`/ticket-intakes/${session.id}/voice/complete`,actor.session,actor.organizationId,{method:'POST'}) as IntakeSession;setIntake(completed);return completed;
  };
  const ensureVoiceSession=async()=>{const voice=recording?await compatibleRecording(recording):null;if(intake?.voice&&voice&&intake.voice.contentType===voice.contentType)return intake;if(intake?.voice)await discardRemoteVoice();const created=await createSession(form.description);setIntake(created);return voice?uploadVoice(created,voice):created;};

  const runAi=async()=>{
    if(!form.description.trim()&&!recording){setError('ابتدا شرح درخواست را بنویسید یا صدای خود را ضبط کنید.');descriptionRef.current?.focus();return;}
    setError('');setGuidance([]);pollAbortRef.current?.abort();const controller=new AbortController();pollAbortRef.current=controller;
    try{
      let session=intake;let voice=recording?await compatibleRecording(recording):null;
      // HMR can retain a pre-upgrade WebM capture in component state. Replace
      // its old remote object instead of retrying an incompatible session.
      const needsReplacement=Boolean(session?.voice&&voice&&session.voice.contentType!==voice.contentType);
      if(needsReplacement){await discardRemoteVoice();session=null;}
      const canRetry=session?.status==='FAILED'&&session.description===form.description&&Boolean(session.voice)===Boolean(voice);
      if(!canRetry){if(session?.voice)await discardRemoteVoice();session=await createSession(form.description);setIntake(session);if(voice)session=await uploadVoice(session,voice);}
      const queued=await request(`/ticket-intakes/${session!.id}/analyze`,actor.session,actor.organizationId,{method:'POST'}) as IntakeSession;setIntake(queued);setPipeline(queued.status==='TRANSCRIBING'?'TRANSCRIBING':'ANALYZING');
      const completed=await pollIntake(()=>request(`/ticket-intakes/${session!.id}`,actor.session,actor.organizationId) as Promise<IntakeSession>,{signal:controller.signal,onUpdate:value=>{setIntake(value);if(value.status==='TRANSCRIBING'||value.status==='ANALYZING')setPipeline(value.status);}});setIntake(completed);
      if(completed.status==='SUCCEEDED'){
        const applied=applyIntakeSuggestions(form,completed);setForm(applied.form);setAiFields(applied.changedFields);setPipeline('SUCCEEDED');
        const labels=completed.rejectedFields.map(field=>intakeFieldLabel(field,Object.fromEntries(customFields.map(item=>[item.field_key,item.label]))));setGuidance([...new Set(labels)]);
        if([...applied.changedFields].some(field=>!['title','description','categoryId'].includes(field)))setDetailsOpen(true);
      }else{setPipeline('FAILED');setError(intakeFailureMessage(completed.lastErrorCode));}
    }catch(cause){
      if(cause instanceof DOMException&&cause.name==='AbortError')return;
      const message=cause instanceof Error?cause.message:'';setPipeline('FAILED');
      setError(message==='intake_poll_timeout'?'پاسخ هوش مصنوعی دیر رسید؛ فرم حفظ شده است و می‌توانید دستی ادامه دهید.':/not configured|configuration unavailable/i.test(message)?intakeFailureMessage('ai_configuration_unavailable'):message||intakeFailureMessage(null));
    }
  };

  const submit=async(event:FormEvent)=>{
    event.preventDefault();if(recordingActive){setError('ابتدا ضبط صدا را متوقف کنید.');return;}setSubmitBusy(true);setError('');
    try{
      let finalIntake=intake;if(recording&&!finalIntake?.voice)finalIntake=await ensureVoiceSession();const usableIntake=finalIntake&&!processingStatuses.has(finalIntake.status)?finalIntake.id:undefined;
      if(recording&&!usableIntake)throw new Error('پردازش صدا هنوز تمام نشده است؛ چند لحظه صبر کنید یا صدا را حذف کنید.');
      const draft=await request('/tickets/drafts',actor.session,actor.organizationId,{method:'POST',body:JSON.stringify({...form,departmentId:form.departmentId||undefined,categoryId:form.categoryId||undefined,subcategoryId:form.subcategoryId||undefined,locationId:form.locationId||undefined,disciplineId:form.disciplineId||undefined,intakeSessionId:usableIntake})}) as {id:string};
      await request(`/tickets/${draft.id}/submit`,actor.session,actor.organizationId,{method:'POST'});let notice='درخواست شما با موفقیت ثبت شد.';
      if(file){try{await upload(draft.id,file);}catch{notice='درخواست ثبت شد، اما پیوست بارگذاری نشد؛ می‌توانید آن را در جزئیات تیکت دوباره اضافه کنید.';}}onCreated(draft.id,notice);
    }catch(cause){setError(cause instanceof Error?cause.message:'ثبت درخواست ناموفق بود.');}finally{setSubmitBusy(false);}
  };

  const customInput=(field:CustomField)=>{
    const key=`customFields.${field.field_key}`;const value=form.customFields[field.field_key];const change=(next:unknown)=>{setForm(current=>({...current,customFields:{...current.customFields,[field.field_key]:next}}));markManual(key);};
    const heading=<span className="field-label-row"><span>{field.label}</span>{aiBadge(key)}</span>;
    if(field.field_type==='BOOLEAN')return <label key={field.field_key} className="checkbox-label"><input type="checkbox" checked={Boolean(value)} onChange={e=>change(e.target.checked)}/>{field.label}{aiBadge(key)}</label>;
    if(field.field_type==='SELECT')return <label key={field.field_key}>{heading}<select value={String(value??'')} onChange={e=>change(e.target.value)} required={field.is_required}><option value="">انتخاب کنید</option>{field.options.map(option=><option key={String(option)} value={String(option)}>{String(option)}</option>)}</select></label>;
    return <label key={field.field_key}>{heading}<input type={field.field_type==='NUMBER'?'number':field.field_type==='DATE'?'date':'text'} value={String(value??'')} onChange={e=>change(field.field_type==='NUMBER'&&e.target.value!==''?Number(e.target.value):e.target.value)} required={field.is_required}/></label>;
  };

  const pipelineBusy=pipeline==='UPLOADING'||pipeline==='TRANSCRIBING'||pipeline==='ANALYZING';
  return <Card className="quick-ticket-card smart-ticket-composer"><div className="quick-ticket-heading"><div><p className="eyebrow">درخواست جدید</p><h2>درخواستتان را با زبان خودتان توضیح دهید</h2><p>ژوپیتر می‌تواند از روی متن یا صدای شما سایر فیلدها را پیشنهاد کند.</p></div><Sparkles aria-hidden="true"/></div>
    <form className="quick-ticket-form" onSubmit={submit}>
      <label className="ticket-description-field"><span className="field-label-row"><span>شرح درخواست</span>{aiBadge('description')}</span><textarea ref={descriptionRef} maxLength={10000} value={form.description} onChange={event=>updateField('description',event.target.value)} placeholder="مشکل، زمان شروع و نتیجه‌ای که انتظار دارید را توضیح دهید…" required/></label>
      <section className="smart-intake-toolbar" aria-label="ابزارهای هوشمند شرح درخواست"><div className="smart-intake-actions"><Button type="button" onClick={()=>void runAi()} disabled={pipelineBusy||recordingActive||micRequesting}><Sparkles size={17}/>تکمیل هوشمند</Button><Button type="button" variant="secondary" onClick={()=>void startRecording()} disabled={pipelineBusy||recordingActive||micRequesting}><Mic size={17}/>{recording?'ضبط مجدد':'ضبط صدا'}</Button></div>
        {micRequesting&&<p className="intake-status" role="status" aria-live="polite"><span className="status-spinner"/>در انتظار اجازه دسترسی به میکروفن…</p>}
        {recordingActive&&<div className="voice-recorder recording" role="status"><span className="recording-dot"/><strong>{formatDuration(recordingSeconds)} / 01:00</strong><Button type="button" variant="secondary" onClick={stopRecording}><Pause size={16}/>توقف ضبط</Button></div>}
        {recording&&!recordingActive&&<div className="voice-recorder ready"><audio src={recording.url} controls preload="metadata" aria-label="پخش صدای ضبط‌شده"/><span>{formatDuration(recording.durationSeconds)} · {Math.ceil(recording.blob.size/1024).toLocaleString('fa-IR')} کیلوبایت</span><Button type="button" variant="ghost" onClick={()=>void removeRecording()}><Trash2 size={16}/>حذف</Button><Button type="button" variant="secondary" onClick={()=>void startRecording()}><RotateCcw size={16}/>ضبط مجدد</Button></div>}
        {pipeline&&<p className={`intake-status ${pipeline.toLowerCase()}`} role="status" aria-live="polite">{pipeline==='SUCCEEDED'?<Sparkles size={16}/>:pipeline==='FAILED'?null:<span className="status-spinner"/>}{phaseLabels[pipeline]}</p>}
      </section>
      <label><span className="field-label-row"><span>عنوان درخواست</span>{aiBadge('title')}</span><input minLength={3} maxLength={200} value={form.title} onChange={event=>updateField('title',event.target.value)} placeholder="مثلاً دسترسی به سامانه مالی" required/></label>
      <label><span className="field-label-row"><span>دسته‌بندی</span>{aiBadge('categoryId')}</span><select value={form.categoryId} onChange={event=>{updateField('categoryId',event.target.value);updateField('subcategoryId','');}}><option value="">انتخاب نشده</option>{catalogs.categories.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      {guidance.length>0&&<p className="ai-guidance" role="status">برای اطمینان بیشتر، این موارد را دستی بررسی کنید: {guidance.join('، ')}.</p>}
      <button className="ticket-details-toggle" type="button" aria-expanded={detailsOpen} onClick={()=>setDetailsOpen(!detailsOpen)}><ChevronDown size={17} className={detailsOpen?'rotated':''}/> جزئیات بیشتر</button>
      {detailsOpen&&<div className="quick-ticket-more">
        <label><span className="field-label-row"><span>اولویت</span>{aiBadge('priority')}</span><select value={form.priority} onChange={event=>updateField('priority',event.target.value as TicketFormState['priority'])}><option value="LOW">کم</option><option value="NORMAL">عادی</option><option value="HIGH">بالا</option><option value="URGENT">فوری</option></select></label>
        <label><span className="field-label-row"><span>زیر‌دسته</span>{aiBadge('subcategoryId')}</span><select value={form.subcategoryId} onChange={event=>updateField('subcategoryId',event.target.value)} disabled={!form.categoryId}><option value="">انتخاب نشده</option>{filteredSubcategories.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label><span className="field-label-row"><span>واحد مرتبط</span>{aiBadge('departmentId')}</span><select value={form.departmentId} onChange={event=>updateField('departmentId',event.target.value)}><option value="">انتخاب نشده</option>{catalogs.departments.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label><span className="field-label-row"><span>مکان</span>{aiBadge('locationId')}</span><select value={form.locationId} onChange={event=>updateField('locationId',event.target.value)}><option value="">انتخاب نشده</option>{catalogs.locations.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label><span className="field-label-row"><span>حوزه یا رشته</span>{aiBadge('disciplineId')}</span><select value={form.disciplineId} onChange={event=>updateField('disciplineId',event.target.value)}><option value="">انتخاب نشده</option>{catalogs.disciplines.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <fieldset className="ticket-tag-field"><legend><span className="field-label-row"><span>هشتگ‌ها</span>{aiBadge('tags')}</span></legend><p className="hint">حداکثر ۵ هشتگ؛ معمولاً حوزه خدمت، تجهیز/خدمت و نوع مسئله.</p><div className="tag-picker">{tagVocabulary.map(tag=><button key={tag.id??`${tag.kind}-${tag.name}`} type="button" className={form.tags.some(item=>item.id===tag.id)?'selected':''} onClick={()=>toggleTag(tag)}>#{tag.name}</button>)}</div>{form.tags.length>0&&<div className="tag-list">{form.tags.map(tag=><button type="button" key={tag.id??`${tag.kind}-${tag.name}`} onClick={()=>toggleTag(tag)}>#{tag.name} ×</button>)}</div>}</fieldset>
        {customFields.map(customInput)}<label className="controlled-file"><FilePlus2 size={17}/><span>{file?`${file.name} · ${Math.ceil(file.size/1024)} KB`:'افزودن پیوست'}</span><input type="file" onChange={(event:ChangeEvent<HTMLInputElement>)=>setFile(event.target.files?.[0]??null)}/></label>
      </div>}
      {error&&<p className="error composer-error" role="alert">{error}{pipeline==='FAILED'&&<button type="button" onClick={()=>void runAi()}>تلاش دوباره</button>}</p>}
      <div className="quick-ticket-actions"><Button type="submit" loading={submitBusy} disabled={blocksManualSubmit(pipelineBusy,Boolean(recording),recordingActive)}><Send size={17}/>ثبت درخواست</Button><span>{pipelineBusy&&!recording?'می‌توانید بدون انتظار برای AI، عنوان را دستی وارد و درخواست را ثبت کنید.':'AI هرگز درخواست را خودکار ثبت نمی‌کند؛ پیش از ارسال همه فیلدها قابل ویرایش‌اند.'}</span></div>
    </form>
  </Card>;
}
