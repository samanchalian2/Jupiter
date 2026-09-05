---
slug: organization-directory
title: اتصال دایرکتوری سازمان و همگام‌سازی کاربران
summary: جفت‌سازی Connector خروجی‌محور، scope، سلامت و همگام‌سازی امن کاربران.
category: مدیریت سازمان
audience: ["ORG_ADMIN", "ORG_OWNER"]
tags: ["دایرکتوری", "Directory Connector", "جفت‌سازی", "Active Directory", "همگام‌سازی", "OU"]
productArea: مدیریت سازمان
relatedFeature: DIRECTORY_CONNECTOR
relatedRoute: /admin/directory
---

# اتصال دایرکتوری سازمان

Connector دایرکتوری به‌صورت یک سرویس Windows در شبکهٔ سازمان اجرا می‌شود و فقط اتصال خروجی HTTPS برقرار می‌کند. اعتبارنامهٔ Active Directory به پلتفرم Jupiter ارسال یا در cloud ذخیره نمی‌شود.

## جفت‌سازی و Scope

مالک یا مدیر سازمان یک Connector نام‌دار می‌سازد و کد جفت‌سازی کوتاه‌عمر دریافت می‌کند. کد یک‌بار مصرف است؛ آن را فقط در Connector همان سازمان وارد کنید. پس از اتصال، OU و گروه‌های مجاز و نگاشت نقش‌ها را بازبینی کنید. تنها نقش‌های مجاز سازمانی از دایرکتوری مدیریت می‌شوند و کاربرِ بدون ایمیل هم می‌تواند از دایرکتوری ایجاد شود.

## سلامت و بازیابی

صفحهٔ دایرکتوری آخرین heartbeat، نسخه و وضعیت همگام‌سازی را نشان می‌دهد. Connector می‌تواند snapshot افزایشی و reconcile کامل زمان‌بندی‌شده انجام دهد. حذف Connector یا تغییر scope، کاربران را بی‌درنگ پاک نمی‌کند. در صورت revoke، جفت‌سازی مجدد همان record یک device identity تازه می‌سازد و کدها و tokenهای قدیمی نامعتبر می‌مانند.
