const messages:Record<string,string>={
 ACTIVE_GRANT_CONFLICT:'این هویت در این محدوده مجوز دستی فعال دارد؛ برای تغییر نقش، مجوز قبلی را صریح لغو و سپس مجوز تازه ثبت کنید.',
 INVALID_TARGET_PRINCIPAL:'هویت هدف معتبر و فعال نیست؛ شناسه را از مدیریت هویت میزبان بگیرید.',
 HOST_MANAGED_GRANT_DENIED:'این مجوز را میزبان مدیریت می‌کند و از این فرم قابل لغو نیست.',
 OPERATIONAL_ACCESS_DENIED:'برای مدیریت کل این برنامه مجوز ندارید؛ مدیر محدود به محیط یا tenant کافی نیست.',
 INACTIVE_CREDENTIAL:'کلید قبلاً لغو یا منقضی شده است؛ فهرست کلیدها را بازخوانی کنید.',
 APPLICATION_UNAVAILABLE:'برنامه یا محیط غیرفعال است؛ تعویض کلید مجاز نیست، اما لغو کلید همچنان ممکن است.',
 SERVER_CREDENTIAL_NOT_FOUND:'کلید اتصال در این برنامه پیدا نشد؛ فهرست را بازخوانی کنید.',
};
export class ManagementCommandFailure extends Error{}
export async function managementCommandResult(response:Response,expectsSecret:boolean){
 const body:unknown=await response.json();
 if(!response.ok){if(body&&typeof body==='object'&&'reasonCode' in body&&typeof body.reasonCode==='string'&&Object.hasOwn(messages,body.reasonCode))throw new ManagementCommandFailure(messages[body.reasonCode]);throw Error('MANAGEMENT_RESULT_UNCONFIRMED');}
 if(expectsSecret){if(!body||typeof body!=='object'||!('token' in body)||typeof body.token!=='string'||!/^[A-Za-z0-9_-]{32,256}$/.test(body.token)||!('credentialId' in body)||typeof body.credentialId!=='string'||!/^[0-9a-f-]{36}$/i.test(body.credentialId)||!('expiresAt' in body)||typeof body.expiresAt!=='string'||!Number.isFinite(Date.parse(body.expiresAt)))throw Error('MANAGEMENT_RESULT_UNCONFIRMED');return{token:body.token,credentialId:body.credentialId,expiresAt:body.expiresAt};}
 return null;
}
