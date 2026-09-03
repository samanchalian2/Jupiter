---
slug: organization-directory
title: راهنمای اتصال فهرست سازمانی
summary: اصول امن اتصال و همگام‌سازی فهرست کاربران سازمان.
category: امنیت و دسترسی
audience: ["ORG_ADMIN", "ORG_OWNER"]
tags: ["فهرست سازمانی", "دسترسی", "همگام‌سازی"]
productArea: مدیریت سازمان
relatedFeature: DIRECTORY_CONNECTOR
relatedRoute: /admin/directory
---

# راهنمای اتصال فهرست سازمانی

Connector یک Windows Service با ارتباط فقط خروجی HTTPS است؛ Jupiter هیچ اتصال LDAP ورودی، رمز Active Directory، hash رمز یا قابلیت writeback ندارد. جفت‌سازی با کد یک‌بارمصرف ۱۵ دقیقه‌ای انجام می‌شود و revoke، credential دستگاه را بلافاصله بی‌اعتبار می‌کند.

Scope رسمی در Jupiter نگهداری می‌شود: تمام Directory، OUهای منتخب یا Groupهای منتخب. Connector فقط OU/Groupهای قابل مشاهده را کشف می‌کند و policy نسخه‌دار Cloud را محلی اعمال می‌کند. اگر policy تغییر کرده باشد، Connector نسخهٔ کامل آن را دریافت می‌کند؛ heartbeat فقط telemetry سبک، نسخه و فرمان pending را منتقل می‌کند.

Sync زمان‌بندی‌شده هر ۱۵ دقیقه «Snapshot افزایشی» است، نه Delta AD. Full Reconciliation حداقل هر ۲۴ ساعت اجرا می‌شود و برای فهرست‌های بزرگ به batchهای محدود تقسیم می‌شود؛ تا وقتی تمام batchهای Full نرسیده باشند، absence هیچ کاربری به خروج از Scope یا حذف تفسیر نمی‌شود. Sync Now همان pipeline خودکار را با trigger دستی اجرا می‌کند و تکرار click یا request، اجرای موازی ایجاد نمی‌کند.

هر run ابتدا CREATE، UPDATE، SUSPEND، CONFLICT، OUT_OF_SCOPE و UNCHANGED را ثبت می‌کند. Conflict هرگز auto-merge نمی‌شود؛ دادهٔ AD یا Jupiter را اصلاح کنید و Sync بعدی را اجرا کنید. کاربران بدون email پشتیبانی می‌شوند و objectGUID کلید هویت پایدار است؛ تغییر email یا username نباید کاربر جدید بسازد.

کاربر disabled فوراً suspend می‌شود. absence و حذف فقط پس از Full Reconciliation کامل و موفق قابل نتیجه‌گیری است؛ OUT_OF_SCOPE ابتدا هفت روز grace می‌گیرد و سپس suspend می‌شود. اطلاعات و نقش‌های Jupiter-owned باقی می‌مانند. فقط نگاشت Group به REQUESTER، EXPERT و SUPERVISOR ممکن است؛ مالک و مدیر سازمان هرگز از Directory ایجاد یا حذف نمی‌شوند.

در وضعیت Offline، صفحهٔ Directory «در انتظار اتصال Connector» را نمایش می‌دهد. Event Log محلی Connector و تاریخچهٔ Sync را بررسی کنید؛ رمز، token و محتوای Directory را در log یا ticket وارد نکنید.
