import { FormEvent, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { Actor } from "./App";
import { request } from "./App";
import { Alert, ConfirmDialog, LoadingState, SectionHeader } from "./ui";
import { PlatformCommercial } from "./PlatformCommercial";
import { PlatformAppearance } from "./PlatformAppearance";
import { PlatformHelpAdmin } from "./PlatformHelpAdmin";
import { OperationsPanel } from "./OperationsWorkspace";
import {
  normalizePlatformSearch,
  paginatePlatformItems,
  PlatformFilterToolbar,
  PlatformNoResults,
  PlatformPagination,
  usePlatformListState,
} from "./PlatformAdminUi";

type Organization = {
  id: string;
  name: string;
  slug: string;
  status: "setup" | "active" | "suspended" | "archived";
  workspace_type?: "ORGANIZATION" | "PERSONAL";
  created_at: string;
  archived_at?: string | null;
  archive_reason?: string | null;
};
type User = {
  id: string;
  email: string;
  display_name: string;
  is_platform_admin: boolean;
  is_active: boolean;
};
type AiSetting = {
  organizationId: string;
  name: string;
  slug: string;
  workspaceType: "ORGANIZATION" | "PERSONAL";
  enabled: boolean;
  smartIntakeEnabled: boolean;
  providerBaseUrl: string;
  analysisModel: string;
  transcriptionModel: string;
  hasApiKey: boolean;
  updatedAt?: string;
  requestCount: number;
  tokenCount: number;
};
type Audit = {
  id: string;
  action: string;
  organization_name?: string;
  actor_display_name?: string;
  created_at: string;
};
type ApplicationStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "NEEDS_INFORMATION"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";
type PlatformApplication = {
  id: string;
  organizationName: string;
  preferredSlug: string | null;
  contactName: string;
  contactPhone: string | null;
  details: Record<string, unknown>;
  status: ApplicationStatus;
  submittedAt: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  assignedSlug: string | null;
  applicant: { email: string | null; displayName: string };
};
const applicationLabel: Record<ApplicationStatus, string> = {
  SUBMITTED: "ارسال‌شده",
  UNDER_REVIEW: "در حال بررسی",
  NEEDS_INFORMATION: "نیازمند اطلاعات",
  APPROVED: "تأییدشده",
  REJECTED: "ردشده",
  CANCELLED: "لغوشده",
};
const reviewKey = () => crypto.randomUUID();

export async function beginPlatformApplicationReview(
  actor: Actor,
  application: PlatformApplication,
  performRequest: typeof request = request,
  keyFactory: () => string = reviewKey,
) {
  await performRequest(
    `/platform/organization-applications/${application.id}/start-review`,
    actor.session,
    actor.organizationId,
    { method:"POST", headers:{"idempotency-key":keyFactory()} },
  );
  return { ...application, status:"UNDER_REVIEW" as const };
}
const platformTabs = [
  ["overview", "نمای کلی", "نمای کلی"],
  ["orgs", "سازمان‌ها", "سازمان‌ها و دسترسی"],
  ["applications", "درخواست‌های سازمان", "سازمان‌ها و دسترسی"],
  ["users", "کاربران پلتفرم", "سازمان‌ها و دسترسی"],
  ["commercial", "تجاری", "سرویس‌ها"],
  ["ai", "سیاست AI", "سرویس‌ها"],
  ["observability", "مرکز پایش هوشمند", "سرویس‌ها"],
  ["appearance", "ظاهر و هویت بصری", "تنظیمات پلتفرم"],
  ["help", "راهنمای محصول", "تنظیمات پلتفرم"],
  ["audit", "ردپای ممیزی", "تنظیمات پلتفرم"],
] as const;
type PlatformTab = (typeof platformTabs)[number][0];
const platformGroups = ["نمای کلی", "سازمان‌ها و دسترسی", "سرویس‌ها", "تنظیمات پلتفرم"] as const;
const isPlatformTab = (value: string | null): value is PlatformTab =>
  platformTabs.some(([candidate]) => candidate === value);

export function PlatformPro({ actor }: { actor: Actor }) {
  const [params, setParams] = useSearchParams();
  const requestedTab = params.get("section");
  const tab: PlatformTab = isPlatformTab(requestedTab) ? requestedTab : "overview";
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [applications, setApplications] = useState<PlatformApplication[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState<AiSetting[]>([]);
  const [audit, setAudit] = useState<Audit[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const organizationTenants = organizations.filter(
    (item) => item.workspace_type !== "PERSONAL",
  );
  const selectTab = (next: PlatformTab) => {
    const nextParams = new URLSearchParams(params);
    if (next === "overview") nextParams.delete("section");
    else nextParams.set("section", next);
    setParams(nextParams, { replace: false });
    setError("");
  };
  const moveTab = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    value: PlatformTab,
  ) => {
    const index = platformTabs.findIndex(([candidate]) => candidate === value);
    const delta =
      event.key === "ArrowLeft" || event.key === "ArrowUp"
        ? -1
        : event.key === "ArrowRight" || event.key === "ArrowDown"
          ? 1
          : 0;
    let next: PlatformTab | undefined;
    if (event.key === "Home") next = platformTabs[0][0];
    if (event.key === "End") next = platformTabs[platformTabs.length - 1][0];
    if (delta)
      next =
        platformTabs[
          (index + delta + platformTabs.length) % platformTabs.length
        ][0];
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      next = value;
    }
    if (next) {
      event.preventDefault();
      selectTab(next);
      requestAnimationFrame(() =>
        document.getElementById(`platform-tab-${next}`)?.focus(),
      );
    }
  };
  const load = () =>
    Promise.allSettled([
      request(
        "/admin/platform/organizations",
        actor.session,
        actor.organizationId,
      ),
      request(
        "/platform/organization-applications",
        actor.session,
        actor.organizationId,
      ),
      request("/admin/platform/users", actor.session, actor.organizationId),
      request("/platform/ai-settings", actor.session, actor.organizationId),
      request(
        "/platform/ai-settings/audit",
        actor.session,
        actor.organizationId,
      ),
    ])
      .then((results) => {
        const setters = [setOrganizations, setApplications, setUsers, setSettings, setAudit] as const;
        const failures: string[] = [];
        results.forEach((result, index) => {
          if (result.status === "fulfilled") setters[index](result.value as never);
          else failures.push(result.reason instanceof Error ? result.reason.message : "دریافت بخشی از اطلاعات ناموفق بود.");
        });
        setError(failures.join(" "));
      })
      .finally(() => setLoading(false));
  useEffect(() => {
    void load();
  }, [actor.session.accessToken]);
  const saved = (message: string) => {
    setNotice(message);
    void load();
  };
  return (
    <section className="page platform-pro">
      <div className="page-intro">
        <div>
          <p className="eyebrow">مدیریت پلتفرم</p>
          <h2>کنترل امن سرویس و سازمان‌ها</h2>
          <p>
            دسترسی‌ها، وضعیت سازمان‌ها و استفاده از هوش مصنوعی در سطح پلتفرم
            مدیریت می‌شوند.
          </p>
        </div>
      </div>
      <label className="platform-tab-selector">
        بخش مدیریت پلتفرم
        <select value={tab} onChange={(event) => selectTab(event.target.value as PlatformTab)}>
          {platformGroups.map((group) => (
            <optgroup key={group} label={group}>
              {platformTabs.filter(([, , candidate]) => candidate === group).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
      <div className="platform-admin-workspace">
        <nav className="platform-admin-nav" aria-label="بخش‌های مدیریت پلتفرم">
          {platformGroups.map((group) => (
            <div key={group}>
              <p>{group}</p>
              {platformTabs.filter(([, , candidate]) => candidate === group).map(([value, label]) => (
                <button
                  type="button"
                  id={`platform-tab-${value}`}
                  key={value}
                  className={tab === value ? "active" : ""}
                  aria-current={tab === value ? "page" : undefined}
                  onClick={() => selectTab(value)}
                  onKeyDown={(event) => moveTab(event, value)}
                >{label}</button>
              ))}
            </div>
          ))}
        </nav>
        <div className="platform-admin-content">
      {notice && (
        <Alert variant="success">{notice}</Alert>
      )}
      {error && (
        <Alert variant="danger">{error}</Alert>
      )}
      {loading && <LoadingState label="در حال آماده‌سازی مدیریت پلتفرم…" />}
      {!loading && tab === "overview" && (
        <PlatformOverview organizations={organizations} applications={applications} users={users} settings={settings} audit={audit} onNavigate={selectTab} />
      )}
      {tab === "orgs" && (
        <Organizations
          actor={actor}
          organizations={organizations}
          onSaved={saved}
          onError={setError}
        />
      )}{" "}
      {tab === "applications" && (
        <PlatformApplications
          actor={actor}
          applications={applications}
          onSaved={saved}
          onError={setError}
        />
      )}{" "}
      {tab === "commercial" && (
        <PlatformCommercial
          actor={actor}
          organizations={organizationTenants}
          users={users}
          onSaved={saved}
          onError={setError}
        />
      )}{" "}
      {tab === "appearance" && (
        <PlatformAppearance actor={actor} onSaved={saved} onError={setError} />
      )}{" "}
      {tab === "observability" && <OperationsPanel/>}
      {tab === "help" && (
        <PlatformHelpAdmin actor={actor} onSaved={saved} onError={setError} />
      )}{" "}
      {tab === "users" && (
        <PlatformUsers
          actor={actor}
          users={users}
          onSaved={saved}
          onError={setError}
        />
      )}{" "}
      {tab === "ai" && (
        <AiPolicies
          actor={actor}
          settings={settings}
          onSaved={saved}
          onError={setError}
        />
      )}{" "}
      {tab === "audit" && <AuditList audit={audit} />}
        </div>
      </div>
    </section>
  );
}

function PlatformOverview({ organizations, applications, users, settings, audit, onNavigate }: {
  organizations: Organization[];
  applications: PlatformApplication[];
  users: User[];
  settings: AiSetting[];
  audit: Audit[];
  onNavigate: (tab: PlatformTab) => void;
}) {
  const pendingApplications = applications.filter((item) => ["SUBMITTED", "UNDER_REVIEW", "NEEDS_INFORMATION"].includes(item.status)).length;
  const suspendedOrganizations = organizations.filter((item) => item.status === "suspended" || item.status === "archived").length;
  const inactiveUsers = users.filter((item) => !item.is_active).length;
  const missingAiKeys = settings.filter((item) => item.enabled && !item.hasApiKey).length;
  const metrics = [
    ["سازمان‌ها", organizations.length, "orgs"],
    ["درخواست‌های نیازمند اقدام", pendingApplications, "applications"],
    ["سازمان‌های متوقف", suspendedOrganizations, "orgs"],
    ["کاربران غیرفعال", inactiveUsers, "users"],
    ["AI فعال بدون کلید", missingAiKeys, "ai"],
  ] as const;
  return (
    <div className="admin-stack platform-overview">
      <section className="card">
        <SectionHeader title="وضعیت عملیاتی پلتفرم" description="نمای فشرده‌ای از موارد مهم؛ برای رسیدگی وارد بخش مربوط شوید." as="h3" />
        <div className="platform-metrics">
          {metrics.map(([label, value, target]) => (
            <button key={label} type="button" className="platform-metric" onClick={() => onNavigate(target)}>
              <span>{label}</span><strong>{value.toLocaleString("fa-IR")}</strong><small>مشاهده و رسیدگی</small>
            </button>
          ))}
        </div>
      </section>
      <section className="card">
        <SectionHeader title="آخرین رویدادها" description="پنج رویداد اخیر ثبت‌شده در سطح پلتفرم" action={<button type="button" className="secondary" onClick={() => onNavigate("audit")}>مشاهدهٔ همه</button>} as="h3" />
        <ul className="platform-recent-events">
          {audit.slice(0, 5).map((item) => <li key={item.id}><span>{item.action}</span><small>{item.organization_name ?? "پلتفرم"} · {new Date(item.created_at).toLocaleString("fa-IR")}</small></li>)}
          {!audit.length && <li className="hint">رویدادی ثبت نشده است.</li>}
        </ul>
      </section>
    </div>
  );
}

function PlatformApplications({
  actor,
  applications,
  onSaved,
  onError,
}: {
  actor: Actor;
  applications: PlatformApplication[];
  onSaved: (message: string) => void;
  onError: (message: string) => void;
}) {
  const listState = usePlatformListState("application");
  const [selected, setSelected] = useState<PlatformApplication | null>(null);
  const [note, setNote] = useState("");
  const [slug, setSlug] = useState("");
  const [busy, setBusy] = useState(false);
  const reviewRef = useRef<HTMLElement | null>(null);
  const filtered = applications.filter((application) => {
    const query = normalizePlatformSearch(listState.query);
    const haystack = normalizePlatformSearch(`${application.organizationName} ${application.contactName} ${application.applicant.email ?? ""} ${application.preferredSlug ?? ""} ${application.assignedSlug ?? ""}`);
    return (!query || haystack.includes(query)) && (listState.status === "ALL" || application.status === listState.status);
  });
  const paged = paginatePlatformItems(filtered, listState.page, listState.pageSize);
  const open = (application: PlatformApplication) => {
    setSelected(application);
    setNote(application.reviewNote ?? "");
    setSlug(application.assignedSlug ?? application.preferredSlug ?? "");
    requestAnimationFrame(() => reviewRef.current?.scrollIntoView({behavior:"smooth",block:"start"}));
  };
  const startReview = async (application: PlatformApplication) => {
    setBusy(true);
    try {
      open(await beginPlatformApplicationReview(actor,application));
      onSaved("بررسی درخواست آغاز شد.");
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : "شروع بررسی ناموفق بود.");
    } finally {
      setBusy(false);
    }
  };
  const perform = async (
    action: "start-review" | "request-information" | "reject" | "approve",
  ) => {
    if (!selected) return;
    setBusy(true);
    try {
      const body =
        action === "approve"
          ? { slug, note: note || undefined }
          : action === "start-review"
            ? undefined
            : { note };
      await request(
        `/platform/organization-applications/${selected.id}/${action}`,
        actor.session,
        actor.organizationId,
        {
          method: "POST",
          headers: { "idempotency-key": reviewKey() },
          body: body ? JSON.stringify(body) : undefined,
        },
      );
      setSelected(null);
      onSaved(
        action === "approve"
          ? "سازمان در وضعیت راه‌اندازی ایجاد و مالک اولیه تعیین شد."
          : "وضعیت درخواست به‌روزرسانی شد.",
      );
    } catch (cause) {
      onError(
        cause instanceof Error
          ? cause.message
          : "به‌روزرسانی درخواست ناموفق بود.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="admin-stack">
      <section className="card">
        <SectionHeader title="صف درخواست‌های سازمان" description="تأیید فقط پس از بررسی انجام می‌شود و سازمان تازه را در وضعیت «راه‌اندازی» ایجاد می‌کند." as="h3" />
        <PlatformFilterToolbar
          state={listState}
          searchLabel="جست‌وجوی درخواست"
          searchPlaceholder="نام سازمان، متقاضی، ایمیل یا Slug"
          statusOptions={Object.entries(applicationLabel).map(([value, label]) => ({ value, label }))}
          resultCount={filtered.length}
        />
        <div className="table-wrap responsive-platform-table">
          <table>
            <thead>
              <tr>
                <th>سازمان</th>
                <th>متقاضی</th>
                <th>وضعیت</th>
                <th>شناسهٔ درخواستی/تخصیصی</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paged.items.map((application) => (
                <tr key={application.id}>
                  <td data-label="سازمان">
                    {application.organizationName}
                    <small className="table-subtitle">
                      {application.contactName}
                    </small>
                  </td>
                  <td data-label="متقاضی" dir="ltr">{application.applicant.email ?? "—"}</td>
                  <td data-label="وضعیت">
                    <span
                      className={`status-pill ${application.status.toLowerCase()}`}
                    >
                      {applicationLabel[application.status]}
                    </span>
                  </td>
                  <td data-label="شناسه" dir="ltr">
                    {application.assignedSlug ??
                      application.preferredSlug ??
                      "—"}
                  </td>
                  <td data-label="عملیات">
                    <button
                      className="secondary"
                      type="button"
                      disabled={busy}
                      onClick={() => application.status === "SUBMITTED" ? void startReview(application) : open(application)}
                    >
                      {application.status === "SUBMITTED"
                        ? "شروع بررسی"
                        : application.status === "UNDER_REVIEW"
                          ? "ادامه بررسی"
                          : "مشاهده"}
                    </button>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td className="empty-row" colSpan={5}><PlatformNoResults filtered={Boolean(listState.query || listState.status !== "ALL")} empty="درخواستی برای بررسی وجود ندارد" /></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <PlatformPagination state={{ ...listState, page: paged.page }} totalItems={filtered.length} />
      </section>
      {selected && (
        <section ref={reviewRef} className="card platform-application-review" tabIndex={-1}>
          <div className="ui-section-header">
            <div>
              <h3>{selected.organizationName}</h3>
              <p>
                {selected.applicant.displayName} ·{" "}
                <span dir="ltr">{selected.applicant.email}</span>
              </p>
            </div>
            <button
              type="button"
              className="secondary"
              onClick={() => setSelected(null)}
            >
              بستن
            </button>
          </div>
          <dl className="summary-list">
            <div>
              <dt>وضعیت</dt>
              <dd>{applicationLabel[selected.status]}</dd>
            </div>
            <div>
              <dt>شماره تماس</dt>
              <dd dir="ltr">{selected.contactPhone ?? "—"}</dd>
            </div>
            <div>
              <dt>توضیحات</dt>
              <dd>
                {typeof selected.details.description === "string"
                  ? selected.details.description
                  : "—"}
              </dd>
            </div>
          </dl>
          {selected.status === "SUBMITTED" && (
            <div className="inline-actions">
              <button
                type="button"
                onClick={() => void perform("start-review")}
                disabled={busy}
              >
                شروع بررسی
              </button>
            </div>
          )}
          {selected.status === "UNDER_REVIEW" && (
            <>
              <label>
                پیام برای متقاضی
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={3}
                  maxLength={1000}
                  placeholder="برای درخواست اطلاعات یا رد، این پیام الزامی است."
                />
              </label>
              <label>
                شناسهٔ تخصیص‌داده‌شده برای تأیید
                <input
                  dir="ltr"
                  value={slug}
                  onChange={(event) =>
                    setSlug(event.target.value.toLowerCase())
                  }
                  pattern="[a-z0-9-]{3,63}"
                  placeholder="acme-support"
                />
              </label>
              <div className="inline-actions">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => void perform("request-information")}
                  disabled={busy || !note.trim()}
                >
                  درخواست اطلاعات
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => void perform("reject")}
                  disabled={busy || !note.trim()}
                >
                  رد درخواست
                </button>
                <button
                  type="button"
                  onClick={() => void perform("approve")}
                  disabled={busy || !slug}
                >
                  تأیید و ساخت سازمان
                </button>
              </div>
            </>
          )}
          {selected.status === "NEEDS_INFORMATION" && (
            <p className="hint">
              منتظر تکمیل اطلاعات و ارسال دوباره از سوی متقاضی است.
            </p>
          )}
          {selected.status === "APPROVED" && (
            <p className="notice">
              سازمان با شناسهٔ <span dir="ltr">{selected.assignedSlug}</span> در
              وضعیت راه‌اندازی ساخته شده است.
            </p>
          )}
          {selected.status === "REJECTED" && (
            <p className="hint">
              پیام ثبت‌شده برای متقاضی: {selected.reviewNote ?? "—"}
            </p>
          )}
        </section>
      )}
    </div>
  );
}

function Organizations({
  actor,
  organizations,
  onSaved,
  onError,
}: {
  actor: Actor;
  organizations: Organization[];
  onSaved: (message: string) => void;
  onError: (message: string) => void;
}) {
  const listState = usePlatformListState("organization");
  const [form, setForm] = useState({ name: "", slug: "" });
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<Organization | null>(null);
  const [pending, setPending] = useState<Organization | null>(null);
  const [archivePending, setArchivePending] = useState<{
    organization: Organization;
    mode: "archive" | "restore";
  } | null>(null);
  const create = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await request(
        "/admin/platform/organizations",
        actor.session,
        actor.organizationId,
        { method: "POST", body: JSON.stringify(form) },
      );
      setForm({ name: "", slug: "" });
      setCreateOpen(false);
      onSaved("سازمان جدید ساخته شد.");
    } catch (cause) {
      onError(
        cause instanceof Error ? cause.message : "ساخت سازمان ناموفق بود.",
      );
    }
  };
  const toggle = async () => {
    if (!pending) return;
    try {
      await request(
        `/admin/platform/organizations/${pending.id}/status`,
        actor.session,
        actor.organizationId,
        {
          method: "POST",
          body: JSON.stringify({
            status: pending.status === "active" ? "suspended" : "active",
          }),
        },
      );
      setPending(null);
      onSaved("وضعیت سازمان به‌روزرسانی شد.");
    } catch (cause) {
      onError(
        cause instanceof Error ? cause.message : "به‌روزرسانی ناموفق بود.",
      );
    }
  };
  const label = (status: Organization["status"]) =>
    status === "active"
      ? "فعال"
      : status === "suspended"
        ? "معلق"
        : status === "archived"
          ? "حذف امن"
          : "راه‌اندازی";
  const filtered = organizations.filter((organization) => {
    const query = normalizePlatformSearch(listState.query);
    return (!query || normalizePlatformSearch(`${organization.name} ${organization.slug}`).includes(query)) &&
      (listState.status === "ALL" || organization.status === listState.status);
  });
  const paged = paginatePlatformItems(filtered, listState.page, listState.pageSize);
  return (
    <>
      <div className="admin-stack">
        <section className="card platform-list-card">
          <SectionHeader
            title="سازمان‌های پلتفرم"
            description="سازمان را پیدا کنید و عملیات مدیریتی را در پنل جزئیات انجام دهید."
            action={<button type="button" onClick={() => setCreateOpen((value) => !value)}>{createOpen ? "بستن فرم" : "ساخت سازمان"}</button>}
            as="h3"
          />
          {createOpen && (
            <form onSubmit={create} className="compact-form platform-inline-create">
              <label>نام سازمان<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
              <label>Slug یکتا<input dir="ltr" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value.toLowerCase() })} placeholder="acme-support" required /></label>
              <button>ساخت سازمان</button>
            </form>
          )}
          <PlatformFilterToolbar
            state={listState}
            searchLabel="جست‌وجوی سازمان"
            searchPlaceholder="نام یا Slug سازمان"
            statusOptions={[
              { value: "active", label: "فعال" }, { value: "setup", label: "راه‌اندازی" },
              { value: "suspended", label: "معلق" }, { value: "archived", label: "حذف امن" },
            ]}
            resultCount={filtered.length}
          />
          <div className="table-wrap responsive-platform-table">
            <table>
              <thead>
                <tr>
                  <th>نام</th>
                  <th>شناسه</th>
                  <th>وضعیت</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {paged.items.map((org) => (
                  <tr key={org.id}>
                    <td data-label="نام">{org.name}</td>
                    <td data-label="شناسه" dir="ltr">{org.slug}</td>
                    <td data-label="وضعیت">
                      <span className={`status-pill ${org.status}`}>
                        {label(org.status)}
                      </span>
                    </td>
                    <td data-label="عملیات">
                      <button className="secondary" type="button" onClick={() => setSelected(org)} aria-expanded={selected?.id === org.id}>مدیریت</button>
                    </td>
                  </tr>
                ))}
                {!filtered.length && <tr><td className="empty-row" colSpan={4}><PlatformNoResults filtered={Boolean(listState.query || listState.status !== "ALL")} empty="سازمانی ثبت نشده است" /></td></tr>}
              </tbody>
            </table>
          </div>
          <PlatformPagination state={{ ...listState, page: paged.page }} totalItems={filtered.length} />
        </section>
      </div>
      {selected && (
        <aside className="card platform-detail-panel" aria-label={`مدیریت ${selected.name}`}>
          <SectionHeader title={selected.name} description={`شناسه: ${selected.slug}`} action={<button type="button" className="ghost" onClick={() => setSelected(null)}>بستن</button>} as="h3" />
          <dl className="summary-list">
            <div><dt>وضعیت</dt><dd><span className={`status-pill ${selected.status}`}>{label(selected.status)}</span></dd></div>
            <div><dt>نوع فضا</dt><dd>{selected.workspace_type === "PERSONAL" ? "شخصی" : "سازمانی"}</dd></div>
            <div><dt>تاریخ ایجاد</dt><dd>{new Date(selected.created_at).toLocaleDateString("fa-IR")}</dd></div>
          </dl>
          {selected.workspace_type !== "PERSONAL" && selected.status !== "setup" && (
            <div className="inline-actions platform-detail-actions">
              {selected.status === "archived"
                ? <button type="button" onClick={() => setArchivePending({ organization: selected, mode: "restore" })}>بازیابی در حالت معلق</button>
                : <button type="button" className="secondary" onClick={() => setPending(selected)}>{selected.status === "active" ? "تعلیق سازمان" : "فعال‌سازی سازمان"}</button>}
              {selected.status === "suspended" && <button type="button" className="danger-text" onClick={() => setArchivePending({ organization: selected, mode: "archive" })}>حذف امن</button>}
            </div>
          )}
          {selected.workspace_type !== "PERSONAL" && <OwnerTransition actor={actor} organizations={[selected]} defaultOrganizationId={selected.id} onSaved={onSaved} onError={onError} />}
          {selected.status === "setup" && <Alert>این سازمان باید مسیر راه‌اندازی را تکمیل کند.</Alert>}
        </aside>
      )}
      <ConfirmDialog
        open={Boolean(pending)}
        title={
          pending?.status === "active" ? "تعلیق سازمان" : "فعال‌سازی سازمان"
        }
        body={
          pending?.status === "active"
            ? `تعلیق «${pending?.name}» دسترسی اعضای آن سازمان را متوقف می‌کند تا دوباره فعال شود.`
            : `«${pending?.name}» دوباره برای اعضای مجاز در دسترس قرار می‌گیرد.`
        }
        confirmLabel={
          pending?.status === "active" ? "تعلیق سازمان" : "فعال‌سازی"
        }
        danger={pending?.status === "active"}
        onConfirm={() => void toggle()}
        onClose={() => setPending(null)}
      />
      <OrganizationArchiveDialog
        actor={actor}
        pending={archivePending}
        onClose={() => setArchivePending(null)}
        onSaved={(message) => {
          setArchivePending(null);
          onSaved(message);
        }}
        onError={onError}
      />
    </>
  );
}

function OrganizationArchiveDialog({
  actor,
  pending,
  onClose,
  onSaved,
  onError,
}: {
  actor: Actor;
  pending: { organization: Organization; mode: "archive" | "restore" } | null;
  onClose: () => void;
  onSaved: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [slug, setSlug] = useState("");
  const [reason, setReason] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    setSlug("");
    setReason("");
    setAcknowledged(false);
    if (pending) window.setTimeout(() => cancelRef.current?.focus(), 0);
  }, [pending?.organization.id, pending?.mode]);
  if (!pending) return null;
  const archive = pending.mode === "archive";
  const valid =
    slug === pending.organization.slug &&
    reason.trim().length >= 10 &&
    reason.trim().length <= 500 &&
    (!archive || acknowledged);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    try {
      await request(
        `/admin/platform/organizations/${pending.organization.id}/${pending.mode}`,
        actor.session,
        actor.organizationId,
        {
          method: "POST",
          headers: { "idempotency-key": crypto.randomUUID() },
          body: JSON.stringify({ slug, reason: reason.trim() }),
        },
      );
      onSaved(
        archive
          ? "سازمان به‌صورت امن حذف و دسترسی آن متوقف شد."
          : "سازمان در وضعیت معلق بازیابی شد؛ فعال‌سازی آن همچنان صریح است.",
      );
    } catch (cause) {
      onError(
        cause instanceof Error
          ? cause.message
          : archive
            ? "حذف امن سازمان ناموفق بود."
            : "بازیابی سازمان ناموفق بود.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="dialog-layer" role="presentation">
      <button className="dialog-backdrop" aria-label="بستن گفتگو" onClick={onClose} />
      <section
        className="dialog organization-archive-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="organization-archive-title"
      >
        <h2 id="organization-archive-title">
          {archive ? "حذف امن سازمان" : "بازیابی سازمان"}
        </h2>
        <p>
          {archive
            ? `داده‌های «${pending.organization.name}» پاک نمی‌شوند، اما دسترسی همهٔ اعضا فوراً متوقف خواهد شد. بازیابی فقط توسط مدیر پلتفرم ممکن است.`
            : `«${pending.organization.name}» با وضعیت معلق بازیابی می‌شود و تا فعال‌سازی صریح در دسترس اعضا نخواهد بود.`}
        </p>
        <form className="organization-archive-form" onSubmit={submit}>
          <label>
            برای تأیید، شناسهٔ زیر را دقیق وارد کنید:
            <strong dir="ltr">{pending.organization.slug}</strong>
            <input
              dir="ltr"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              autoComplete="off"
              required
            />
          </label>
          <label>
            دلیل {archive ? "حذف امن" : "بازیابی"}
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              minLength={10}
              maxLength={500}
              required
            />
            <small>{reason.trim().length} از ۵۰۰ نویسه؛ حداقل ۱۰ نویسه</small>
          </label>
          {archive && (
            <label className="check-label">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(event) => setAcknowledged(event.target.checked)}
              />
              می‌دانم دسترسی تمام اعضای این سازمان متوقف می‌شود.
            </label>
          )}
          <div className="organization-archive-actions">
            <button ref={cancelRef} type="button" className="secondary" onClick={onClose}>
              انصراف
            </button>
            <button
              type="submit"
              className={archive ? "ui-button danger" : undefined}
              disabled={!valid || busy}
            >
              {busy ? "در حال انجام…" : archive ? "حذف امن سازمان" : "بازیابی در حالت معلق"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function OwnerTransition({
  actor,
  organizations,
  defaultOrganizationId,
  onSaved,
  onError,
}: {
  actor: Actor;
  organizations: Organization[];
  defaultOrganizationId?: string;
  onSaved: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [organizationId, setOrganizationId] = useState(defaultOrganizationId ?? "");
  const [members, setMembers] = useState<
    { user_id: string; display_name: string; email: string; roles: string[] }[]
  >([]);
  const [ownerId, setOwnerId] = useState("");
  const load = async (id: string) => {
    setOrganizationId(id);
    setOwnerId("");
    try {
      setMembers(
        (await request(
          `/admin/platform/organizations/${id}/members`,
          actor.session,
          actor.organizationId,
        )) as typeof members,
      );
    } catch (cause) {
      onError(
        cause instanceof Error
          ? cause.message
          : "دریافت اعضای سازمان ناموفق بود.",
      );
    }
  };
  useEffect(() => {
    if (defaultOrganizationId) void load(defaultOrganizationId);
  }, [defaultOrganizationId]);
  const assign = async () => {
    if (!organizationId || !ownerId) return;
    try {
      await request(
        `/admin/platform/organizations/${organizationId}/owner`,
        actor.session,
        actor.organizationId,
        { method: "POST", body: JSON.stringify({ userId: ownerId }) },
      );
      onSaved("مالک سازمان به‌صورت صریح تعیین شد.");
    } catch (cause) {
      onError(
        cause instanceof Error ? cause.message : "انتساب مالک ناموفق بود.",
      );
    }
  };
  const revoke = async () => {
    if (!organizationId) return;
    try {
      const result = (await request(
        `/admin/platform/organizations/${organizationId}/owner/revoke`,
        actor.session,
        actor.organizationId,
        { method: "POST" },
      )) as { revoked: number };
      onSaved(
        result.revoked
          ? "مالک سازمان حذف شد."
          : "مالک فعالی برای حذف وجود نداشت.",
      );
      await load(organizationId);
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : "حذف مالک ناموفق بود.");
    }
  };
  return (
    <section className="owner-transition">
      <h3>انتساب مالک سازمان‌های موجود</h3>
      <p className="hint">
        هیچ مدیر سازمانی به‌طور خودکار مالک نمی‌شود؛ یک عضو فعال را آگاهانه
        انتخاب کنید.
      </p>
      <div className="inline-actions">
        <label>
          سازمان
          <select
            value={organizationId}
            onChange={(event) => void load(event.target.value)}
          >
            <option value="">انتخاب سازمان</option>
            {organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organization.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          عضو فعال
          <select
            value={ownerId}
            onChange={(event) => setOwnerId(event.target.value)}
            disabled={!organizationId}
          >
            <option value="">انتخاب عضو</option>
            {members.map((member) => (
              <option key={member.user_id} value={member.user_id}>
                {member.display_name} — {member.email}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={() => void assign()} disabled={!ownerId}>
          تعیین مالک
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() => void revoke()}
          disabled={!organizationId}
        >
          حذف مالک
        </button>
      </div>
    </section>
  );
}

function PlatformUsers({
  actor,
  users,
  onSaved,
  onError,
}: {
  actor: Actor;
  users: User[];
  onSaved: (message: string) => void;
  onError: (message: string) => void;
}) {
  const listState = usePlatformListState("user");
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    password: "",
    isPlatformAdmin: false,
  });
  const [managed, setManaged] = useState<User | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [password, setPassword] = useState("");
  const filtered = users.filter((user) => {
    const query = normalizePlatformSearch(listState.query);
    const statusMatches = listState.status === "ALL" ||
      (listState.status === "ACTIVE" && user.is_active) ||
      (listState.status === "INACTIVE" && !user.is_active) ||
      (listState.status === "ADMIN" && user.is_platform_admin);
    return (!query || normalizePlatformSearch(`${user.display_name} ${user.email}`).includes(query)) && statusMatches;
  });
  const paged = paginatePlatformItems(filtered, listState.page, listState.pageSize);
  const create = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await request(
        "/admin/platform/users",
        actor.session,
        actor.organizationId,
        { method: "POST", body: JSON.stringify(form) },
      );
      setForm({
        displayName: "",
        email: "",
        password: "",
        isPlatformAdmin: false,
      });
      setCreateOpen(false);
      onSaved("کاربر پلتفرم ساخته شد.");
    } catch (cause) {
      onError(
        cause instanceof Error ? cause.message : "ساخت کاربر ناموفق بود.",
      );
    }
  };
  const toggle = async (user: User) => {
    try {
      await request(
        `/admin/platform/users/${user.id}`,
        actor.session,
        actor.organizationId,
        { method: "POST", body: JSON.stringify({ isActive: !user.is_active }) },
      );
      onSaved("وضعیت کاربر تغییر کرد.");
    } catch (cause) {
      onError(
        cause instanceof Error ? cause.message : "به‌روزرسانی ناموفق بود.",
      );
    }
  };
  const saveManagement = async () => {
    if (!managed) return;
    try {
      await request(
        `/admin/platform/users/${managed.id}`,
        actor.session,
        actor.organizationId,
        {
          method: "POST",
          body: JSON.stringify({
            isActive: managed.is_active,
            password: password || undefined,
          }),
        },
      );
      setPassword("");
      setManaged(null);
      onSaved("تنظیمات کاربر به‌روزرسانی شد.");
    } catch (cause) {
      onError(
        cause instanceof Error ? cause.message : "به‌روزرسانی ناموفق بود.",
      );
    }
  };
  return (
    <>
      <div className="admin-stack">
        <section className="card platform-list-card">
          <SectionHeader title="کاربران پلتفرم" description="حساب‌ها را جست‌وجو و مدیریت کنید؛ ساخت حساب فقط در صورت نیاز باز می‌شود." action={<button type="button" onClick={() => setCreateOpen((value) => !value)}>{createOpen ? "بستن فرم" : "افزودن کاربر"}</button>} as="h3" />
          {createOpen && (
            <form onSubmit={create} className="compact-form platform-inline-create">
              <label>نام<input value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} required /></label>
              <label>ایمیل<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></label>
              <label>رمز موقت<input type="password" minLength={10} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required /></label>
              <label className="check-label"><input type="checkbox" checked={form.isPlatformAdmin} onChange={(event) => setForm({ ...form, isPlatformAdmin: event.target.checked })} />دسترسی مدیر پلتفرم</label>
              <button>افزودن کاربر</button>
            </form>
          )}
          <PlatformFilterToolbar state={listState} searchLabel="جست‌وجوی کاربر" searchPlaceholder="نام یا ایمیل" statusLabel="نوع حساب" statusOptions={[{value:"ACTIVE",label:"فعال"},{value:"INACTIVE",label:"غیرفعال"},{value:"ADMIN",label:"مدیر پلتفرم"}]} resultCount={filtered.length} />
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>نام</th>
                  <th>ایمیل</th>
                  <th>دسترسی</th>
                  <th>وضعیت</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paged.items.map((user) => (
                  <tr key={user.id}>
                    <td>{user.display_name}</td>
                    <td dir="ltr">{user.email}</td>
                    <td>
                      {user.is_platform_admin ? "مدیر پلتفرم" : "کاربر عادی"}
                    </td>
                    <td>
                      <span
                        className={`status-pill ${user.is_active ? "active" : "inactive"}`}
                      >
                        {user.is_active ? "فعال" : "غیرفعال"}
                      </span>
                    </td>
                    <td>
                      <div className="member-actions">
                        <button
                          className="secondary"
                          type="button"
                          onClick={() => {
                            setPassword("");
                            setManaged(user);
                          }}
                        >
                          مدیریت
                        </button>
                        <button
                          className="secondary"
                          type="button"
                          onClick={() => toggle(user)}
                        >
                          {user.is_active ? "غیرفعال‌سازی" : "فعال‌سازی"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!filtered.length && <tr><td colSpan={5}><PlatformNoResults filtered={Boolean(listState.query || listState.status !== "ALL")} empty="کاربری ثبت نشده است" /></td></tr>}
              </tbody>
            </table>
          </div>
          <PlatformPagination state={{...listState,page:paged.page}} totalItems={filtered.length} />
        </section>
      </div>
      {managed && (
        <section className="card">
          <h3>مدیریت حساب: {managed.display_name}</h3>
          <p className="hint">
            رمز جدید را فقط در صورت نیاز وارد کنید. با ذخیرهٔ آن، نشست‌های فعال
            این کاربر باطل می‌شوند.
          </p>
          <label>
            رمز جدید (اختیاری)
            <input
              type="password"
              minLength={10}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
            />
          </label>
          <div className="inline-actions">
            <button
              type="button"
              onClick={saveManagement}
              disabled={password.length > 0 && password.length < 10}
            >
              ذخیره
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => {
                setPassword("");
                setManaged(null);
              }}
            >
              انصراف
            </button>
          </div>
        </section>
      )}
    </>
  );
}

type AiDraft = {
  enabled: boolean;
  smartIntakeEnabled: boolean;
  providerBaseUrl: string;
  analysisModel: string;
  transcriptionModel: string;
  apiKey: string;
};
type AiConnectionTest = { success: boolean; code: string; message: string };
function AiPolicies({
  actor,
  settings,
  onSaved,
  onError,
}: {
  actor: Actor;
  settings: AiSetting[];
  onSaved: (message: string) => void;
  onError: (message: string) => void;
}) {
  const listState = usePlatformListState("ai");
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState<AiDraft>({
    enabled: false,
    smartIntakeEnabled: false,
    providerBaseUrl: "https://api.openai.com/v1",
    analysisModel: "gpt-4.1-mini",
    transcriptionModel: "gpt-4o-mini-transcribe",
    apiKey: "",
  });
  const [removePending, setRemovePending] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<AiConnectionTest | null>(null);
  const filteredSettings = settings.filter((item) => {
    const query = normalizePlatformSearch(listState.query);
    const statusMatches = listState.status === "ALL" ||
      (listState.status === "ENABLED" && item.enabled) ||
      (listState.status === "DISABLED" && !item.enabled) ||
      (listState.status === "MISSING_KEY" && item.enabled && !item.hasApiKey) ||
      listState.status === item.workspaceType;
    return (!query || normalizePlatformSearch(`${item.name} ${item.slug}`).includes(query)) && statusMatches;
  });
  const selected = filteredSettings.find((item) => item.organizationId === selectedId) ?? filteredSettings[0];
  useEffect(() => {
    if (!selected) return;
    setSelectedId(selected.organizationId);
    setDraft({
      enabled: selected.enabled,
      smartIntakeEnabled: selected.smartIntakeEnabled,
      providerBaseUrl: selected.providerBaseUrl,
      analysisModel: selected.analysisModel,
      transcriptionModel: selected.transcriptionModel,
      apiKey: "",
    });
    setTestResult(null);
  }, [selected?.organizationId, selected?.updatedAt]);
  const save = async (removeApiKey = false) => {
    if (!selected) return;
    try {
      await request(
        "/platform/ai-settings",
        actor.session,
        actor.organizationId,
        {
          method: "PUT",
          body: JSON.stringify({
            organizationId: selected.organizationId,
            enabled: removeApiKey ? false : draft.enabled,
            smartIntakeEnabled:
              selected.workspaceType === "PERSONAL"
                ? draft.smartIntakeEnabled
                : undefined,
            providerBaseUrl: draft.providerBaseUrl,
            analysisModel: draft.analysisModel,
            transcriptionModel: draft.transcriptionModel,
            apiKey: draft.apiKey || undefined,
            removeApiKey,
          }),
        },
      );
      setDraft({
        ...draft,
        apiKey: "",
        enabled: removeApiKey ? false : draft.enabled,
      });
      setTestResult(null);
      setRemovePending(false);
      onSaved(
        removeApiKey
          ? "کلید API حذف و قابلیت AI غیرفعال شد."
          : "تنظیمات امن AI ذخیره شد.",
      );
    } catch (cause) {
      onError(
        cause instanceof Error ? cause.message : "ذخیره تنظیمات AI ناموفق بود.",
      );
    }
  };
  const testConnection = async () => {
    if (!selected) return;
    setTesting(true);
    setTestResult(null);
    try {
      setTestResult(
        (await request(
          "/platform/ai-settings/test",
          actor.session,
          actor.organizationId,
          {
            method: "POST",
            body: JSON.stringify({ organizationId: selected.organizationId }),
          },
        )) as AiConnectionTest,
      );
    } catch (cause) {
      onError(
        cause instanceof Error ? cause.message : "آزمون اتصال AI ناموفق بود.",
      );
    } finally {
      setTesting(false);
    }
  };
  return (
    <>
      <div className="admin-grid">
        <section className="card">
          <SectionHeader title="فضای کاری و مصرف AI" description="فضای کاری هدف را با جست‌وجو و وضعیت محدود کنید." as="h3" />
          <p className="hint">
            تنظیم credentials فقط برای مدیر پلتفرم قابل دسترسی است.
          </p>
          <PlatformFilterToolbar state={listState} searchLabel="جست‌وجوی فضای کاری" searchPlaceholder="نام یا Slug" statusLabel="نوع یا وضعیت" statusOptions={[{value:"ORGANIZATION",label:"سازمانی"},{value:"PERSONAL",label:"شخصی"},{value:"ENABLED",label:"AI فعال"},{value:"DISABLED",label:"AI غیرفعال"},{value:"MISSING_KEY",label:"فعال بدون کلید"}]} resultCount={filteredSettings.length} />
          <label>
            فضای کاری
            <select
              value={selected?.organizationId ?? ""}
              onChange={(event) => setSelectedId(event.target.value)}
            >
              {filteredSettings.map((item) => (
                <option key={item.organizationId} value={item.organizationId}>
                  {item.name} — {item.workspaceType === "PERSONAL" ? "شخصی" : "سازمانی"}
                </option>
              ))}
            </select>
          </label>
          {!filteredSettings.length && <PlatformNoResults filtered empty="فضای کاری AI ثبت نشده است" />}
          {selected && (
            <dl className="summary-list">
              <div>
                <dt>نوع فضا</dt>
                <dd>{selected.workspaceType === "PERSONAL" ? "شخصی" : "سازمانی"}</dd>
              </div>
              <div>
                <dt>وضعیت کلید</dt>
                <dd>
                  <span
                    className={`status-pill ${selected.hasApiKey ? "active" : "inactive"}`}
                  >
                    {selected.hasApiKey ? "تنظیم شده" : "تنظیم نشده"}
                  </span>
                </dd>
              </div>
              <div>
                <dt>درخواست‌ها</dt>
                <dd>{selected.requestCount}</dd>
              </div>
              <div>
                <dt>توکن ثبت‌شده</dt>
                <dd>{selected.tokenCount}</dd>
              </div>
            </dl>
          )}
        </section>
        <section className="card">
          <h3>ارائه‌دهنده OpenAI-compatible</h3>
          <p className="hint">
            کلید ذخیره‌شده هرگز نمایش داده نمی‌شود. خالی گذاشتن فیلد کلید، مقدار
            قبلی را حفظ می‌کند.
          </p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
          >
            <label className="check-label">
              <input
                type="checkbox"
                checked={draft.enabled}
                onChange={(event) =>
                  setDraft({ ...draft, enabled: event.target.checked })
                }
              />
              فعال‌سازی AI برای این فضای کاری
            </label>
            {selected?.workspaceType === "PERSONAL" && (
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={draft.smartIntakeEnabled}
                  onChange={(event) =>
                    setDraft({ ...draft, smartIntakeEnabled: event.target.checked })
                  }
                />
                فعال‌سازی دریافت هوشمند تیکت شخصی
              </label>
            )}
            <label>
              Base URL
              <input
                dir="ltr"
                type="url"
                value={draft.providerBaseUrl}
                onChange={(event) =>
                  setDraft({ ...draft, providerBaseUrl: event.target.value })
                }
                required
              />
            </label>
            <label>
              مدل تحلیل
              <input
                dir="ltr"
                value={draft.analysisModel}
                onChange={(event) =>
                  setDraft({ ...draft, analysisModel: event.target.value })
                }
                required
              />
            </label>
            <label>
              مدل تبدیل صوت
              <input
                dir="ltr"
                value={draft.transcriptionModel}
                onChange={(event) =>
                  setDraft({ ...draft, transcriptionModel: event.target.value })
                }
                required
              />
            </label>
            <label>
              API key جدید (اختیاری)
              <input
                dir="ltr"
                type="password"
                autoComplete="new-password"
                value={draft.apiKey}
                onChange={(event) =>
                  setDraft({ ...draft, apiKey: event.target.value })
                }
                placeholder={
                  selected?.hasApiKey
                    ? "برای حفظ کلید فعلی خالی بگذارید"
                    : "کلید سازمان را وارد کنید"
                }
              />
            </label>
            <div className="inline-actions">
              <button type="submit">ذخیره تنظیمات</button>
              <button
                type="button"
                className="secondary"
                onClick={() => void testConnection()}
                disabled={testing}
              >
                {testing ? "در حال آزمون…" : "آزمون اتصال"}
              </button>
              {selected?.hasApiKey && (
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setRemovePending(true)}
                >
                  حذف کلید
                </button>
              )}
            </div>
          </form>
          <p className="hint">
            پس از ذخیرهٔ تنظیمات، «آزمون اتصال» فقط Base URL، کلید API و مدل
            تحلیل ذخیره‌شده را با یک درخواست کوتاه بررسی می‌کند؛ کلید نمایش یا
            ثبت نمی‌شود.
          </p>
          {testResult && (
            <p
              className={testResult.success ? "notice" : "error"}
              role={testResult.success ? "status" : "alert"}
            >
              {testResult.message}
            </p>
          )}
        </section>
      </div>
      <ConfirmDialog
        open={removePending}
        title="حذف کلید API"
        body="کلید این سازمان به‌صورت غیرقابل‌بازگشت حذف و قابلیت AI غیرفعال می‌شود."
        confirmLabel="حذف کلید"
        danger
        onConfirm={() => void save(true)}
        onClose={() => setRemovePending(false)}
      />
    </>
  );
}
function AuditList({ audit }: { audit: Audit[] }) {
  const listState = usePlatformListState("audit");
  const organizations = [...new Set(audit.map((item) => item.organization_name ?? "پلتفرم"))].sort((a, b) => a.localeCompare(b, "fa"));
  const filtered = audit.filter((item) => {
    const query = normalizePlatformSearch(listState.query);
    const haystack = normalizePlatformSearch(`${item.action} ${item.organization_name ?? "پلتفرم"} ${item.actor_display_name ?? "سامانه"}`);
    return (!query || haystack.includes(query)) && (listState.status === "ALL" || (item.organization_name ?? "پلتفرم") === listState.status);
  });
  const paged = paginatePlatformItems(filtered, listState.page, listState.pageSize);
  return (
    <section className="card">
      <SectionHeader title="ردپای ممیزی" description="رویدادها را بر اساس عامل، سازمان یا عنوان رویداد پیدا کنید." as="h3" />
      <PlatformFilterToolbar state={listState} searchLabel="جست‌وجوی رویداد" searchPlaceholder="رویداد، سازمان یا عامل" statusLabel="سازمان" statusOptions={organizations.map((value) => ({value,label:value}))} resultCount={filtered.length} />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>رویداد</th>
              <th>سازمان</th>
              <th>عامل</th>
              <th>زمان</th>
            </tr>
          </thead>
          <tbody>
            {paged.items.map((item) => (
              <tr key={item.id}>
                <td>{item.action}</td>
                <td>{item.organization_name ?? "پلتفرم"}</td>
                <td>{item.actor_display_name ?? "سامانه"}</td>
                <td>{new Date(item.created_at).toLocaleString("fa-IR")}</td>
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td colSpan={4}><PlatformNoResults filtered={Boolean(listState.query || listState.status !== "ALL")} empty="رویدادی ثبت نشده است" /></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <PlatformPagination state={{...listState,page:paged.page}} totalItems={filtered.length} />
    </section>
  );
}
