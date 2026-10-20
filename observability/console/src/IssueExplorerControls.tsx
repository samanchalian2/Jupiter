export interface IssueSelection {sort:string;groupBy:string;status:string;}
export interface IssueGroup {key:string;issues:number;}
export const initialIssueSelection:IssueSelection={sort:'LAST_SEEN',groupBy:'NONE',status:''};
const states:Record<string,string>={OPEN:'باز',INVESTIGATING:'در بررسی',RESOLVED:'رفع‌شده',IGNORED:'نادیده',REOPENED:'دوباره باز',CRITICAL:'بحرانی',ERROR:'خطا',WARNING:'هشدار',INFO:'اطلاعات',DEBUG:'اشکال‌زدایی'};
export function issueQuery(query:URLSearchParams,selection:IssueSelection){
 const next=new URLSearchParams(query);next.set('sort',selection.sort);next.set('groupBy',selection.groupBy);if(selection.status)next.set('status',selection.status);return next;
}
export function withoutIssueOrdering(query:URLSearchParams){const next=new URLSearchParams(query);next.delete('sort');next.delete('groupBy');return next;}
export function IssueExplorerControls({selection,groups,onChange,onSeverity}:{selection:IssueSelection;groups:IssueGroup[];onChange:(next:IssueSelection)=>void;onSeverity:(value:string)=>void}){
 return <section aria-label="چینش و گروه‌بندی خطاها">
  <div className="obs-filters">
   <label>مرتب‌سازی خطاها<select aria-label="مرتب‌سازی خطاها" value={selection.sort} onChange={event=>onChange({...selection,sort:event.target.value})}>{[['LAST_SEEN','آخرین مشاهده؛ جدیدتر'],['FIRST_SEEN','اولین مشاهده؛ جدیدتر'],['OCCURRENCES','بیشترین وقوع در کل عمر'],['SEVERITY','بیشترین شدت']].map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
   <label>گروه‌بندی خطاها<select aria-label="گروه‌بندی خطاها" value={selection.groupBy} onChange={event=>onChange({...selection,groupBy:event.target.value})}><option value="NONE">بدون گروه‌بندی</option><option value="STATUS">وضعیت</option><option value="SEVERITY">شدت</option></select></label>
   <label>وضعیت خطاها<select aria-label="وضعیت خطاها" value={selection.status} onChange={event=>onChange({...selection,status:event.target.value})}><option value="">همه</option>{['OPEN','INVESTIGATING','RESOLVED','IGNORED','REOPENED'].map(value=><option key={value} value={value}>{states[value]}</option>)}</select></label>
  </div>
  <p className="hint">گروه‌ها تعداد خطاهای کل نتیجهٔ مجازند، نه فقط این صفحه. ردیف‌ها ابتدا بر اساس گروه و سپس مرتب‌سازی انتخابی می‌آیند؛ وضعیت‌ها به ترتیب نام فنی و شدت از بحرانی به پایین. تعداد وقوع، کل عمر خطاست؛ نسخه و دسته با شاهد موجود در همین بازه تطبیق داده می‌شوند.</p>
  {selection.groupBy!=='NONE'&&<div className="obs-pagination" role="group" aria-label="محدودکردن به گروه خطا">{groups.map(group=><button key={group.key} type="button" className="secondary" onClick={()=>selection.groupBy==='STATUS'?onChange({...selection,status:group.key}):onSeverity(group.key)}>{states[group.key]??group.key} · {group.issues.toLocaleString('fa-IR')} خطا</button>)}</div>}
 </section>;
}
