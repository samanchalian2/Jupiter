---
slug: platform-commercial-admin
title: کنسول تجاری Platform و رسیدگی به درخواست سازمان
summary: کنترل اشتراک، سهمیه، بسته‌ها، overage و درخواست‌های تجاری توسط Platform Admin.
category: مدیریت Platform
audience: ["PLATFORM_ADMIN"]
tags: ["Platform", "تجاری", "اشتراک", "سهمیه", "بسته", "overage", "درخواست تجاری"]
productArea: تجاری Platform
relatedFeature: PLATFORM_COMMERCIAL
relatedRoute: /platform/commercial
---

# کنسول تجاری Platform

فقط Platform Admin می‌تواند محصول، entitlement، lifecycle اشتراک، سیاست سهمیه، بستهٔ افزایشی، ظرفیت Assist و دسترس‌پذیری سرویس را مدیریت کند. عملیات سازمانی همیشه سازمان هدف صریح دارد و در Audit با actor واقعی ثبت می‌شود.

درخواست‌های تجاری مالک با وضعیت Pending، Approved یا Rejected دیده می‌شوند. Apply فقط پس از تصمیم Platform انجام می‌شود و برای جلوگیری از تخصیص یا تغییر تکراری retry-safe است. درخواست بستهٔ افزایشی باید به یک بستهٔ فعال نگاشت شود؛ تمدید نیز فقط subscription مجاز همان سازمان را به‌روزرسانی می‌کند.

سیاست سهمیهٔ هوشمند، استخر مشترک ماهانه و Emergency را کنترل می‌کند. overrideهای سازمانی تنها برای تخصیص آینده یا دورهٔ هنوز provision‌نشده اثر دارند و تاریخچهٔ provision‌شده را بازنویسی نمی‌کنند. پرداخت، فاکتور، قیمت‌گذاری و BYOK در این کنسول وجود ندارد.
