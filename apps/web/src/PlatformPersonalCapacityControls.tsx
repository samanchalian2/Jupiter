import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { Actor } from './App';
import { request } from './App';

type PoolCode='SUPPORT'|'AI';
type Policy={pool_code:PoolCode;default_monthly_units:number};
type Workspace={id:string;name:string;owner_name:string;owner_email:string;status:string};
type Override={organization_id:string;pool_code:PoolCode;monthly_units:number};
type PersonalPackage={id:string;code:string;name:string;description:string;pool_code:PoolCode;unit_count:number;price_irt:string;validity_days:number;status:'DRAFT'|'ACTIVE'|'RETIRED'};
type Allocation={id:string;organization_id:string;workspace_name:string;package_name_snapshot:string;pool_code:PoolCode;granted_units:number;price_irt_snapshot:string;expires_at:string;status:'ACTIVE'|'REVOKED'};
type PoolSummary={poolCode:PoolCode;periodEndsAt:string;monthlyGranted:number;monthlyReserved:number;monthlySettled:number;monthlyRemaining:number;purchasedGranted:number;purchasedReserved:number;purchasedSettled:number;purchasedRemaining:number};
type Summary={pools:PoolSummary[]};

const poolLabel:Record<PoolCode,string>={SUPPORT:'پشتیبانی شخصی',AI:'اقدامات هوشمند'};
const money=(value:string)=>`${Number(value).toLocaleString('fa-IR')} تومان`;

export function PlatformPersonalCapacityControls({actor,onSaved,onError}:{actor:Actor;onSaved:(message:string)=>void;onError:(message:string)=>void}) {
  const [policies,setPolicies]=useState<Policy[]>([]);
  const [workspaces,setWorkspaces]=useState<Workspace[]>([]);
  const [overrides,setOverrides]=useState<Override[]>([]);
  const [packages,setPackages]=useState<PersonalPackage[]>([]);
  const [allocations,setAllocations]=useState<Allocation[]>([]);
  const [selectedWorkspace,setSelectedWorkspace]=useState('');
  const [summary,setSummary]=useState<Summary|null>(null);
  const [overrideForm,setOverrideForm]=useState({organizationId:'',poolCode:'SUPPORT' as PoolCode,monthlyUnits:''});
  const [packageForm,setPackageForm]=useState({id:'',code:'',name:'',description:'',poolCode:'SUPPORT' as PoolCode,unitCount:1,priceIrt:0,validityDays:365,status:'DRAFT' as PersonalPackage['status']});
  const [allocationForm,setAllocationForm]=useState({organizationId:'',packageId:'',reason:''});
  const [revokeForm,setRevokeForm]=useState({allocationId:'',reason:''});
  const activePackages=useMemo(()=>packages.filter(item=>item.status==='ACTIVE'),[packages]);

  const load=()=>Promise.all([
    request('/platform/personal-capacity/policies',actor.session,actor.organizationId),
    request('/platform/personal-capacity/workspaces',actor.session,actor.organizationId),
    request('/platform/personal-capacity/overrides',actor.session,actor.organizationId),
    request('/platform/personal-capacity/packages',actor.session,actor.organizationId),
    request('/platform/personal-capacity/allocations',actor.session,actor.organizationId),
  ]).then(([policyRows,workspaceRows,overrideRows,packageRows,allocationRows])=>{
    setPolicies(policyRows as Policy[]);setWorkspaces(workspaceRows as Workspace[]);setOverrides(overrideRows as Override[]);
    setPackages(packageRows as PersonalPackage[]);setAllocations(allocationRows as Allocation[]);
  }).catch(cause=>onError(cause instanceof Error?cause.message:'دریافت تنظیمات ظرفیت شخصی ناموفق بود.'));
  useEffect(()=>{void load();},[actor.session.accessToken]);

  const command=async(path:string,body:object,message:string,headers?:Record<string,string>)=>{
    try{await request(path,actor.session,actor.organizationId,{method:'POST',headers,body:JSON.stringify(body)});await load();onSaved(message);return true;}
    catch(cause){onError(cause instanceof Error?cause.message:'عملیات ظرفیت شخصی ناموفق بود.');return false;}
  };
  const inspect=async(organizationId:string)=>{
    setSelectedWorkspace(organizationId);setSummary(null);if(!organizationId)return;
    try{setSummary(await request(`/platform/personal-capacity/summary?organizationId=${encodeURIComponent(organizationId)}`,actor.session,actor.organizationId) as Summary);}
    catch(cause){onError(cause instanceof Error?cause.message:'دریافت خلاصه ظرفیت ناموفق بود.');}
  };
  const savePackage=(event:FormEvent)=>{event.preventDefault();void command('/platform/personal-capacity/packages',packageForm,'بسته شخصی ذخیره شد.').then(ok=>{if(ok)setPackageForm({id:'',code:'',name:'',description:'',poolCode:'SUPPORT',unitCount:1,priceIrt:0,validityDays:365,status:'DRAFT'});});};
  return <section className="card">
    <h3>سهمیه و بسته‌های فضای شخصی</h3>
    <p className="hint">پشتیبانی و هوش مصنوعی دو ظرفیت مستقل دارند. تغییر پیش‌فرض یا استثنا، دوره‌ای را که قبلاً ساخته شده تغییر نمی‌دهد.</p>
    <div className="settings-grid">
      {policies.map(policy=><form className="compact-form" key={policy.pool_code} onSubmit={event=>{event.preventDefault();void command('/platform/personal-capacity/policies',{poolCode:policy.pool_code,monthlyUnits:policy.default_monthly_units},'پیش‌فرض دوره‌های آینده ذخیره شد.');}}>
        <h4>{poolLabel[policy.pool_code]}</h4>
        <label>سهمیه پیش‌فرض ماهانه<input type="number" min={0} max={1000000} value={policy.default_monthly_units} onChange={event=>setPolicies(rows=>rows.map(item=>item.pool_code===policy.pool_code?{...item,default_monthly_units:Number(event.target.value)}:item))}/></label>
        <button>ذخیره پیش‌فرض آینده</button>
      </form>)}
    </div>

    <h4>استثنای فضای شخصی</h4>
    <form className="compact-form" onSubmit={event=>{event.preventDefault();void command('/platform/personal-capacity/overrides',{organizationId:overrideForm.organizationId,poolCode:overrideForm.poolCode,monthlyUnits:overrideForm.monthlyUnits===''?null:Number(overrideForm.monthlyUnits)},overrideForm.monthlyUnits===''?'استثنا حذف شد.':'استثنای دوره‌های آینده ذخیره شد.');}}>
      <label>فضای شخصی<select required value={overrideForm.organizationId} onChange={event=>setOverrideForm({...overrideForm,organizationId:event.target.value})}><option value="">انتخاب کنید</option>{workspaces.map(item=><option key={item.id} value={item.id}>{item.owner_name} · {item.name}</option>)}</select></label>
      <label>استخر<select value={overrideForm.poolCode} onChange={event=>setOverrideForm({...overrideForm,poolCode:event.target.value as PoolCode})}><option value="SUPPORT">پشتیبانی</option><option value="AI">هوش مصنوعی</option></select></label>
      <label>سهمیه ماهانه؛ خالی برای حذف استثنا<input type="number" min={0} max={1000000} value={overrideForm.monthlyUnits} onChange={event=>setOverrideForm({...overrideForm,monthlyUnits:event.target.value})}/></label>
      <button>ثبت استثنا</button>
    </form>
    {!!overrides.length&&<p className="hint">استثناهای فعال: {overrides.map(item=>`${workspaces.find(space=>space.id===item.organization_id)?.owner_name??'فضای شخصی'} / ${poolLabel[item.pool_code]}: ${item.monthly_units.toLocaleString('fa-IR')}`).join('، ')}</p>}

    <h4>کاتالوگ بسته‌ها</h4>
    <form className="compact-form" onSubmit={savePackage}>
      <label>کد بسته<input dir="ltr" required pattern="[A-Z0-9_]{3,64}" value={packageForm.code} onChange={event=>setPackageForm({...packageForm,code:event.target.value.toUpperCase()})}/></label>
      <label>نام بسته<input required minLength={2} maxLength={120} value={packageForm.name} onChange={event=>setPackageForm({...packageForm,name:event.target.value})}/></label>
      <label>توضیح<textarea required minLength={2} maxLength={1000} rows={2} value={packageForm.description} onChange={event=>setPackageForm({...packageForm,description:event.target.value})}/></label>
      <label>استخر<select value={packageForm.poolCode} onChange={event=>setPackageForm({...packageForm,poolCode:event.target.value as PoolCode})}><option value="SUPPORT">پشتیبانی</option><option value="AI">هوش مصنوعی</option></select></label>
      <label>تعداد واحد<input type="number" min={1} max={1000000} value={packageForm.unitCount} onChange={event=>setPackageForm({...packageForm,unitCount:Number(event.target.value)})}/></label>
      <label>قیمت (تومان)<input type="number" min={0} step={1} value={packageForm.priceIrt} onChange={event=>setPackageForm({...packageForm,priceIrt:Number(event.target.value)})}/></label>
      <label>اعتبار (روز)<input type="number" min={1} max={1825} value={packageForm.validityDays} onChange={event=>setPackageForm({...packageForm,validityDays:Number(event.target.value)})}/></label>
      <label>وضعیت<select value={packageForm.status} onChange={event=>setPackageForm({...packageForm,status:event.target.value as PersonalPackage['status']})}><option value="DRAFT">پیش‌نویس</option><option value="ACTIVE">فعال</option><option value="RETIRED">بازنشسته</option></select></label>
      <button>{packageForm.id?'ذخیره تغییرات':'ساخت بسته'}</button>{packageForm.id&&<button type="button" className="secondary" onClick={()=>setPackageForm({id:'',code:'',name:'',description:'',poolCode:'SUPPORT',unitCount:1,priceIrt:0,validityDays:365,status:'DRAFT'})}>انصراف</button>}
    </form>
    <div className="table-wrap"><table><thead><tr><th>بسته</th><th>استخر</th><th>واحد</th><th>قیمت</th><th>اعتبار</th><th>وضعیت</th><th></th></tr></thead><tbody>{packages.map(item=><tr key={item.id}><td>{item.name}<small className="table-subtitle" dir="ltr">{item.code}</small></td><td>{poolLabel[item.pool_code]}</td><td>{item.unit_count.toLocaleString('fa-IR')}</td><td>{money(item.price_irt)}</td><td>{item.validity_days.toLocaleString('fa-IR')} روز</td><td>{item.status}</td><td><button type="button" className="secondary" onClick={()=>setPackageForm({id:item.id,code:item.code,name:item.name,description:item.description,poolCode:item.pool_code,unitCount:item.unit_count,priceIrt:Number(item.price_irt),validityDays:item.validity_days,status:item.status})}>ویرایش</button></td></tr>)}{!packages.length&&<tr><td colSpan={7}>هنوز بسته‌ای تعریف نشده است.</td></tr>}</tbody></table></div>

    <h4>تخصیص دستی بسته</h4>
    <p className="hint">این مسیر برای تخصیص صریح ادمین است؛ پرداخت آنلاین در مرحله بعد اضافه می‌شود.</p>
    <form className="compact-form" onSubmit={event=>{event.preventDefault();void command('/platform/personal-capacity/allocations',allocationForm,'بسته به فضای شخصی تخصیص یافت.',{'idempotency-key':crypto.randomUUID()}).then(ok=>{if(ok)setAllocationForm({organizationId:'',packageId:'',reason:''});});}}>
      <label>فضای شخصی<select required value={allocationForm.organizationId} onChange={event=>setAllocationForm({...allocationForm,organizationId:event.target.value})}><option value="">انتخاب کنید</option>{workspaces.map(item=><option key={item.id} value={item.id}>{item.owner_name} · {item.name}</option>)}</select></label>
      <label>بسته فعال<select required value={allocationForm.packageId} onChange={event=>setAllocationForm({...allocationForm,packageId:event.target.value})}><option value="">انتخاب کنید</option>{activePackages.map(item=><option key={item.id} value={item.id}>{item.name} · {poolLabel[item.pool_code]}</option>)}</select></label>
      <label>دلیل تخصیص<input required minLength={2} maxLength={1000} value={allocationForm.reason} onChange={event=>setAllocationForm({...allocationForm,reason:event.target.value})}/></label>
      <button>تخصیص بسته</button>
    </form>
    <div className="table-wrap"><table><thead><tr><th>فضای شخصی</th><th>بسته</th><th>واحد</th><th>قیمت ثبت‌شده</th><th>انقضا</th><th>وضعیت</th></tr></thead><tbody>{allocations.map(item=><tr key={item.id}><td>{item.workspace_name}</td><td>{item.package_name_snapshot}</td><td>{item.granted_units.toLocaleString('fa-IR')}</td><td>{money(item.price_irt_snapshot)}</td><td>{new Date(item.expires_at).toLocaleDateString('fa-IR')}</td><td>{item.status==='ACTIVE'?'فعال':'متوقف'}</td></tr>)}{!allocations.length&&<tr><td colSpan={6}>تخصیصی ثبت نشده است.</td></tr>}</tbody></table></div>
    {!!allocations.some(item=>item.status==='ACTIVE')&&<form className="compact-form" onSubmit={event=>{event.preventDefault();void command(`/platform/personal-capacity/allocations/${revokeForm.allocationId}/revoke`,{reason:revokeForm.reason},'تخصیص بسته متوقف شد.').then(ok=>{if(ok)setRevokeForm({allocationId:'',reason:''});});}}>
      <label>توقف تخصیص فعال<select required value={revokeForm.allocationId} onChange={event=>setRevokeForm({...revokeForm,allocationId:event.target.value})}><option value="">انتخاب کنید</option>{allocations.filter(item=>item.status==='ACTIVE').map(item=><option key={item.id} value={item.id}>{item.workspace_name} · {item.package_name_snapshot}</option>)}</select></label>
      <label>دلیل توقف<input required minLength={2} maxLength={1000} value={revokeForm.reason} onChange={event=>setRevokeForm({...revokeForm,reason:event.target.value})}/></label>
      <button className="secondary">توقف تخصیص</button>
    </form>}

    <h4>نمای ظرفیت جاری</h4>
    <label>فضای شخصی<select value={selectedWorkspace} onChange={event=>void inspect(event.target.value)}><option value="">برای مشاهده انتخاب کنید</option>{workspaces.map(item=><option key={item.id} value={item.id}>{item.owner_name} · {item.name}</option>)}</select></label>
    {summary&&<div className="summary-grid">{summary.pools.map(pool=><article key={pool.poolCode} className="summary-item"><strong>{poolLabel[pool.poolCode]}</strong><span>ماهانه: {pool.monthlyRemaining.toLocaleString('fa-IR')} از {pool.monthlyGranted.toLocaleString('fa-IR')}</span><span>رزرو/مصرف: {pool.monthlyReserved.toLocaleString('fa-IR')} / {pool.monthlySettled.toLocaleString('fa-IR')}</span><span>بسته معتبر: {pool.purchasedRemaining.toLocaleString('fa-IR')} از {pool.purchasedGranted.toLocaleString('fa-IR')}</span><small>پایان دوره: {new Date(pool.periodEndsAt).toLocaleString('fa-IR')}</small></article>)}</div>}
  </section>;
}
