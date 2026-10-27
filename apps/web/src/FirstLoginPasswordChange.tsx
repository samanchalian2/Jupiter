import { useState, type FormEvent } from 'react';
import type { Session } from './App';
import { isSessionResponse, type PasswordChangeChallenge } from './authenticationResult';
import { Button } from './ui';

/** Challenge and passwords live only in component memory, never browser storage. */
export function FirstLoginPasswordChange({challenge,onSession,onCancel}:{challenge:PasswordChangeChallenge;onSession:(session:Session)=>void;onCancel:()=>void}) {
  const [password,setPassword]=useState(''),[confirmation,setConfirmation]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const submit=async(event:FormEvent)=>{
    event.preventDefault();setError('');
    if(password!==confirmation){setError('تکرار رمز عبور یکسان نیست.');return;}
    if(Date.parse(challenge.expiresAt)<=Date.now()){setError('مهلت تغییر رمز تمام شده است؛ به ورود بازگردید.');return;}
    setBusy(true);
    try{
      const response=await fetch(`${import.meta.env.VITE_API_URL??'/api/v1'}/auth/password/first-login`,{method:'POST',credentials:'include',headers:{'content-type':'application/json'},body:JSON.stringify({passwordChangeToken:challenge.passwordChangeToken,nextPassword:password})});
      const result=await response.json().catch(()=>({message:'تغییر رمز ناموفق بود.'}));
      if(!response.ok)throw new Error(result.message??'تغییر رمز ناموفق بود.');
      if(!isSessionResponse(result))throw new Error('نشست معتبر دریافت نشد؛ دوباره وارد شوید.');
      setPassword('');setConfirmation('');onSession(result);
    }catch(cause){setError(cause instanceof Error?cause.message:'تغییر رمز ناموفق بود.');}finally{setBusy(false);}
  };
  return <main className="login-page" dir="rtl"><section className="login-card"><h1>رمز موقت را تغییر دهید</h1><p>برای امنیت حساب، پیش از ورود به فضای کاری یک رمز شخصی متفاوت انتخاب کنید. رمز را در پیام‌رسان عمومی ارسال نکنید.</p><form onSubmit={submit}><label>رمز جدید<input type="password" autoComplete="new-password" minLength={10} maxLength={200} value={password} onChange={event=>setPassword(event.target.value)} required autoFocus/></label><label>تکرار رمز جدید<input type="password" autoComplete="new-password" minLength={10} maxLength={200} value={confirmation} onChange={event=>setConfirmation(event.target.value)} required/></label>{error&&<p className="error" role="alert">{error}</p>}<Button loading={busy}>تغییر رمز و ورود</Button><button type="button" className="secondary" onClick={onCancel} disabled={busy}>بازگشت به ورود</button></form></section></main>;
}
