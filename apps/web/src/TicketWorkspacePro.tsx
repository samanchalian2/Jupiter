import { FormEvent, useEffect, useRef, useState } from "react";
import { Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import type { Actor, Ticket } from "./App";
import { request } from "./App";
import { TicketComposer } from "./TicketComposer";
import { TicketDetailPro } from "./TicketDetailPro";
import { Button, ConfirmDialog, EmptyState, PageHeader } from "./ui";

type Queue = { items: Ticket[]; total: number; page: number; pageSize: number };
type View = {
  id: string;
  name: string;
  filters: Record<string, string>;
  is_shared: boolean;
};
type Filters = {
  status: string;
  priority: string;
  tag: string;
  query: string;
  sort: string;
};
type Tag = { id: string; name: string; kind: string };
const statusLabels: Record<string, string> = {
  OPEN: "باز",
  IN_PROGRESS: "در حال رسیدگی",
  WAITING_FOR_REQUESTER: "منتظر پاسخ",
  RESOLVED: "حل‌شده",
  CLOSED: "بسته",
};
const priorityLabels: Record<string, string> = {
  LOW: "کم",
  NORMAL: "عادی",
  HIGH: "بالا",
  URGENT: "فوری",
};

export function TicketWorkspacePro({
  actor,
  staff,
}: {
  actor: Actor;
  staff: boolean;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const manager = actor.membership.role_codes.some((role) =>
    ["ORG_ADMIN", "SUPERVISOR"].includes(role),
  );
  const ticketId = location.pathname.match(/^\/tickets\/([^/]+)$/)?.[1];
  const storageKey = `jupiter.ticket-filters.${actor.organizationId}.${staff ? "staff" : "requester"}`;
  const savedFilters = () => {
    try {
      return JSON.parse(
        sessionStorage.getItem(storageKey) ?? "null",
      ) as Filters | null;
    } catch {
      return null;
    }
  };
  const [filters, setFilters] = useState<Filters>(
    () =>
      savedFilters() ?? { status: "", priority: "", tag: "", query: "", sort: "recent" },
  );
  const [queue, setQueue] = useState<Queue>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
  });
  const [page, setPage] = useState(1);
  const [views, setViews] = useState<View[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [checked, setChecked] = useState<string[]>([]);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [composerOpen, setComposerOpen] = useState(!staff);
  const [notice, setNotice] = useState("");
  const [pendingBulk, setPendingBulk] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersCloseRef = useRef<HTMLButtonElement>(null);

  const loadQueue = () => {
    setLoading(true);
    setError("");
    const query = new URLSearchParams({
      page: String(page),
      pageSize: "20",
      sort: filters.sort,
    });
    if (filters.status) query.set("status", filters.status);
    if (filters.priority) query.set("priority", filters.priority);
    if (filters.tag) query.set("tag", filters.tag);
    if (filters.query.trim()) query.set("q", filters.query.trim());
    Promise.all([
      request(`/tickets/queue?${query}`, actor.session, actor.organizationId),
      staff
        ? request("/tickets/views", actor.session, actor.organizationId)
        : Promise.resolve([]),
      request("/tickets/tags", actor.session, actor.organizationId),
    ])
      .then(([next, nextViews, nextTags]) => {
        const data = next as Queue;
        setQueue(data);
        setViews(nextViews as View[]);
        setTags(nextTags as Tag[]);
        setChecked((current) =>
          current.filter((id) => data.items.some((ticket) => ticket.id === id)),
        );
        sessionStorage.setItem(storageKey, JSON.stringify(filters));
      })
      .catch((cause) =>
        setError(
          cause instanceof Error ? cause.message : "دریافت تیکت‌ها ناموفق بود.",
        ),
      )
      .finally(() => setLoading(false));
  };
  const loadTicket = () => {
    if (!ticketId) {
      setSelected(null);
      return;
    }
    setLoading(true);
    request(`/tickets/${ticketId}`, actor.session, actor.organizationId)
      .then((value) => setSelected(value as Ticket))
      .catch((cause) => {
        setError(cause instanceof Error ? cause.message : "تیکت پیدا نشد.");
        setSelected(null);
      })
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    loadQueue();
  }, [
    actor.organizationId,
    page,
    filters.status,
    filters.priority,
    filters.tag,
    filters.sort,
  ]);
  useEffect(() => {
    loadTicket();
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [ticketId, actor.organizationId]);
  useEffect(() => {
    if (!filtersOpen) return;
    filtersCloseRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFiltersOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [filtersOpen]);

  const applySearch = (event?: FormEvent) => {
    event?.preventDefault();
    setPage(1);
    loadQueue();
  };
  const openTicket = (ticket: Ticket) => {
    setSelected(ticket);
    navigate(`/tickets/${ticket.id}?tab=conversation`);
  };
  const back = () => {
    navigate("/tickets");
    setSelected(null);
  };
  const onCreated = (id: string, message?: string) => {
    setNotice(message ?? "درخواست ثبت شد.");
    setComposerOpen(false);
    loadQueue();
    navigate(`/tickets/${id}?tab=conversation`);
  };
  const statusTabs = [
    { value: "", label: "همه" },
    { value: "OPEN,IN_PROGRESS", label: "باز" },
    { value: "WAITING_FOR_REQUESTER", label: "منتظر پاسخ" },
    { value: "RESOLVED,CLOSED", label: "حل‌شده" },
  ];
  const setStatusTab = (value: string) => {
    setPage(1);
    setFilters({ ...filters, status: value });
  };
  const saveView = async () => {
    const name = window.prompt("نام نمای ذخیره‌شده را وارد کنید");
    if (!name?.trim()) return;
    try {
      await request("/tickets/views", actor.session, actor.organizationId, {
        method: "POST",
        body: JSON.stringify({ name, filters, isShared: false }),
      });
      setNotice("نمای صف ذخیره شد.");
      loadQueue();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "ذخیره نما ناموفق بود.",
      );
    }
  };
  const applyView = (id: string) => {
    const view = views.find((item) => item.id === id);
    if (!view) return;
    setPage(1);
    setFilters({
      status: view.filters.status ?? "",
      priority: view.filters.priority ?? "",
      tag: view.filters.tag ?? "",
      query: view.filters.query ?? "",
      sort: view.filters.sort ?? "recent",
    });
  };
  const bulk = async () => {
    if (!pendingBulk) return;
    try {
      await request(
        "/tickets/bulk/status",
        actor.session,
        actor.organizationId,
        {
          method: "POST",
          body: JSON.stringify({ ticketIds: checked, status: pendingBulk }),
        },
      );
      setChecked([]);
      setNotice("وضعیت تیکت‌های انتخابی تغییر کرد.");
      setPendingBulk("");
      loadQueue();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "عملیات گروهی ناموفق بود.",
      );
    }
  };

  if (ticketId)
    return (
      <section className="ticket-route-page">
        {loading && !selected ? (
          <div className="ticket-detail-loading" aria-busy="true">
            در حال دریافت جزئیات تیکت…
          </div>
        ) : selected ? (
          <TicketDetailPro
            actor={actor}
            ticket={selected}
            staff={staff}
            manager={manager}
            onBack={back}
            onRefresh={() => {
              loadTicket();
              loadQueue();
            }}
            initialNotice={notice}
          />
        ) : (
          <EmptyState
            title="تیکت در دسترس نیست"
            body={error || "این تیکت وجود ندارد یا اجازه مشاهده آن را ندارید."}
            action={
              <Button type="button" onClick={back}>
                بازگشت به تیکت‌ها
              </Button>
            }
          />
        )}
      </section>
    );

  return (
    <section
      className={`tickets-landing ${staff ? "staff-queue" : "requester-history"}`}
    >
      <PageHeader
        eyebrow={staff ? "صف عملیاتی" : "مرکز درخواست‌ها"}
        title={staff ? "مدیریت تیکت‌ها" : "درخواست‌های من"}
        description={
          staff
            ? "تیکت‌های مجاز را اولویت‌بندی، واگذار و پیگیری کنید."
            : "درخواست جدید ثبت کنید و روند رسیدگی درخواست‌های قبلی را ببینید."
        }
        action={
          (staff || !composerOpen) ? (
            <Button
              type="button"
              onClick={() => setComposerOpen(!composerOpen)}
            >
              <Plus size={17} />
              {composerOpen ? "بستن فرم" : staff ? "تیکت جدید" : "درخواست جدید"}
            </Button>
          ) : undefined
        }
      />
      {notice && (
        <p className="ticket-notice" role="status">
          {notice}
        </p>
      )}
      {composerOpen && <TicketComposer actor={actor} onCreated={onCreated} onCancelled={()=>{setComposerOpen(false);setNotice('پیش‌نویس درخواست حذف شد؛ هیچ تیکتی ثبت نشد.');}} />}
      <section className="ticket-history-section">
        <div className="ticket-history-heading">
          <div>
            <p className="eyebrow">
              {staff ? "صف تیکت‌ها" : "تاریخچه درخواست‌ها"}
            </p>
            <h2>
              {staff ? "کارهای نیازمند رسیدگی" : "پیگیری وضعیت درخواست‌ها"}
            </h2>
          </div>
          <span>{queue.total.toLocaleString("fa-IR")} تیکت</span>
        </div>
        <div
          className="ticket-status-tabs"
          role="group"
          aria-label="فیلتر وضعیت تیکت"
        >
          {statusTabs.map((item) => (
            <button
              key={item.value || "all"}
              type="button"
              aria-pressed={filters.status === item.value}
              onClick={() => setStatusTab(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <form className="ticket-filter-bar" onSubmit={applySearch}>
          <label className="ticket-search">
            <Search size={17} />
            <span className="sr-only">جست‌وجوی تیکت</span>
            <input
              value={filters.query}
              onChange={(event) =>
                setFilters({ ...filters, query: event.target.value })
              }
              placeholder="جست‌وجو با شماره یا عنوان"
            />
          </label>
          <Button type="submit" variant="secondary">
            جست‌وجو
          </Button>
          <div className="advanced-ticket-filters">
            <button
              type="button"
              aria-haspopup="dialog"
              aria-expanded={filtersOpen}
              onClick={() => setFiltersOpen(true)}
            >
              <SlidersHorizontal size={17} />
              فیلترها
            </button>
            {filtersOpen && (
              <div
                className="filter-sheet-layer"
                onMouseDown={() => setFiltersOpen(false)}
              >
                <section
                  className="filter-sheet"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="ticket-filter-title"
                  onMouseDown={(event) => event.stopPropagation()}
                >
                  <header>
                    <h3 id="ticket-filter-title">فیلتر و مرتب‌سازی</h3>
                    <button
                      ref={filtersCloseRef}
                      type="button"
                      aria-label="بستن فیلترها"
                      onClick={() => setFiltersOpen(false)}
                    >
                      <X size={18} />
                    </button>
                  </header>
                  <label>
                    اولویت
                    <select
                      value={filters.priority}
                      onChange={(event) => {
                        setPage(1);
                        setFilters({
                          ...filters,
                          priority: event.target.value,
                        });
                      }}
                    >
                      <option value="">همه اولویت‌ها</option>
                      {Object.entries(priorityLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    هشتگ
                    <select value={filters.tag} onChange={(event) => { setPage(1); setFilters({ ...filters, tag: event.target.value }); }}>
                      <option value="">همه هشتگ‌ها</option>
                      {tags.map((tag) => <option key={tag.id} value={tag.id}>#{tag.name}</option>)}
                    </select>
                  </label>
                  <label>
                    مرتب‌سازی
                    <select
                      value={filters.sort}
                      onChange={(event) => {
                        setPage(1);
                        setFilters({ ...filters, sort: event.target.value });
                      }}
                    >
                      <option value="recent">آخرین فعالیت</option>
                      <option value="newest">جدیدترین</option>
                      <option value="oldest">قدیمی‌ترین</option>
                      <option value="priority">اولویت</option>
                    </select>
                  </label>
                  {staff && (
                    <label>
                      نمای ذخیره‌شده
                      <select
                        defaultValue=""
                        onChange={(event) => applyView(event.target.value)}
                      >
                        <option value="">انتخاب نما</option>
                        {views.map((view) => (
                          <option key={view.id} value={view.id}>
                            {view.name}
                            {view.is_shared ? " · مشترک" : ""}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  {staff && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => void saveView()}
                    >
                      ذخیره این نما
                    </Button>
                  )}
                  <Button type="button" onClick={() => setFiltersOpen(false)}>
                    اعمال فیلترها
                  </Button>
                </section>
              </div>
            )}
          </div>
        </form>
        {manager && checked.length > 0 && (
          <div className="ticket-bulk-bar">
            <span>
              {checked.length.toLocaleString("fa-IR")} تیکت انتخاب شده
            </span>
            <Button type="button" onClick={() => setPendingBulk("IN_PROGRESS")}>
              شروع رسیدگی
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPendingBulk("RESOLVED")}
            >
              حل‌شده
            </Button>
          </div>
        )}
        <div className="ticket-history-list" aria-busy={loading}>
          {loading && (
            <>
              <div className="ticket-row-skeleton" />
              <div className="ticket-row-skeleton" />
              <div className="ticket-row-skeleton" />
            </>
          )}
          {!loading &&
            queue.items.map((ticket) => (
              <article className="history-ticket-row" key={ticket.id}>
                {manager && (
                  <input
                    type="checkbox"
                    aria-label={`انتخاب تیکت ${ticket.ticket_number}`}
                    checked={checked.includes(ticket.id)}
                    onChange={(event) =>
                      setChecked(
                        event.target.checked
                          ? [...checked, ticket.id]
                          : checked.filter((id) => id !== ticket.id),
                      )
                    }
                  />
                )}
                <button type="button" onClick={() => openTicket(ticket)}>
                  <div className="history-ticket-title">
                    <span className="ticket-number">
                      #{ticket.ticket_number}
                    </span>
                    <strong>{ticket.title}</strong>
                  </div>
                  <div className="history-ticket-meta">
                    <span
                      className={`status-badge ${ticket.status.toLowerCase()}`}
                    >
                      {statusLabels[ticket.status] ?? "نامشخص"}
                    </span>
                    <span
                      className={`priority-badge ${ticket.priority.toLowerCase()}`}
                    >
                      {priorityLabels[ticket.priority] ?? "نامشخص"}
                    </span>
                    {ticket.assignee_display_name && (
                      <span>{ticket.assignee_display_name}</span>
                    )}
                    <time>
                      آخرین فعالیت:{" "}
                      {new Date(
                        ticket.last_activity_at ?? ticket.created_at,
                      ).toLocaleString("fa-IR")}
                    </time>
                  </div>
                </button>
              </article>
            ))}
          {!loading && !queue.items.length && (
            <EmptyState
              title="تیکتی پیدا نشد"
              body="فیلترها را تغییر دهید یا یک درخواست جدید ثبت کنید."
              action={
                !staff ? (
                  <Button
                    type="button"
                    onClick={() => {
                      setComposerOpen(true);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    ثبت درخواست جدید
                  </Button>
                ) : undefined
              }
            />
          )}
        </div>
        {queue.total > queue.pageSize && (
          <div className="ticket-pagination">
            <Button
              type="button"
              variant="secondary"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              صفحه قبل
            </Button>
            <span>
              صفحه {page.toLocaleString("fa-IR")} از{" "}
              {Math.ceil(queue.total / queue.pageSize).toLocaleString("fa-IR")}
            </span>
            <Button
              type="button"
              variant="secondary"
              disabled={page >= Math.ceil(queue.total / queue.pageSize)}
              onClick={() => setPage(page + 1)}
            >
              صفحه بعد
            </Button>
          </div>
        )}
      </section>
      <ConfirmDialog
        open={Boolean(pendingBulk)}
        title="تغییر وضعیت گروهی"
        body={`وضعیت ${checked.length.toLocaleString("fa-IR")} تیکت انتخابی تغییر کند؟ این تغییر در تاریخچه هر تیکت ثبت می‌شود.`}
        confirmLabel="تأیید تغییر"
        onConfirm={() => void bulk()}
        onClose={() => setPendingBulk("")}
      />
    </section>
  );
}
