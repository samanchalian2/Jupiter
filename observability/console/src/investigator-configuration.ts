export type InvestigatorConfig={enabled:boolean;externalProcessingAllowed:boolean;endpoint?:string;model?:string;monthlyTokenBudget:number|string;hasCredential:boolean;maxOutputTokens?:number;maxContextBytes?:number;maxConcurrent?:number;reviewIntervalSeconds?:number;monthlyRequestLimit?:number|string|null;monthlyEstimatedCostMicros?:number|string|null;inputRateMicrosPerMillion?:number|string|null;outputRateMicrosPerMillion?:number|string|null};
export const investigatorOptionalLimits=[
 {field:'monthlyRequestLimit',label:'سقف اختیاری تلاش‌های provider در ماه',max:1000000000,placeholder:'بدون محدودیت تعداد'},
 {field:'monthlyEstimatedCostMicros',label:'سقف اختیاری هزینهٔ تخمینی ماه؛ میکرودلار',max:1000000000000,placeholder:'بدون محدودیت هزینه'},
 {field:'inputRateMicrosPerMillion',label:'نرخ ورودی؛ میکرودلار برای یک میلیون توکن',max:1000000000000,placeholder:'نرخ نامعلوم'},
 {field:'outputRateMicrosPerMillion',label:'نرخ خروجی؛ میکرودلار برای یک میلیون توکن',max:1000000000000,placeholder:'نرخ نامعلوم'},
] as const;
export const investigatorLimits=[
 {field:'maxOutputTokens',label:'حداکثر توکن خروجی هر تحلیل',min:128,max:4096,defaultValue:1024},
 {field:'maxContextBytes',label:'حداکثر حجم زمینهٔ هر تحلیل (بایت)',min:2048,max:32768,defaultValue:16000},
 {field:'maxConcurrent',label:'حداکثر تحلیل هم‌زمان',min:1,max:4,defaultValue:1},
 {field:'reviewIntervalSeconds',label:'فاصلهٔ بررسی دوره‌ای (ثانیه)',min:300,max:86400,defaultValue:300},
] as const;
export function investigatorConfigurationCommand(config:InvestigatorConfig,credential:string,reason:string){
 const monthlyTokenBudget=Number(config.monthlyTokenBudget);
 if(!String(config.monthlyTokenBudget).trim()||!Number.isSafeInteger(monthlyTokenBudget)||monthlyTokenBudget<(config.enabled?1:0)||monthlyTokenBudget>1000000000||reason.trim().length<3||reason.length>500||!config.endpoint||!config.model||!config.hasCredential&&!credential)throw Error('مقادیر تنظیمات، بودجه و دلیل تغییر را کامل و معتبر وارد کنید.');
 const limits:Record<string,number>={};for(const item of investigatorLimits){const value=config[item.field]??item.defaultValue;if(!Number.isSafeInteger(value)||value<item.min||value>item.max)throw Error(`${item.label} باید عدد صحیح بین ${item.min} و ${item.max} باشد.`);limits[item.field]=value;}
 const optional:Record<string,number|null>={};for(const item of investigatorOptionalLimits){const raw=config[item.field];if(raw===undefined)continue;if(raw===null||typeof raw==='string'&&!raw.trim()){optional[item.field]=null;continue;}if(typeof raw==='string'&&!/^\d+$/.test(raw))throw Error(`${item.label} باید عدد صحیح نامنفی باشد.`);const value=Number(raw);if(!Number.isSafeInteger(value)||value<0||value>item.max)throw Error(`${item.label} معتبر نیست.`);optional[item.field]=value;}
 if((optional.inputRateMicrosPerMillion!=null)!==(optional.outputRateMicrosPerMillion!=null)||optional.monthlyEstimatedCostMicros!=null&&optional.inputRateMicrosPerMillion==null)throw Error('برای سقف هزینه، هر دو نرخ ورودی و خروجی را صریح وارد کنید؛ خالی به معنی صفر نیست.');
 return{enabled:config.enabled,externalProcessingAllowed:config.externalProcessingAllowed,endpoint:config.endpoint,model:config.model,monthlyTokenBudget,...limits,...optional,...(credential?{credential}:{}),reason:reason.trim()};
}
