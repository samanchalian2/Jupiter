---
slug: platform-organization-applications
title: درخواست سازمان، چرخهٔ عمر و انتساب مالک در Platform
summary: بررسی درخواست ثبت سازمان و مدیریت ایمن Owner برای Platform Admin.
category: مدیریت Platform
audience: ["PLATFORM_ADMIN"]
tags: ["درخواست سازمان", "Organization Application", "مالک سازمان", "Platform", "چرخه عمر"]
productArea: Platform
relatedFeature: PLATFORM_ORGANIZATION_APPLICATIONS
relatedRoute: /platform/applications
---

# درخواست‌های سازمان در Platform

درخواست سازمان مراحل DRAFT، SUBMITTED، UNDER_REVIEW، NEEDS_INFORMATION، APPROVED، REJECTED یا CANCELLED دارد. Platform Admin درخواست را بررسی می‌کند، اطلاعات لازم را می‌خواهد یا تصمیم ثبت می‌کند. slug سازمان پس از تأیید باید یکتا و مناسب مسیر `/o/{slug}` باشد.

Owner سازمان یک نقش تجاری و مدیریتی محدود به همان سازمان است. سازمان‌های قدیمی بدون Owner همچنان عملیاتی می‌مانند؛ هیچ کاربر یا ORG_ADMIN به‌صورت خودکار Owner نمی‌شود. انتساب یا حذف Owner باید آگاهانه، با actor واقعی و قابل audit باشد.

وقتی عضویت در چند سازمان وجود دارد، مسیر legacy فقط در صورت رفع ابهام redirect می‌شود. مسیر canonical همیشه `/o/{slug}` است.
