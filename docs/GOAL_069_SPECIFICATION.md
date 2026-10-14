# GOAL-069 — Approved requirements source

This is the owner's supplied full specification, normalized to GOAL-069 to
avoid overwriting historical GOAL-060 Personal Service. The following approved
planning decisions supersede conflicting suggestions in the source below:

- Queue: existing PostgreSQL durable outbox/leases; no Redis/BullMQ installation.
- Hub uses generic principals; Jupiter Platform Admin maps only to Jupiter.
- Application creators receive ADMIN for their own Application only. Explicit
  scoped/revocable grants govern others. HUB_SUPER_ADMIN is independent.
- Local bootstrap: parameter-selected existing admin@jupiter.local, explicit,
  idempotent and audited. No hard-coded account or automatic role promotion.
  Staging/Production require independent secure configuration. Prevent orphan
  Applications and removal of the last super-admin without replacement.
- Feedback: any authenticated user, with or without membership; own reports,
  unique Tracking ID and public-to-owner replies. Other products authenticate
  through their own trusted identity adapter, not Jupiter accounts. No anonymous
  V1 submissions; preserve extensibility for later anonymous feedback.
- Technical feedback may be sent to enabled AI after targeted redaction. No
  separate consent checkbox/lifecycle. Preserve error text, reproduction steps,
  sanitized stack, versions/browser/correlation. Mask only unsafe portions;
  Application administrators can disable external processing. Show:
  «گزارش شما ممکن است برای شناسایی و رفع مشکلات نرم‌افزار با کمک هوش مصنوعی تحلیل شود. لطفاً اطلاعات محرمانه مانند رمز عبور را وارد نکنید.»
- AI defaults disabled per Application. Explicit provider/model/monthly input+
  output token budget/activation. After activation, scheduled/event analysis is
  autonomous. Atomic reservations prevent concurrent uncontrolled overspend;
  support optional request/estimated-cost limits. Exhaustion stops AI only.
  Credentials encrypted, never plaintext/logged/committed; independent of
  organization AI_SMART_ACTIONS and Personal AI allowances.
- Development and final acceptance are LOCAL. Do not deploy to either host in
  this execution. GOAL-059 remains BLOCKED. Preserve all original A–I phases and
  full DoD; do not narrow completion to foundation or prototype.
- Mandatory commit/push and remote SHA verification after QC; incomplete work
  uses GOAL-069 IN PROGRESS. Stop after completion for independent owner audit.

## Supplied specification (identifier normalized)

# GOAL-069 — Reusable Observability, Error Intelligence & AI Operations Platform

## مأموریت اصلی

یک پلتفرم حرفه‌ای، مستقل، امن، توسعه‌پذیر و قابل‌استفاده مجدد برای پایش خطاها، اختلالات نرم‌افزاری، عملکرد سیستم، مشکلات کاربران و بازخوردهای آنان طراحی و پیاده‌سازی کن.

نام کاری پلتفرم:

**Observability Hub**

نام زیرسیستم در Jupiter:

**مرکز پایش هوشمند**

این پلتفرم باید بتواند به چندین نرم‌افزار مستقل متصل شود، اطلاعات آن‌ها را دریافت و تحلیل کند و از طریق یک داشبورد عملیاتی مرکزی، امکان پایش انسانی و هوشمند را فراهم سازد.

**Jupiter اولین مصرف‌کننده این پلتفرم است، نه مالک معماری آن.**

هدف، ساخت یک ماژول logging ساده نیست؛ بلکه ایجاد زیرساخت مشترک برای تمام محصولات نرم‌افزاری فعلی و آینده است.

---

# 1. وضعیت پروژه و قوانین اجرای Goal

Repository فعلی:

`samanchalian2/Jupiter`

وضعیت قبلی:

- GOAL-058: ACCEPTED
- GOAL-059: BLOCKED به دلیل فراهم نبودن زیرساخت واقعی Staging
- GOAL-069: با دستور صریح Product Owner در اولویت توسعه قرار گرفته است.

GOAL-059 همچنان BLOCKED باقی می‌ماند.

در این Goal:

- کارهای Deployment مربوط به GOAL-059 را انجام نده.
- ادعای پذیرش Staging یا Production نکن.
- Goal جدیدی ایجاد نکن.
- GOAL-070 را شروع نکن.

پیاده‌سازی GOAL-069 باید کامل، مرحله‌بندی‌شده، تست‌شده و مستند باشد.

**خروجی نهایی نباید صرفاً طراحی معماری، یک Prototype یا مجموعه‌ای از جدول‌ها باشد.**

تمام قابلیت‌های الزامی Definition of Done باید واقعاً کار کنند.

اگر بخشی کامل نشد، وضعیت Goal باید `IN PROGRESS` یا `BLOCKED` باقی بماند.

---

# 2. اصول غیرقابل‌مذاکره معماری

پلتفرم باید این اصول را رعایت کند:

1. Product-Agnostic Architecture
2. Reusable SDKs
3. Technology-Neutral Ingestion API
4. Multi-Application / Multi-Environment Isolation
5. Tenant-Safe Data Management
6. Offline-First Error Recovery
7. Structured Event Storage
8. High Reliability and Failure Isolation
9. Operational Analytics
10. Rule-Based Incident Detection
11. AI-Assisted Investigation
12. Human-in-the-Loop Operations
13. Security and Privacy by Design
14. Future Independent Deployment Capability
15. Backward-Compatible API and SDK Versioning

هیچ یک از این اصول نباید صرفاً در مستندات ادعا شود؛ باید با کد، تست و Evidence پشتیبانی شود.

---

# 3. معماری موجود را ابتدا ممیزی کن

قبل از پیاده‌سازی، ساختار واقعی Jupiter را بررسی کن.

موارد ضروری:

- NestJS modules
- React/Vite application structure
- API client / HTTP wrappers
- Global exception handling
- Existing request ID middleware
- Existing structured logging
- Error Boundaries
- Existing Worker architecture
- Redis / BullMQ
- PostgreSQL and migration runner
- RLS and authorization
- Session/authentication architecture
- Existing Platform Console
- Existing notification infrastructure
- SSE infrastructure
- Existing AI Gateway
- AI commercial/allowance system
- Product Help
- Design System V2
- Test architecture
- Repository/Monorepo package structure

نتایج را در یک Architecture Inventory ثبت کن.

قابلیت‌های موجود را مجدداً نساز.

در صورت وجود ابزار مشابه، آن را به معماری جدید متصل یا به‌صورت کنترل‌شده تکمیل کن.

---

# 4. معماری کلان مورد انتظار

ساختار منطقی مطلوب:

```text
                  CONSUMER APPLICATIONS
 ┌───────────────────────────────────────────────┐
 │ Jupiter         MetroVision       Other Apps  │
 │ React/NestJS    .NET/Python       Any Stack   │
 └───────────────────────────────────────────────┘
                       │
                 SDK / HTTPS API
                       │
                       ▼
 ┌───────────────────────────────────────────────┐
 │               OBSERVABILITY HUB               │
 │                                               │
 │  Authentication / Ingestion / Validation      │
 │  Sanitization / Correlation / Deduplication   │
 │                                               │
 │  Error Tracking       User Feedback           │
 │  Incident Management  Monitoring Rules        │
 │  Analytics            AI Investigator         │
 │  Alerts               Retention               │
 └───────────────────────────────────────────────┘
                 │                 │
                 ▼                 ▼
           PostgreSQL         Redis/BullMQ
                 │
                 ▼
         CENTRAL OPERATIONS CONSOLE
```

هسته Observability نباید به این موارد وابسته باشد:

- Jupiter Ticket
- Jupiter Membership
- Jupiter Subscription
- Jupiter Assist
- Jupiter-specific roles
- Jupiter business workflows
- Jupiter UI components

هرگونه نگاشت اختصاصی Jupiter باید در Adapter جداگانه باشد.

---

# 5. تصمیم مهم درباره استقرار

فعلاً از زیرساخت موجود Jupiter استفاده کن تا پیچیدگی و هزینه غیرضروری ایجاد نشود.

اما مرزهای نرم‌افزاری را طوری طراحی کن که در آینده بتوان Observability Hub را:

- در سرور مستقل نصب کرد؛
- با دیتابیس مستقل اجرا کرد؛
- در اختیار چند برنامه قرار داد؛
- بدون تغییر عمده SDKها جابه‌جا کرد.

این قابلیت باید از طریق interfaceها و قراردادهای پایدار تأمین شود، نه صرفاً با اسم‌گذاری عمومی کلاس‌ها.

Microservice، Kafka، Elasticsearch، ClickHouse یا Kubernetes اضافه نکن مگر ضرورت فنی واقعی و تأییدشده وجود داشته باشد.

---

# 6. ساختار پکیج‌های قابل‌استفاده مجدد

ساختار نهایی را مطابق Monorepo موجود طراحی کن.

حداقل مرزهای منطقی زیر لازم‌اند:

```text
observability/
  packages/
    contracts/
    core/
    browser-sdk/
    react-adapter/
    node-sdk/
    nestjs-adapter/

  server/
    ingestion/
    storage/
    issue-engine/
    incident-engine/
    feedback/
    analytics/
    monitoring/
    ai-investigator/
    alerting/
    retention/

  console/
    operations-ui/

  examples/
    independent-client/
```

نام و مکان دقیق پوشه‌ها را با معماری واقعی Repository هماهنگ کن.

الزام مهم:

**هسته و SDKها نباید Jupiter business modules را import کنند.**

پکیج‌ها باید قابلیت build و test مستقل داشته باشند.

فعلاً آن‌ها را روی npm یا registry عمومی منتشر نکن؛ انتشار عمومی نیازمند تأیید جداگانه است.

---

# 7. مدل چندمحصولی

Observability Hub باید چند Application را پشتیبانی کند.

Entityهای عمومی:

### Application / Project

هر نرم‌افزار یک Application مستقل است.

نمونه:

- Jupiter
- MetroVision
- Product C

### Environment

هر Application می‌تواند محیط‌های مختلف داشته باشد:

- DEVELOPMENT
- TEST
- STAGING
- PRODUCTION

### Tenant

هر Application ممکن است یک یا چند Tenant داشته باشد.

Tenant ID فقط در محدوده Application معنا دارد.

شناسه مشابه Tenant در دو Application مختلف نباید موجب برخورد داده یا دسترسی مشترک شود.

### Actor

هویت منطقی کاربر، دستگاه یا سرویس ایجادکننده رویداد.

### Event

رویداد فنی یا عملیاتی.

### Issue

گروهی از خطاهای مرتبط و تکرارشونده.

### Incident

اختلال یا مشکل عملیاتی نیازمند رسیدگی.

### Feedback

گزارش مشکل، پیشنهاد یا نظر کاربر.

### Investigation

تحلیل هوش مصنوعی یا تحلیلگر انسانی.

---

# 8. ثبت و مدیریت Application

یک Application Registry طراحی کن.

برای هر Application حداقل این اطلاعات قابل مدیریت باشد:

- Application ID
- Name
- Slug / Key
- Description
- Allowed environments
- Allowed origins
- Enabled status
- Ingestion policies
- Retention policies
- Sampling configuration
- Monitoring rules
- AI budget
- Access permissions
- SDK/integration credentials

امکان ایجاد Application جدید از Operations Console باید وجود داشته باشد.

Applicationهای غیرفعال نباید بتوانند رویداد جدید معتبر ثبت کنند.

تغییرات حساس Application Registry باید audit شوند.

---

# 9. قرارداد عمومی API

یک API مستقل از Jupiter تعریف کن.

نمونه مسیر منطقی:

`POST /api/v1/observability/events/batch`

یا مسیر سازگار با معماری موجود.

API باید:

- Versioned
- Documented
- Language-neutral
- Idempotent
- Strictly validated
- Rate-limited
- Tenant-safe

باشد.

OpenAPI specification کامل ایجاد کن.

از قراردادهایی استفاده کن که در آینده با این زبان‌ها سازگار باشند:

- JavaScript
- TypeScript
- React
- Node.js
- NestJS
- .NET / C#
- Python
- Java
- سایر HTTP clients

برای استفاده از API نباید وابستگی به Jupiter Cookie یا Session وجود داشته باشد.

---

# 10. امنیت ارتباط برنامه‌ها

مدل احراز هویت باید بین Browser و Server تفاوت داشته باشد.

## Browser SDK

Browser SDK نباید دارای API Secret دائمی باشد.

Application Key عمومی، secret محسوب نمی‌شود.

برای انتساب معتبر رویداد به کاربر یا Tenant:

- از Backend مورد اعتماد برنامه میزبان استفاده کن؛
- یا یک scoped short-lived ingestion credential صادر کن.

Client-supplied Tenant/User ID هرگز به‌تنهایی معتبر نیست.

Allowed Origin فقط لایه حفاظتی تکمیلی است و جای Authentication را نمی‌گیرد.

## Server-to-Server

از credentialهای محدود و قابل لغو استفاده کن.

Required:

- scoped access
- credential rotation
- revocation
- per-application boundaries
- audit
- rate limiting

Secretها نباید وارد frontend bundle شوند.

---

# 11. قرارداد استاندارد Telemetry Event

یک Schema نسخه‌بندی‌شده ایجاد کن.

فیلدهای اصلی:

```text
eventId
schemaVersion
applicationId
environmentId
occurredAt
receivedAt
releaseVersion

source
category
severity
eventCode
normalizedMessage
exceptionType
sanitizedStack

fingerprint
traceId
spanId
requestId

actorReference
tenantReference
sessionCorrelationId

operationName
routeTemplate
httpStatus
durationMs

browserFamily
browserVersion
operatingSystem
deviceClass
connectivityState

safeMetadata
```

همه فیلدها باید validation و size limit داشته باشند.

زمان‌ها UTC باشند.

اطلاعات Trusted مانند actor و tenant از سمت سرور احراز شوند.

اطلاعات کنترل‌شده توسط Client صرفاً Claim تلقی شوند.

از ذخیره تمام داده‌ها به‌صورت یک JSONB نامحدود خودداری کن.

برای فیلدهای پرتکرار قابل گزارش‌گیری ستون‌های مشخص ایجاد کن.

---

# 12. دسته‌بندی رویدادها

حداقل این دسته‌ها را پشتیبانی کن:

### Frontend Errors
- JavaScript exception
- React rendering error
- Unhandled Promise rejection
- Resource loading failure
- API client failure

### Backend Errors
- Unexpected exception
- Database operation failure
- External dependency failure
- Internal service failure

### Worker Errors
- Job failure
- Retry exhaustion
- Queue processing error
- Abnormal backlog

### Connectivity
- Network unavailable
- API unreachable
- Timeout
- Reconnection
- Repeated request failures

### Performance
- Slow page
- Slow API operation
- Abnormal processing duration

### Business Operation Failures
- Failed ticket creation
- Failed settings update
- Failed file upload
- Failed AI operation
- Other domain-specific failures

### User Feedback
- Bug report
- Problem report
- Suggestion
- General feedback

---

# 13. Severity و Impact

بین این موارد تفاوت ایجاد کن:

- Technical Severity
- Business Impact
- Operational Priority

سطوح فنی:

- DEBUG
- INFO
- WARNING
- ERROR
- CRITICAL

رخدادهای عادی 400/403 نباید بدون دلیل Incident ایجاد کنند.

Severity ارسالی از Browser نباید به‌عنوان سطح قطعی Incident پذیرفته شود.

Impact باید بتواند بر اساس تعداد کاربران، تعداد سازمان‌ها، قابلیت تحت‌تأثیر و مدت اختلال محاسبه شود.

---

# 14. Browser SDK

یک Browser SDK عمومی بساز که بدون وابستگی به React یا Jupiter قابل استفاده باشد.

قابلیت‌ها:

- global error capture
- unhandled rejection capture
- API/network error hooks
- safe performance metrics
- connectivity detection
- offline queue
- retry/recovery
- event batching
- session correlation
- SDK configuration
- graceful shutdown

Configurable options:

- application
- environment
- endpoint
- auth provider
- release
- sampling
- queue limits
- retention
- enabled event categories
- user/tenant context provider

SDK باید کوچک و قابل tree-shaking باشد.

نباید برای هر رویداد حجم زیاد یا درخواست جداگانه ایجاد کند.

---

# 15. React Adapter

یک React Adapter جداگانه بساز.

قابلیت‌ها:

- Error Boundary integration
- unhandled exception reporting
- route-change context
- safe component error identification
- integration with existing API client
- optional feedback UI hooks

React Adapter باید فقط به Browser SDK وابسته باشد.

نباید به Jupiter Ticket یا Organization model وابسته شود.

---

# 16. Node.js / NestJS Adapter

یک Node.js SDK و NestJS Adapter طراحی کن.

قابلیت‌ها:

- exception capture
- request correlation
- trace propagation
- dependency failure logging
- structured background error capture
- safe instrumentation
- batching
- retry policy
- redaction

از Global Filters/Interceptors موجود استفاده کن.

قرارداد پاسخ API موجود را بی‌دلیل تغییر نده.

---

# 17. سازگاری با .NET و Python

در GOAL-069 الزام ساخت SDK کامل production برای تمام زبان‌ها وجود ندارد.

اما API عمومی باید واقعاً Technology-Neutral باشد.

Required deliverables:

- OpenAPI specification
- نمونه Client در C#
- نمونه Client در Python
- Authentication example
- Batch ingestion example
- Error handling example
- Retry guidance

نمونه‌ها باید قابل اجرا یا قابل اعتبارسنجی باشند.

هیچ وابستگی به Jupiter business code نداشته باشند.

---

# 18. Offline-First Storage

برای Browser SDK از IndexedDB استفاده کن.

از Cookies برای ذخیره Payload خطا یا Feedback استفاده نکن.

قابلیت‌ها:

- durable event ID
- safe local envelope
- retry count
- next retry time
- expiry
- bounded queue
- maximum payload size
- batch delivery
- acknowledgement
- duplicate prevention

اگر IndexedDB در دسترس نبود یا quota پر شد، SDK باید graceful degradation داشته باشد.

Logging failure نباید کل برنامه را خراب کند.

---

# 19. بازیابی خودکار پس از اتصال

Retry triggers:

- startup
- network restoration
- successful API connectivity probe
- tab visibility restoration
- next authenticated activity
- optional Background Sync

صرف `navigator.onLine` نشانه سلامت ارتباط با API نیست.

از exponential backoff و jitter استفاده کن.

فقط بعد از ACK معتبر سرور، رویداد از صف IndexedDB حذف شود.

ارسال مکرر یک eventId نباید چند رکورد تجاری ایجاد کند.

---

# 20. حفاظت از داده آفلاین

این بخش Critical است.

رویدادهای مربوط به:

- User A
- User B
- Tenant A
- Tenant B

نباید با هم مخلوط شوند.

رفتارهای زیر را صریح و تست‌شده تعریف کن:

- logout
- login as another user
- tenant switch
- expired session
- revoked access
- shared device usage

روی تغییر هویت، داده‌های باقیمانده نباید تحت هویت جدید ارسال شوند.

در صورت عدم امکان اعتبارسنجی مجدد با هویت اصلی، آن‌ها را به‌شکل امن حذف یا قرنطینه کن.

از ذخیره credential در IndexedDB خودداری کن.

---

# 21. Capturing Frontend Errors

ثبت خودکار:

- JavaScript errors
- Promise rejections
- React Error Boundary failures
- unexpected API failures
- selected connectivity events
- critical UI failures

از ثبت خودکار این موارد خودداری کن:

- raw DOM
- input values
- passwords
- raw form payload
- chat content
- ticket bodies
- user-uploaded documents
- full URLs containing sensitive query strings

Recursive error logging را کنترل کن.

خود Telemetry SDK نباید در شرایط شکست شبکه هزاران خطای مشابه ایجاد کند.

---

# 22. Backend and Worker Capture

خطاهای قابل ثبت:

- unexpected server exceptions
- database operation failures
- worker failures
- queue retries and terminal failures
- external service timeouts
- resource or processing anomalies

برای Worker فقط Metadata امن ذخیره شود.

Full job payload ذخیره نکن.

هر خطا باید بتواند با requestId و traceId مرتبط شود.

در صورت قطعی کامل PostgreSQL، سیستم نباید ادعا کند که همه خطاها در Database قابل ثبت هستند.

از fallback امن به structured stdout/logging استفاده کن تا External Monitoring بتواند آن‌ها را جمع‌آوری کند.

---

# 23. Distributed Tracing

الگوی OpenTelemetry-compatible را رعایت کن.

در صورت سازگاری از W3C Trace Context استفاده کن.

هدف:

```text
User Action
   ↓
Frontend Event
   ↓
HTTP Request
   ↓
Backend Processing
   ↓
Background Job / Dependency
   ↓
Error or Success
```

Operator باید بتواند زنجیره یک خطا را دنبال کند.

Trace ID و Request ID محرمانگی و tenant isolation را دور نزنند.

---

# 24. Ingestion Pipeline

Pipeline پیشنهادی:

```text
Receive
  ↓
Authenticate / Authorize
  ↓
Validate
  ↓
Enforce Limits
  ↓
Sanitize / Redact
  ↓
Normalize
  ↓
Deduplicate
  ↓
Persist
  ↓
Queue Aggregation
  ↓
Issue / Incident Evaluation
```

در صورت شکست Queue، رفتار باید محدود و قابل بازیابی باشد.

از dual-write غیراتمی که سبب از دست رفتن رویداد یا aggregation نامعتبر می‌شود اجتناب کن.

در صورت لزوم از transactional outbox یا مکانیزم durable موجود استفاده کن.

---

# 25. Ingestion Reliability

Required:

- strict validation
- bounded batch size
- bounded payload
- idempotency
- partial acknowledgement when applicable
- retry-safe persistence
- rate limiting
- backpressure
- abuse protection
- graceful service degradation

Telemetry collection نباید به مسیر اصلی ثبت تیکت یا سایر عملیات، latency سنگین تحمیل کند.

No unbounded memory queue.

No infinite retry loop.

---

# 26. Database Model

جداول منطقی مورد نیاز:

- ObservabilityApplication
- ObservabilityEnvironment
- ObservabilityCredential
- TelemetryEvent
- TelemetryIngestionReceipt
- ObservabilityIssue
- ObservabilityIncident
- IncidentActivity
- UserFeedback
- MonitoringRule
- MonitoringAlert
- AIInvestigation
- TelemetryAggregate
- OperationalAccessGrant

در صورت منطقی بودن می‌توان از PostgreSQL schema اختصاصی استفاده کرد.

Naming و migrationها باید با conventions پروژه سازگار باشند.

همه migrationها forward-only و data-safe باشند.

برای داده‌های tenant-scoped از RLS و authorization مناسب استفاده کن.

---

# 27. Multi-Application Isolation

تمام اطلاعات باید در مرزهای زیر تفکیک شوند:

```text
Application
  └── Environment
        └── Tenant
              └── Events / Feedback / Issues
```

شناسه Tenant یک نرم‌افزار نباید در نرم‌افزار دیگر معتبر تلقی شود.

مشاهده چندمحصولی فقط برای Operator مجاز و با scope مشخص امکان‌پذیر باشد.

هیچ cross-project export بدون authorization صریح مجاز نیست.

همه تغییرات حساس Audit شوند.

---

# 28. Access Control

Roleهای عملیاتی عمومی تعریف کن یا با RBAC موجود تطبیق بده.

نمونه:

- OBSERVABILITY_ADMIN
- OBSERVABILITY_OPERATOR
- OBSERVABILITY_ANALYST
- OBSERVABILITY_VIEWER

این roleها نباید مستقیماً به Jupiter Membershipهای سازمانی وابسته باشند.

Jupiter Platform Admin می‌تواند از طریق Adapter و Policy مشخص مجوز عملیاتی دریافت کند.

اما صرف داشتن دسترسی به یک Application نباید دسترسی خودکار به تمام Applicationها بدهد.

از implicit privilege escalation جلوگیری کن.

---

# 29. Privacy and Redaction

یک Redaction Layer مرکزی ایجاد کن.

به‌صورت پیش‌فرض ذخیره نکن:

- passwords
- cookies
- access/refresh tokens
- authentication headers
- private keys
- database connection strings
- payment secrets
- AI API keys
- raw HTTP request/response bodies
- ticket content
- attachment content
- chat content
- arbitrary personal information

از allowlist metadata استفاده کن.

Stack traceها قبل از ذخیره sanitize شوند.

Feedbackهای متنی سیاست محرمانگی جدا داشته باشند.

برای ارائه اطلاعات به AI، یک مرحله redaction مجدد انجام شود.

---

# 30. Fingerprinting

یک الگوریتم deterministic برای شناسایی خطاهای مشابه ایجاد کن.

ابعاد پیشنهادی:

- application
- environment
- service
- exception type
- error code
- normalized stack frame
- operation
- route template

شناسه‌های تصادفی، requestId، userId و tenantId نباید موجب Fingerprint متفاوت برای یک خطای مشابه شوند.

در عین حال نباید خطاهای نامرتبط صرفاً به دلیل متن مشابه در یک گروه قرار بگیرند.

Version الگوریتم Fingerprint را ثبت کن.

---

# 31. Issue Aggregation

خطاهای مشابه به یک Issue تجمیع شوند.

Issue باید شامل:

- fingerprint
- firstSeen
- lastSeen
- occurrenceCount
- affectedUsers
- affectedTenants
- affectedApplications
- affectedReleases
- severity
- impact
- currentStatus
- relatedEvents

باشد.

عدد eventها و تعداد کاربران یکتا نباید با هم اشتباه گرفته شوند.

در صورت مشاهده دوباره مشکل پس از Resolve، امکان Reopen یا Regression Detection فراهم باشد.

---

# 32. Incident Management

Lifecycle پیشنهادی:

```text
NEW
  ↓
TRIAGED
  ↓
INVESTIGATING
  ↓
MITIGATED
  ↓
RESOLVED
```

همچنین:

- REOPENED
- IGNORED / FALSE_POSITIVE

با transitions کنترل‌شده.

برای هر transition:

- actor
- timestamp
- reason
- activity history
- audit

ثبت کن.

AI می‌تواند اولویت یا وضعیت را پیشنهاد دهد؛ تغییر نهایی با Operator انسانی است.

---

# 33. Rule-Based Monitoring Engine

یک موتور تشخیص مستقل از AI طراحی کن.

قوانین اولیه:

- افزایش غیرعادی error rate
- burst خطای مشابه
- regression پس از release
- افزایش failure یک Business Operation
- کندی غیرعادی endpoint
- critical worker failure
- تکرار اختلال اتصال
- افزایش تعداد کاربران تحت‌تأثیر
- برگشت یک Issue حل‌شده

Thresholdها باید قابل تنظیم باشند.

برای جلوگیری از false alert:

- minimum sample size
- cooldown
- deduplication
- baseline comparison
- low-traffic handling

در نظر بگیر.

AI unavailable نباید Rule Engine را متوقف کند.

---

# 34. پایش نزدیک به لحظه واقعی

از Worker/BullMQ موجود برای aggregation و rule evaluation استفاده کن.

فاصله پیش‌فرض ارزیابی می‌تواند حدود یک دقیقه باشد، اما باید قابل تنظیم و محدود باشد.

برای نمایش تغییرات داشبورد، SSE موجود را در صورت مناسب بودن reuse کن.

اگر SSE در دسترس نبود، fallback polling کنترل‌شده داشته باش.

هر بار نمایش داشبورد نباید full database scan ایجاد کند.

---

# 35. User Feedback Subsystem

یک سیستم ثبت بازخورد واقعی بساز.

عنوان در UI:

**گزارش مشکل یا پیشنهاد**

کاربر بتواند موارد زیر را ثبت کند:

- گزارش باگ
- مشکل در استفاده
- پیشنهاد قابلیت
- انتقاد یا بازخورد
- سایر

فیلدها:

- category
- subject
- description
- optional related error reference
- optional diagnostic consent

این سیستم از Ticketing سازمانی Jupiter مستقل است.

بعد از ارسال موفق، tracking reference ارائه شود.

کاربر بتواند وضعیت گزارش‌های خودش را در صورت داشتن هویت معتبر مشاهده کند.

---

# 36. Feedback Offline Behavior

اگر کاربر هنگام قطع ارتباط Feedback ثبت کرد:

- امکان ذخیره موقت امن فراهم باشد؛
- وضعیت «در انتظار ارسال» نمایش داده شود؛
- ارسال به سرور صرفاً بعد از اتصال و احراز هویت معتبر انجام شود؛
- پس از ACK، وضعیت به «ثبت‌شده» تغییر کند.

به کاربر درباره نگهداری محلی متن بازخورد اطلاع بده.

از ذخیره خودکار نوشته‌های نیمه‌تمام و محتوای حساس بدون اقدام یا آگاهی کاربر خودداری کن.

---

# 37. Feedback and Issue Correlation

امکان ارتباط Feedback با Issue یا Incident وجود داشته باشد.

مثلاً:

یک کاربر گزارش می‌دهد:

«دکمه ثبت تیکت کار نمی‌کند.»

اگر همان زمان خطای مرتبط در API رخ داده باشد، سیستم بتواند آن‌ها را به یک Investigation مرتبط پیشنهاد کند.

این ارتباط باید دارای Evidence باشد.

از ادعای قطعی بدون شواهد جلوگیری کن.

---

# 38. Central Operations Console

یک کنسول مدیریتی مشترک طراحی کن.

میزبان اولیه UI می‌تواند Jupiter Platform Console باشد.

اما API و Data Model مستقل باشند.

عنوان فارسی:

**مرکز پایش هوشمند**

Navigation اصلی:

1. نمای کلی
2. پایش زنده
3. خطاها و Issues
4. Incidents
5. بازخورد کاربران
6. تحلیل و گزارش‌ها
7. تحلیلگر هوش مصنوعی
8. مدیریت برنامه‌ها
9. قوانین پایش
10. تنظیمات و نگهداری

---

# 39. Dashboard — Overview

نمای اصلی باید نشان دهد:

- error rate
- active incidents
- critical issues
- total affected users
- total affected tenants
- error trend
- application health
- recent releases
- high-impact problems
- latest AI findings

فیلترها:

- Application
- Environment
- Tenant where authorized
- Date/time range
- Severity
- Category
- Release

هر عدد باید از داده واقعی یا aggregate معتبر استخراج شود.

---

# 40. Live Monitor

نمای لحظه‌ای برای Operator.

نمایش:

- newest errors
- severity
- application
- environment
- affected operation
- event count
- first/last seen
- related issue
- correlation identifiers

قابلیت Pause و Resume نمایش زنده.

UI نباید در اثر افزایش حجم رویداد کند یا غیرقابل استفاده شود.

---

# 41. Issue Explorer

امکان:

- search
- filtering
- grouping
- sorting
- drill-down
- event timeline
- related feedback
- affected releases
- assign owner
- change status
- add internal note

وجود داشته باشد.

Raw data فقط در حد مجوز و پس از sanitization نمایش داده شود.

---

# 42. Incident Workspace

هر Incident صفحه مستقل داشته باشد.

بخش‌های ضروری:

- Summary
- Impact
- Timeline
- Related Issues
- Related Feedback
- Suspected Causes
- AI Findings
- Human Notes
- Assigned Operator
- Current Status
- Recommended Actions
- Audit History

نتایج تحلیل AI و تصمیم انسان باید کاملاً قابل تفکیک باشند.

---

# 43. Analytics and Data Mining

گزارش‌های قابل استفاده:

- error trends
- incidents over time
- issue recurrence
- most affected products
- most affected operations
- browser/device distribution
- release regression
- user impact
- tenant impact
- feedback trends
- resolution time
- frequently recurring causes

از aggregate و indexهای مناسب استفاده کن.

فیلترهای سنگین باید bounded باشند.

CSV Export مجاز، امن و دارای access control باشد.

امکان تحلیل بر اساس تاریخ و نسخه برنامه ضروری است.

---

# 44. AI Investigator

یک Agent تحلیلگر اختصاصی ایجاد کن.

نام:

**AI Investigator**

این Agent باید بتواند:

- خطاهای تکراری را شناسایی کند؛
- مجموعه خطاها را خلاصه کند؛
- ارتباط خطاهای Frontend و Backend را بررسی کند؛
- خطاهای مربوط به یک release را تحلیل کند؛
- الگوهای خرابی مشترک را تشخیص دهد؛
- بازخورد کاربران را با داده‌های فنی مرتبط کند؛
- علت احتمالی را پیشنهاد دهد؛
- سطح اطمینان تحلیل را مشخص کند؛
- اقدامات پیشنهادی برای رفع مشکل ارائه دهد؛
- گزارش روزانه و هفتگی تولید کند.

تحلیل‌ها باید مبتنی بر Evidence باشند.

هر فرضیه باید به eventId، issueId، incidentId یا داده تجمیعی مشخص ارجاع دهد.

اگر شواهد کافی نیست، Agent باید صریحاً اعلام کند.

---

# 45. AI Investigator Permissions

AI Investigator در V1 فقط Read-Only Analyzer است.

اجازه ندارد:

- کد را تغییر دهد؛
- commit یا push کند؛
- deploy انجام دهد؛
- SQL mutation اجرا کند؛
- secrets بخواند؛
- permissions را تغییر دهد؛
- کاربران را غیرفعال کند؛
- incidents را خودکار resolve کند؛
- داده‌های Business را اصلاح کند.

تمام توصیه‌های عملیاتی باید توسط انسان بررسی شوند.

---

# 46. AI Security and Prompt Injection

رویدادها و Feedbackهای کاربران Untrusted Input هستند.

متن خطا یا Feedback ممکن است حاوی دستور مخرب باشد.

AI نباید از دستورات داخل این محتوا پیروی کند.

برای AI:

- curated evidence
- bounded context
- schema-validated output
- explicit system instructions
- no arbitrary tool execution
- no unbounded queries
- no unrestricted raw data access

اعمال کن.

در صورت استفاده از AI provider خارجی، سیاست پردازش داده باید رعایت شود.

---

# 47. AI Multi-Application Isolation

AI باید بتواند یک Application را جداگانه تحلیل کند.

تحلیل بین‌محصولی فقط در صورتی مجاز است که Operator یا Policy اجازه آن را داده باشد.

Cross-application analysis باید از sanitized aggregates و داده‌های مجاز استفاده کند.

اطلاعات خصوصی یک Application نباید بدون authorization به Application دیگر یا Operator نامجاز منتقل شود.

---

# 48. AI Budget and Scheduling

تحلیل مستمر باید کنترل هزینه داشته باشد.

قابلیت‌ها:

- configurable analysis frequency
- per-application AI budget
- token/context limits
- deduplicated investigation jobs
- backoff on provider failure
- analysis usage reporting
- maximum concurrent investigations

پیشنهاد پیش‌فرض:

- Critical Incident: event-driven analysis
- Unresolved Issues: periodic review
- Operations Summary: daily
- Trend Summary: weekly

فاصله نمونه برای بررسی دوره‌ای می‌تواند پنج دقیقه باشد، اما باید قابل تنظیم باشد.

هر Raw Event نباید الزاماً یک AI Call ایجاد کند.

---

# 49. AI Commercial Separation

هزینه AI Investigator مربوط به Platform Operations است.

نباید از سهمیه تجاری مشتری در Jupiter یعنی:

`AI_SMART_ACTIONS`

مصرف کند.

از AI Gateway موجود در صورت مناسب بودن استفاده کن، اما accounting مستقل برای عملیات Observability داشته باش.

AI provider unavailable نباید:

- ingestion
- issue aggregation
- incident rules
- human dashboard
- user feedback

را متوقف کند.

---

# 50. Alerts and Notifications

سیستم باید هشدارهای زیر را پشتیبانی کند:

- Critical incident detected
- Abnormal error-rate spike
- High-impact issue
- Release regression
- Reopened critical issue
- Monitoring pipeline failure
- Critical worker failure
- Important user feedback

از Notification Infrastructure فعلی Jupiter در Adapter مربوط به Jupiter استفاده کن.

اما Alert Engine اصلی باید مستقل از Jupiter باشد.

Notificationهای تکراری را deduplicate کن.

از alert flood جلوگیری کن.

In-app alerting الزامی است.

Email/Webhook integration می‌تواند با configuration اختیاری ارائه شود.

---

# 51. Telemetry Self-Monitoring

خود Observability Hub باید قابل پایش باشد.

Metrics:

- ingestion rate
- ingestion failures
- rejected events
- dropped events
- offline recovery rate
- queue depth
- aggregation lag
- unresolved issues
- alert delivery failures
- AI failures
- storage growth
- retention lag

اگر ingestion pipeline خودش خراب شد، سیستم نباید صرفاً سکوت کند.

از structured logging و External Health Monitoring به‌عنوان لایه مکمل استفاده کن.

---

# 52. External Monitoring Boundary

Observability Hub نمی‌تواند به‌تنهایی خرابی کامل سرور میزبان خود را تشخیص داده و گزارش کند.

یک قرارداد و Runbook برای External Monitoring ایجاد کن.

حداقل:

- health endpoint
- readiness endpoint
- external probe compatibility
- error-rate metrics
- integration guidance

نصب کامل Staging monitoring همچنان تابع GOAL-059 است.

در GOAL-069 آن را به‌عنوان completed staging gate گزارش نکن.

---

# 53. Data Retention

Retention باید قابل تنظیم باشد.

مقادیر اولیه پیشنهادی:

| Data | Default |
|---|---|
| Raw telemetry | 30 days |
| Aggregated metrics | 12 months |
| Incident history | 180 days |
| User feedback | 180 days |

Retention باید per-Application policy داشته باشد.

اعمال Retention نباید existing security/business audit records را پاک کند.

Deletion job:

- idempotent
- safe
- bounded
- audited where appropriate

باشد.

---

# 54. Database Performance

PostgreSQL باید برای ثبت و گزارش‌گیری طراحی شود.

موارد ضروری:

- bounded metadata
- targeted indexes
- efficient time filtering
- optimized issue lookup
- aggregate tables
- pagination
- query limits
- safe retention

Partitioning زمانی را فقط در صورت توجیه واقعی حجم انتخاب کن.

از Full Table Scan مکرر برای Dashboard جلوگیری کن.

---

# 55. Failure Isolation

Observability failure نباید باعث شکست عملیات اصلی Jupiter شود.

مثال:

اگر ارسال Telemetry شکست خورد، ساخت تیکت نباید فقط به همین دلیل ناموفق شود.

Required:

- bounded asynchronous processing
- retry with limits
- circuit-breaker/backoff where justified
- no recursive logging
- no unlimited memory growth
- graceful fallback
- worker isolation

هیچ تغییر عملیاتی نباید باعث double-charge شدن AI یا Duplicate Business Effects شود.

---

# 56. Authentication and Authorization Testing

تست‌ها باید ثابت کنند:

- anonymous cannot access operational console
- tenant user cannot read platform telemetry
- Application A cannot read Application B private telemetry
- Application A cannot submit trusted events as B
- browser cannot forge trusted actor
- expired ingestion credential rejected
- revoked credential rejected
- unauthorized exports rejected
- forbidden incidents not disclosed
- feedback visibility correctly scoped
- Platform operational roles enforce scope

CORS را به‌عنوان تنها مکانیسم امنیتی استفاده نکن.

---

# 57. Offline Browser Testing

سناریوهای الزامی:

1. Normal event submission
2. Network disconnect
3. Event stored in IndexedDB
4. Reload while offline
5. Reconnection
6. Batch replay
7. Server acknowledgement
8. Exactly-once event persistence through idempotency
9. Local queue cleanup after ACK
10. Retry with backoff
11. Tenant switch
12. Logout
13. Login as different user
14. IndexedDB unavailable
15. Storage quota exceeded
16. Queue expiration
17. Offline feedback submission
18. Duplicate feedback replay
19. Unauthorized replay rejection
20. Safe discard/quarantine of incompatible offline identity

تست‌ها باید با Browser و Network Interception انجام شوند، نه فقط Mock Function Calls.

---

# 58. Cross-Domain Error Scenarios

با fixtureهای کنترل‌شده تست کن:

- React render failure
- unexpected API exception
- failed ticket creation
- authentication failure
- organization configuration failure
- AI provider failure
- Assist failure
- Directory job failure
- background worker failure
- external dependency timeout

اثبات کن که هر خطای مرتبط قابل مشاهده و دسته‌بندی است.

Expected business rejectionها نباید بی‌دلیل Incident بحرانی شوند.

---

# 59. Mandatory Reusability Acceptance

این بخش مهم‌ترین شرط استقلال معماری است.

یک Reference Application دوم ایجاد کن.

این Application نباید Jupiter Business Modules را import کند.

نام پیشنهادی:

`Observability Reference Client`

Required flow:

1. Register Application B.
2. Configure its independent environment.
3. Connect Browser SDK.
4. Connect backend through public ingestion contract.
5. Generate a frontend error.
6. Generate a backend error.
7. Generate a user feedback item.
8. Disconnect network.
9. Save an event offline.
10. Restore connectivity.
11. Replay event idempotently.
12. Verify event in central database.
13. Verify independent Issue aggregation.
14. Verify dashboard Application selection.
15. Verify Application A/B isolation.
16. Verify AI investigation on Application B.
17. Verify no Jupiter-specific business dependency.

بدون عبور این Acceptance، Reusable Architecture را کامل اعلام نکن.

---

# 60. Developer Integration Experience

برای تیم‌های توسعه آینده یک راهنمای عملی ایجاد کن.

Documentation باید نشان دهد:

- How to register an Application
- How to configure environments
- How to obtain permitted credentials
- How to install Browser SDK
- How to use React Adapter
- How to integrate NestJS
- How to call API from .NET
- How to call API from Python
- How to configure offline queue
- How to submit a custom business event
- How to report user feedback
- How to correlate requests
- How to query incidents
- How to configure access permissions

یک مثال حداقلی از initialization در TypeScript ارائه کن.

این مثال باید با SDK واقعی ساخته‌شده مطابقت داشته باشد؛ API خیالی ننویس.

---

# 61. Release and SDK Versioning

برای قراردادها و SDKها Versioning مشخص کن.

Required:

- versioned event schema
- stable public ingestion contract
- compatibility policy
- SDK semantic versioning
- migration strategy
- backward-compatible additive changes
- explicit breaking-change policy

Server باید بتواند حداقل نسخه فعلی و یک نسخه سازگار قبلی قرارداد را در شرایطی که تعریف شده پشتیبانی کند.

نسخه‌های SDK و Server را قابل ردیابی نگه دار.

---

# 62. Persian RTL Design

تمام UIهای Jupiter طبق Design System V2 باشند.

Required:

- Persian-first
- RTL
- current Jupiter primary theme
- Shabnam / Vazirmatn fallback
- responsive layouts
- accessible error/status indications
- no document-level horizontal overflow

Browser acceptance:

- 375 px
- 768 px
- 1024 px
- 1440 px

جداول حجیم می‌توانند scroll داخلی داشته باشند.

فیلترها، Modalها، Popoverها و صفحات جزئیات باید در موبایل قابل استفاده باشند.

---

# 63. Product Help

از موتور نسخه‌بندی‌شده Help موجود Jupiter استفاده کن.

مقالات فارسی مورد نیاز:

- گزارش مشکل یا پیشنهاد
- گزارش آفلاین و وضعیت ارسال
- مرکز پایش هوشمند
- تعریف Event / Issue / Incident
- Severity and Impact
- مدیریت Incident
- ثبت و مدیریت Application
- تحلیل هوش مصنوعی
- محدودیت‌های AI
- حریم خصوصی و Retention
- اتصال نرم‌افزار جدید به Observability Hub

Help جدید باید واقعاً publish و در رابط کاربری قابل دسترسی باشد.

---

# 64. Performance Acceptance

عملکرد واقعی را اندازه بگیر.

موارد:

- ingestion throughput
- API overhead
- event batch processing
- issue aggregation latency
- dashboard query latency
- offline queue storage behavior
- retention execution
- worker resource usage
- AI job scheduling

هیچ عدد ساختگی گزارش نکن.

هدف این است که پایش خطا موجب کندی محسوس عملیات اصلی Jupiter نشود.

اگر Staging در دسترس نیست، نتایج Local را با برچسب LOCAL ثبت کن.

---

# 65. Security Acceptance

حداقل تست‌های امنیتی:

- secret redaction
- raw payload exclusion
- prompt injection resistance
- log injection resistance
- cross-tenant denial
- cross-application denial
- forged identity rejection
- revoked key rejection
- oversized event rejection
- rate-limit enforcement
- duplicate event protection
- unauthorized feedback access
- export restrictions
- safe CSV generation
- telemetry failure isolation
- retention access boundaries
- credential non-disclosure
- offline identity isolation

هیچ shortcut امنیتی برای عبور تست‌ها ایجاد نکن.

---

# 66. Implementation Phases

داخل همین GOAL-069 مراحل داخلی زیر را اجرا کن:

### Phase A — Audit and Architecture
Inventory، boundaries، contracts، decisions.

### Phase B — Reusable Foundation
Core packages، Event contracts، Application Registry، Ingestion security.

### Phase C — Persistence and Capture
PostgreSQL، Frontend، Backend، Worker instrumentation.

### Phase D — Offline Recovery
IndexedDB queue، retry، idempotency، identity isolation.

### Phase E — Issue and Incident Engine
Fingerprinting، grouping، lifecycle، rule-based monitoring.

### Phase F — Operations Console
Overview، Live Monitor، Issues، Incidents، Feedback، Analytics.

### Phase G — AI Investigator
AI integration، evidence-grounded analysis، budget، scheduling، security.

### Phase H — Multi-Application Validation
Independent reference client، generic API، isolation، portability.

### Phase I — Final Acceptance
Security، performance، browser E2E، Help، documentation، cleanup.

این Phaseها Goal مستقل نیستند.

هیچ Phase کامل‌نشده‌ای را در Final Report پنهان نکن.

---

# 67. Evidence

Create:

`docs/GOAL_069_EVIDENCE.md`

Required sections:

1. Initial Architecture Inventory
2. Product-Agnostic Architecture
3. Package Boundaries
4. Application Registry
5. Event Contract
6. OpenAPI
7. SDK Authentication Model
8. Database Model
9. Migrations
10. Tenant and Application Isolation
11. Frontend SDK
12. React Adapter
13. Backend SDK
14. NestJS Adapter
15. .NET/Python Integration Examples
16. Offline IndexedDB
17. Retry and Idempotency
18. Privacy and Redaction
19. Distributed Correlation
20. Ingestion Reliability
21. Fingerprinting
22. Issue Engine
23. Incident Lifecycle
24. Monitoring Rules
25. Operations Dashboard
26. Feedback
27. Analytics
28. AI Investigator
29. AI Security
30. AI Budget
31. Notifications
32. Retention
33. Telemetry Self-Health
34. Independent Reference Application
35. Reusability Acceptance
36. Cross-Application Isolation
37. Offline Browser Tests
38. Security Tests
39. Performance Measurements
40. Browser Responsive Acceptance
41. Help Publication
42. Known Limitations
43. Defects Found
44. Defects Fixed
45. Cleanup
46. Quality Gates
47. Final Verdict

در هر بخش:

- Implementation path
- Tests executed
- Actual result
- Limitations

را ثبت کن.

---

# 68. Project Brain

Update:

- `.ai/ARCHITECTURE.md`
- `.ai/DOMAIN_MODEL.md`
- `.ai/SECURITY.md`
- `.ai/BUSINESS_RULES.md`
- `.ai/DECISIONS.md`
- `.ai/DESIGN_SYSTEM.md` where relevant
- `.ai/CURRENT_STATE.md`
- `.ai/NEXT_TASK.md`
- `.ai/CHANGELOG.md`
- `.ai/UPGRADE_MASTER_PLAN.md`

در Project Brain صریحاً ثبت کن:

GOAL-059 همچنان BLOCKED است.

GOAL-069 به دستور Product Owner، به‌عنوان توسعه یک قابلیت جدید آغاز شده است.

پذیرش Local GOAL-069 به معنی پذیرش Staging GOAL-059 نیست.

---

# 69. Quality Gates

قبل از اعلام Completion اجرا کن:

- all API tests
- all Web tests
- SDK package tests
- ingestion tests
- database migration rehearsal
- RLS isolation tests
- multi-application isolation tests
- offline/replay browser tests
- API typecheck
- Web typecheck
- SDK typecheck
- production builds
- authenticated browser acceptance
- responsive acceptance
- security regression
- performance validation
- `git diff --check`

تمام شکست‌ها را گزارش و defectهای واقعی را اصلاح کن.

---

# 70. Definition of Done

GOAL-069 فقط زمانی COMPLETE است که:

- هسته Observability واقعاً مستقل از Jupiter باشد.
- SDK عمومی Browser ساخته شده باشد.
- React Adapter کار کند.
- Node/NestJS Adapter کار کند.
- HTTPS/JSON ingestion API عملیاتی باشد.
- OpenAPI واقعی موجود باشد.
- چند Application مستقل قابل ثبت باشند.
- احراز هویت و تفکیک داده‌ها معتبر باشد.
- خطاهای Frontend ثبت شوند.
- خطاهای Backend ثبت شوند.
- خطاهای Worker ثبت شوند.
- درخواست‌های مرتبط قابل Trace باشند.
- IndexedDB offline queue کار کند.
- ارسال مجدد idempotent باشد.
- Logout/Tenant Switch امنیت داده آفلاین را حفظ کند.
- رویدادها در PostgreSQL ذخیره شوند.
- Issue aggregation واقعی کار کند.
- Incident management واقعی کار کند.
- Rule-based monitoring فعال باشد.
- User Feedback عملیاتی باشد.
- Dashboard و Analytics واقعی کار کنند.
- AI Investigator شواهد معتبر ارائه دهد.
- AI read-only و budget-bounded باشد.
- Notification و Alert dedupe کار کند.
- Retention و Redaction تست شده باشند.
- Observability failure باعث خرابی عملیات اصلی نشود.
- Reference Application مستقل از Jupiter تست شده باشد.
- تفکیک Application A/B اثبات شده باشد.
- Browser acceptance در تمام viewportها پاس شود.
- Help فارسی منتشر شده باشد.
- Evidence کامل باشد.
- همه Quality Gateها موفق باشند.

**اگر حتی یک قابلیت اساسی فوق پیاده‌سازی یا تست نشده باشد، Goal را COMPLETE اعلام نکن.**

---

# 71. Prohibited Shortcuts

این موارد ممنوع‌اند:

- ساخت یک Logger ساده و اعلام اتمام Goal
- ایجاد UI نمایشی بدون داده Backend واقعی
- ایجاد AI Summary بدون Evidence
- استفاده از Mock به‌جای تست integration ضروری
- وابسته کردن Core به Jupiter domain models
- ذخیره raw sensitive payload
- استفاده از localStorage/cookies برای نگهداری secret
- اتکا به CORS به‌جای Authentication
- ادعای Exactly-Once Delivery بدون idempotent persistence
- ادعای Guaranteed Offline Recovery
- تغییر خودکار کد توسط AI
- آغاز GOAL بعدی بدون پذیرش مستقل
- مخفی کردن blocker
- ادعای Staging PASS بر اساس Local Test

---

# 72. Commit and Push — Mandatory

Work باید خودش commit و push کند.

از کاربر نخواهد دستی push کند.

قبل از commit:

- `git status`
- بررسی فایل‌های تغییرکرده
- Secret Scan
- بررسی `.gitignore`
- بررسی عدم ورود فایل‌های credential
- final tests
- `git diff --check`

فایل زیر هرگز نباید commit شود:

`securedata/secureinfo.md`

همچنین هیچ Secret یا credential واقعی دیگری نباید وارد Repository شود.

اگر Goal COMPLETE شد:

Commit message:

`GOAL-069 — Reusable Observability and AI Operations Platform`

اگر بخشی از Goal تکمیل نشده اما Evidence قابل ثبت است:

`GOAL-069 IN PROGRESS — Observability implementation`

یا:

`GOAL-069 BLOCKED — Observability acceptance blockers`

سپس:

- Push به `origin/main` با مجوزهای موجود
- بدون Force Push
- Verify remote SHA
- گزارش Commit SHA نهایی

اگر Push شکست خورد، موفقیت آن را ادعا نکن.

---

# 73. Final Work Report

در پایان دقیقاً گزارش کن:

1. Final Goal Status
2. Architecture implemented
3. Reusable packages created
4. Public APIs implemented
5. Application Registry
6. Security/Auth model
7. Frontend capture
8. Backend/Worker capture
9. Offline IndexedDB recovery
10. Idempotent ingestion
11. PostgreSQL schema
12. Data isolation
13. Distributed correlation
14. Issue Engine
15. Incident Engine
16. Monitoring Rules
17. Feedback
18. Operations Dashboard
19. Analytics/Exports
20. AI Investigator
21. AI Budget/Permissions
22. Alerts
23. Retention/Privacy
24. Reference Application results
25. .NET/Python integration readiness
26. API test count
27. Web test count
28. SDK test count
29. Browser acceptance
30. Security acceptance
31. Performance results
32. Help publication
33. Defects found/fixed
34. Known limitations
35. Remaining blockers
36. Evidence path
37. Final Commit SHA
38. Remote Push Verification

پس از گزارش توقف کن.

GOAL بعدی را آغاز نکن.

منتظر ممیزی مستقل و پذیرش توسط Product Owner بمان.

**Final Acceptance Principle:**

Deliver a production-quality, reusable Observability Platform with Jupiter as its first real consumer, and prove through an independent second application that the architecture is genuinely reusable.
