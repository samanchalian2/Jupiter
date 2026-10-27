export const organizationApplicationsPath = '/organization-applications';

export type VerificationDeliveryStatus = 'DELIVERED' | 'PENDING_CONFIGURATION' | 'FAILED';

export function verificationDeliveryMessage(status: VerificationDeliveryStatus | string | null | undefined) {
  switch (status) {
    case 'DELIVERED':
      return 'سرویس ارسال، پیام تأیید را پذیرفته است. پوشهٔ ورودی و هرزنامه را بررسی کنید؛ حساب فقط پس از بازکردن لینک و تأیید ایمیل فعال می‌شود.';
    case 'FAILED':
      return 'ارسال پیام تأیید ناموفق بود. دریافت ایمیل را منتظر نمانید؛ پس از رفع مشکل ارسال، دوباره تلاش کنید یا به پشتیبانی اطلاع دهید.';
    default:
      return 'ارسال ایمیل در این محیط پیکربندی نشده است و پیام تأییدی ارسال نشده است. برای فعال‌سازی ارسال با مدیر پلتفرم تماس بگیرید؛ حساب هنوز تأیید نشده است.';
  }
}

export function isOrganizationApplicationsPath(pathname: string) {
  return pathname === organizationApplicationsPath || pathname === `${organizationApplicationsPath}/`;
}

export function canUseLocalVerification(development: boolean, hostname: string) {
  return development && ['localhost', '127.0.0.1', '[::1]', '::1'].includes(hostname);
}
