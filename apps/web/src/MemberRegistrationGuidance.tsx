export type MemberRegistration={displayName:string;email:string;username:string;password:string;roles:string[]};
export function memberRegistrationErrors(form:MemberRegistration):string[]{
  const errors:string[]=[];
  if(!form.displayName.trim())errors.push('نام نمایشی را وارد کنید؛ این نام فقط برای نمایش است و نام ورود نیست.');
  if(!/^\S+@\S+\.\S+$/.test(form.email.trim()))errors.push('یک ایمیل معتبر وارد کنید؛ در نبود نام کاربری، ورود با همین ایمیل انجام می‌شود.');
  if(form.username.trim()&&!/^[a-z0-9][a-z0-9._-]{1,62}$/i.test(form.username.trim()))errors.push('نام کاربری باید ۲ تا ۶۳ نویسه و شامل حروف انگلیسی، عدد، نقطه، خط تیره یا زیرخط باشد.');
  if(form.password.length<8||form.password.length>200)errors.push('رمز موقت باید بین ۸ تا ۲۰۰ کاراکتر باشد؛ حروف بزرگ و کوچک رمز متفاوت‌اند.');
  if(!form.roles.length)errors.push('حداقل یک نقش انتخاب کنید: برای عضو عادی «درخواست‌کننده» و برای مدیریت «مدیر سازمان».');
  return errors;
}
export function MemberRegistrationGuidance({roles}:{roles:string[]}){
  return <div className="hint"><p>نام نمایشی، ایمیل معتبر، رمز موقت و حداقل یک نقش ضروری‌اند. نام کاربری اختیاری است؛ اطلاعات ورود را به‌صورت امن به کاربر بدهید.</p><p>درخواست‌کننده: ثبت و پیگیری درخواست‌های خود؛ کارشناس: رسیدگی به درخواست‌ها؛ سرپرست: نظارت بر تیم؛ مدیر سازمان: مدیریت کاربران و تنظیمات همین سازمان.</p>{roles.includes('ORG_ADMIN')&&<p className="notice" role="status">این کاربر دسترسی مدیریتی همین سازمان را می‌گیرد؛ این نقش معادل مالک سازمان یا مدیر پلتفرم نیست.</p>}{!roles.length&&<p className="error" role="status">هیچ نقشی انتخاب نشده است؛ پیش از ثبت، حداقل یک نقش انتخاب کنید.</p>}</div>;
}
