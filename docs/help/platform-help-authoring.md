---
slug: platform-help-authoring
title: نگارش راهنما، نسخه‌ها، انتشار، بازگردانی و خروجی
summary: مدیریت امن محتوای Help توسط Platform Admin با revisionهای immutable.
category: مدیریت Platform
audience: ["PLATFORM_ADMIN"]
tags: ["Help", "نگارش راهنما", "نسخه", "انتشار", "بازگردانی", "خروجی"]
productArea: Platform
relatedFeature: PLATFORM_HELP_AUTHORING
relatedRoute: /platform/help
---

# نگارش و انتشار راهنما

مقالهٔ راهنما global و Platform-owned است. هنگام ساخت یا ویرایش، title، summary، دسته، مخاطب، برچسب‌ها و مسیر یا قابلیت مرتبط را با محصول واقعی هماهنگ کنید. registry از ارجاع به route یا feature نامعتبر جلوگیری می‌کند.

هر ویرایش یک draft revision تازه می‌سازد؛ نسخهٔ منتشرشدهٔ قبلی دست‌نخورده می‌ماند. Preview را بررسی کنید، سپس همان revision را publish کنید. Restore نیز یک draft جدید از نسخهٔ انتخاب‌شده می‌سازد، نه بازنویسی تاریخچه.

Unpublish فقط برای محتوای واقعاً ناسازگار یا ناامن استفاده شود؛ مقالهٔ منتشرنشده برای کاربر نمایش داده نمی‌شود. خروجی Markdown یا JSON فقط محتوای منتشرشده را برمی‌گرداند. متن تیکت، credential، secret یا دادهٔ tenant را در Help وارد نکنید.
