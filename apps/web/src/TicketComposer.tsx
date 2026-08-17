import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { ChevronDown, FilePlus2, Send } from 'lucide-react';
import type { Actor } from './App';
import { request } from './App';
import { Button, Card } from './ui';

type Catalog = { id: string; name: string };
type CustomField = { field_key:string; label:string; field_type:'TEXT'|'NUMBER'|'DATE'|'SELECT'|'BOOLEAN'; options:unknown[]; is_required:boolean };

export function TicketComposer({ actor, onCreated }: { actor:Actor; onCreated:(ticketId:string,notice?:string)=>void }) {
  const [catalogs,setCatalogs]=useState<{departments:Catalog[];categories:Catalog[];locations:Catalog[]}>({departments:[],categories:[],locations:[]});
  const [customFields,setCustomFields]=useState<CustomField[]>([]);
  const [form,setForm]=useState({title:'',description:'',priority:'NORMAL',departmentId:'',categoryId:'',locationId:'',customFields:{} as Record<string,unknown>});
  const [file,setFile]=useState<File|null>(null);
  const [detailsOpen,setDetailsOpen]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');

  useEffect(()=>{Promise.all([
    request('/tickets/catalog/departments',actor.session,actor.organizationId),
    request('/tickets/catalog/categories',actor.session,actor.organizationId),
    request('/tickets/catalog/locations',actor.session,actor.organizationId),
    request('/tickets/custom-fields',actor.session,actor.organizationId),
  ]).then(([departments,categories,locations,fields])=>{
    setCatalogs({departments:departments as Catalog[],categories:categories as Catalog[],locations:locations as Catalog[]});
    setCustomFields(fields as CustomField[]);
  }).catch(()=>undefined);},[actor.organizationId,actor.session.accessToken]);

  const upload=async(ticketId:string,attachment:File)=>{
    const response=await request(`/tickets/${ticketId}/attachments/upload-requests`,actor.session,actor.organizationId,{method:'POST',body:JSON.stringify({filename:attachment.name,contentType:attachment.type,byteSize:attachment.size})}) as {attachment:{id:string};uploadUrl:string};
    const put=await fetch(response.uploadUrl,{method:'PUT',headers:{'content-type':attachment.type},body:attachment});
    if(!put.ok)throw new Error('بارگذاری فایل ناموفق بود.');
    await request(`/tickets/${ticketId}/attachments/${response.attachment.id}/complete`,actor.session,actor.organizationId,{method:'POST'});
  };

  const submit=async(event:FormEvent)=>{
    event.preventDefault();setBusy(true);setError('');
    try{
      const draft=await request('/tickets/drafts',actor.session,actor.organizationId,{method:'POST',body:JSON.stringify({...form,departmentId:form.departmentId||undefined,categoryId:form.categoryId||undefined,locationId:form.locationId||undefined})}) as {id:string};
      await request(`/tickets/${draft.id}/submit`,actor.session,actor.organizationId,{method:'POST'});
      let notice='درخواست شما با موفقیت ثبت شد.';
      if(file){try{await upload(draft.id,file);}catch{notice='درخواست ثبت شد، اما پیوست بارگذاری نشد؛ می‌توانید آن را در جزئیات تیکت دوباره اضافه کنید.';}}
      onCreated(draft.id,notice);
    }catch(cause){setError(cause instanceof Error?cause.message:'ثبت درخواست ناموفق بود.');}
    finally{setBusy(false);}
  };

  const customInput=(field:CustomField)=>{const value=form.customFields[field.field_key];const change=(next:unknown)=>setForm({...form,customFields:{...form.customFields,[field.field_key]:next}});if(field.field_type==='BOOLEAN')return <label key={field.field_key} className="checkbox-label"><input type="checkbox" checked={Boolean(value)} onChange={e=>change(e.target.checked)}/>{field.label}</label>;if(field.field_type==='SELECT')return <label key={field.field_key}>{field.label}<select value={String(value??'')} onChange={e=>change(e.target.value)} required={field.is_required}><option value="">انتخاب کنید</option>{field.options.map(option=><option key={String(option)} value={String(option)}>{String(option)}</option>)}</select></label>;return <label key={field.field_key}>{field.label}<input type={field.field_type==='NUMBER'?'number':field.field_type==='DATE'?'date':'text'} value={String(value??'')} onChange={e=>change(field.field_type==='NUMBER'?Number(e.target.value):e.target.value)} required={field.is_required}/></label>};

  return <Card className="quick-ticket-card"><div className="quick-ticket-heading"><div><p className="eyebrow">درخواست جدید</p><h2>چه کمکی از دست ما برمی‌آید؟</h2><p>شرح کوتاه و روشن، درخواست شما را سریع‌تر به کارشناس مناسب می‌رساند.</p></div><Send aria-hidden="true"/></div><form className="quick-ticket-form" onSubmit={submit}><label>عنوان درخواست<input minLength={3} maxLength={200} value={form.title} onChange={event=>setForm({...form,title:event.target.value})} placeholder="مثلاً دسترسی به سامانه مالی" required/></label><label>شرح درخواست<textarea maxLength={10000} value={form.description} onChange={event=>setForm({...form,description:event.target.value})} placeholder="مشکل، زمان شروع و نتیجه‌ای که انتظار دارید را توضیح دهید." required/></label><label>دسته‌بندی<select value={form.categoryId} onChange={event=>setForm({...form,categoryId:event.target.value})}><option value="">انتخاب نشده</option>{catalogs.categories.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label><button className="ticket-details-toggle" type="button" aria-expanded={detailsOpen} onClick={()=>setDetailsOpen(!detailsOpen)}><ChevronDown size={17} className={detailsOpen?'rotated':''}/> جزئیات بیشتر</button>{detailsOpen&&<div className="quick-ticket-more"><label>اولویت<select value={form.priority} onChange={event=>setForm({...form,priority:event.target.value})}><option value="LOW">کم</option><option value="NORMAL">عادی</option><option value="HIGH">بالا</option><option value="URGENT">فوری</option></select></label><label>واحد مرتبط<select value={form.departmentId} onChange={event=>setForm({...form,departmentId:event.target.value})}><option value="">انتخاب نشده</option>{catalogs.departments.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>مکان<select value={form.locationId} onChange={event=>setForm({...form,locationId:event.target.value})}><option value="">انتخاب نشده</option>{catalogs.locations.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>{customFields.map(customInput)}<label className="controlled-file"><FilePlus2 size={17}/><span>{file?`${file.name} · ${Math.ceil(file.size/1024)} KB`:'افزودن پیوست'}</span><input type="file" onChange={(event:ChangeEvent<HTMLInputElement>)=>setFile(event.target.files?.[0]??null)}/></label></div>}{error&&<p className="error" role="alert">{error}</p>}<div className="quick-ticket-actions"><Button type="submit" loading={busy}>ثبت درخواست</Button><span>پس از ثبت می‌توانید گفتگو و وضعیت رسیدگی را دنبال کنید.</span></div></form></Card>;
}
