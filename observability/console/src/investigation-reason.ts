const reasons:Record<string,string>={
 AI_REQUEST_LIMIT_EXHAUSTED:'سقف ماهانهٔ تعداد فراخوانی‌های تحلیلگر تمام شده است.',
 AI_COST_LIMIT_EXHAUSTED:'ظرفیت باقی‌ماندهٔ سقف هزینهٔ تخمینی برای این تحلیل کافی نیست.',
 AI_COST_ESTIMATE_UNAVAILABLE:'برآورد هزینه در دسترس نیست؛ نرخ‌ها و تلاش‌های بدون نرخ ماه جاری را بررسی کنید.',
 AI_BUDGET_EXHAUSTED:'ظرفیت باقی‌ماندهٔ بودجهٔ توکن برای این تحلیل کافی نیست.',
 AI_DISABLED:'تحلیلگر در این برنامه یا محیط غیرفعال است.',
 INSUFFICIENT_EVIDENCE:'شواهد مجاز کافی برای تحلیل موجود نیست.',
 AI_PROVIDER_FAILED:'فراخوانی ارائه‌دهنده موفق نشد؛ مصرف نامعلوم همچنان رزرو می‌ماند.',
 AI_PROVIDER_TIMEOUT:'مهلت پاسخ ارائه‌دهنده تمام شد؛ مصرف نامعلوم همچنان رزرو می‌ماند.',
};
export function investigationReason(code:string){return reasons[code]??'تحلیل تکمیل نشد؛ کد تشخیصی را همراه با شواهد این محدوده بررسی کنید.';}
