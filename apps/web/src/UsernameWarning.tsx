export function UsernameWarning({username}:{username:string}) {
  return username.trim()?null:<p className="notice" role="status">نام کاربری خالی است؛ ورود فقط با ایمیل ممکن خواهد بود. نام نمایشی برای ورود قابل استفاده نیست.</p>;
}

export function memberCreatedMessage(username:string,email:string) {
  return `کاربر با موفقیت اضافه شد. نام ورود: ${username.trim()||email.trim()}${username.trim()?'':'؛ نام کاربری تعیین نشده و ورود فقط با ایمیل است.'}`;
}
