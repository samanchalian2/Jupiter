export type InvestigatorConfig={enabled:boolean;externalProcessingAllowed:boolean;endpoint?:string;model?:string;monthlyTokenBudget:number|string;hasCredential:boolean;maxOutputTokens?:number;maxContextBytes?:number;maxConcurrent?:number;reviewIntervalSeconds?:number};
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
 return{enabled:config.enabled,externalProcessingAllowed:config.externalProcessingAllowed,endpoint:config.endpoint,model:config.model,monthlyTokenBudget,...limits,...(credential?{credential}:{}),reason:reason.trim()};
}
