export function observationLabel(state:unknown):string{
 if(state==='ERRORS_OBSERVED')return 'خطا در داده‌های این بازه مشاهده شده است';
 if(state==='NO_ERRORS_OBSERVED')return 'در داده‌های این بازه خطایی مشاهده نشده است';
 return 'شاهدی برای ارزیابی این محدوده وجود ندارد';
}
export function overviewStateLabel(value:unknown):string{
 const labels:Record<string,string>={ISSUE:'خطا',INCIDENT:'رخداد عملیاتی',DAILY:'جمع‌بندی روزانه',WEEKLY:'جمع‌بندی هفتگی',DEBUG:'اشکال‌زدایی',INFO:'اطلاع',WARNING:'هشدار',ERROR:'خطا',CRITICAL:'بحرانی',OPEN:'باز',INVESTIGATING:'در حال بررسی',RESOLVED:'رفع‌شده',IGNORED:'نادیده گرفته‌شده',REOPENED:'بازگشایی‌شده'};
 return typeof value==='string'?labels[value]??value:'—';
}
