import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Bot,
  Headphones,
  PackageCheck,
  ReceiptText,
  TicketPlus,
} from "lucide-react";
import type { Actor } from "./App";
import { request } from "./App";
import { ContextualHelpTrigger } from "./ContextualHelp";
import {
  Alert,
  Button,
  Card,
  EmptyState,
  LoadingState,
  PageHeader,
  SectionHeader,
  StatusBadge,
} from "./ui";

type Pool = {
  poolCode: "SUPPORT" | "AI";
  periodEndsAt: string;
  monthlyGranted: number;
  monthlyReserved: number;
  monthlySettled: number;
  monthlyRemaining: number;
  purchasedGranted: number;
  purchasedReserved: number;
  purchasedSettled: number;
  purchasedRemaining: number;
};
type Package = {
  id: string;
  code: string;
  name: string;
  description: string;
  pool_code: "SUPPORT" | "AI";
  unit_count: number;
  price_irt: string;
  validity_days: number;
};
type Allocation = {
  id: string;
  package_name_snapshot: string;
  pool_code: "SUPPORT" | "AI";
  granted_units: number;
  starts_at: string;
  expires_at: string;
  status: string;
};
type Capacity = {
  pools: Pool[];
  packages: Package[];
  allocations: Allocation[];
};
type SupportCatalog = {
  display_name: string;
  description: string;
  status: "ACTIVE" | "SUSPENDED";
  sla_minutes: number;
};
type SupportCase = {
  id: string;
  ticket_id: string;
  status: string;
  request_note?: string;
  sla_due_at?: string;
  created_at: string;
  assigned_agent_name?: string;
};
type PaymentOrder = {
  id: string;
  packageName: string;
  poolCode: "SUPPORT" | "AI";
  unitCount: number;
  amountIrt: string;
  currency: "IRT";
  status: string;
  expiresAt: string;
  paidAt?: string;
  createdAt: string;
  paymentUrl?: string;
};
type PaymentState = {
  payment: {
    availability: "ENABLED" | "DISABLED";
    mode: "LOCAL_TEST" | "LIVE";
  };
  orders: PaymentOrder[];
};
type Receipt = {
  orderId: string;
  packageName: string;
  poolCode: "SUPPORT" | "AI";
  unitCount: number;
  amountIrt: string;
  paidAt: string;
  provider: string;
  reference: string;
  officialInvoice: false;
};

const n = (value: number | string) =>
  new Intl.NumberFormat("fa-IR").format(Number(value));
const money = (value: string) => `${n(value)} تومان`;
const date = (value?: string) =>
  value ? new Date(value).toLocaleString("fa-IR") : "—";
const poolLabel = {
  SUPPORT: "پشتیبانی انسانی",
  AI: "قابلیت‌های هوشمند",
} as const;
const orderLabel: Record<string, string> = {
  CREATED: "ایجادشده",
  CREATING: "در حال اتصال",
  PENDING: "در انتظار پرداخت",
  VERIFYING: "در حال تأیید",
  PAID: "پرداخت‌شده",
  FAILED: "ناموفق",
  CANCELLED: "لغوشده",
  EXPIRED: "منقضی",
};
export const personalSupportCaseLabels: Record<string, string> = {
  QUEUED: "در صف",
  ACCEPTED: "پذیرفته‌شده",
  IN_PROGRESS: "در حال رسیدگی",
  WAITING_FOR_USER: "منتظر پاسخ شما",
  COMPLETED: "تکمیل‌شده",
  CANCELLED: "لغوشده",
  REJECTED: "ردشده",
  REVOKED: "متوقف‌شده",
};

function usePersonalData(actor: Actor) {
  const [capacity, setCapacity] = useState<Capacity | null>(null);
  const [support, setSupport] = useState<SupportCatalog | null>(null);
  const [cases, setCases] = useState<SupportCase[]>([]);
  const [payments, setPayments] = useState<PaymentState | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [nextCapacity, nextSupport, nextCases, nextPayments] =
        await Promise.all([
          request(
            "/personal/capacity/summary",
            actor.session,
            actor.organizationId,
          ),
          request(
            "/personal/support/catalog",
            actor.session,
            actor.organizationId,
          ),
          request(
            "/personal/support/cases",
            actor.session,
            actor.organizationId,
          ),
          request("/personal/payments", actor.session, actor.organizationId),
        ]);
      setCapacity(nextCapacity as Capacity);
      setSupport(nextSupport as SupportCatalog);
      setCases(nextCases as SupportCase[]);
      setPayments(nextPayments as PaymentState);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "دریافت اطلاعات فضای شخصی ناموفق بود.",
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, [actor.organizationId, actor.session.accessToken]);
  return { capacity, support, cases, payments, error, loading, load };
}

export function PersonalDashboard({ actor }: { actor: Actor }) {
  const data = usePersonalData(actor);
  if (data.loading)
    return (
      <section className="page personal-workspace">
        <LoadingState />
      </section>
    );
  return (
    <section className="page personal-workspace">
      <PageHeader
        eyebrow="فضای شخصی"
        title="خدمات ژوپیتر برای شما"
        description="تیکت‌های شخصی، دستیار هوشمند و کمک کارشناسان ژوپیتر را از یک فضای ساده پیگیری کنید."
        action={
          <ContextualHelpTrigger
            actor={actor}
            relatedFeature="PERSONAL_WORKSPACE"
            label="راهنمای فضای شخصی"
          />
        }
      />
      {data.error && <Alert variant="danger">{data.error}</Alert>}
      <div className="personal-quick-actions">
        <Link className="ui-button primary" to="/tickets/new">
          <TicketPlus size={17} />
          ثبت تیکت جدید
        </Link>
        <Link className="ui-button secondary" to="/tickets">
          پیگیری تیکت‌ها
        </Link>
        <Link className="ui-button secondary" to="/services">
          بسته‌ها و خدمات
        </Link>
      </div>
      <section className="personal-capacity-grid">
        {data.capacity?.pools.map((pool) => (
          <Card key={pool.poolCode} className="personal-capacity-card">
            <div className="personal-service-icon">
              {pool.poolCode === "AI" ? <Bot /> : <Headphones />}
            </div>
            <div>
              <h2>{poolLabel[pool.poolCode]}</h2>
              <p>
                {pool.poolCode === "AI"
                  ? "پیشنهادهای هوشمند هنگام ثبت و بررسی تیکت"
                  : "ارجاع یک تیکت به کارشناس پشتیبانی ژوپیتر"}
              </p>
            </div>
            <strong>
              {n(pool.monthlyRemaining + pool.purchasedRemaining)} واحد در دسترس
            </strong>
            <small>
              {n(pool.monthlyRemaining)} ماهانه · {n(pool.purchasedRemaining)}{" "}
              خریداری‌شده
            </small>
          </Card>
        ))}
      </section>
      <Card>
        <SectionHeader
          title="وضعیت پشتیبانی"
          description={data.support?.description}
          action={
            <StatusBadge
              tone={data.support?.status === "ACTIVE" ? "success" : "warning"}
            >
              {data.support?.status === "ACTIVE" ? "فعال" : "موقتاً غیرفعال"}
            </StatusBadge>
          }
        />
        {data.cases.length ? (
          <p>
            شما{" "}
            {n(
              data.cases.filter(
                (item) =>
                  !["CLOSED", "CANCELLED", "REJECTED", "REVOKED"].includes(
                    item.status,
                  ),
              ).length,
            )}{" "}
            درخواست پشتیبانی فعال دارید. جزئیات هر درخواست در تیکت مربوط نمایش
            داده می‌شود.
          </p>
        ) : (
          <p>هنوز تیکتی را برای کمک مستقیم کارشناسان ژوپیتر ارسال نکرده‌اید.</p>
        )}
        <p className="hint">
          حتی با پایان ظرفیت هوشمند یا پشتیبانی، ثبت و پیگیری دستی تیکت همیشه در
          دسترس است.
        </p>
      </Card>
    </section>
  );
}

export function PersonalServices({ actor }: { actor: Actor }) {
  const data = usePersonalData(actor);
  const [searchParams, setSearchParams] = useSearchParams();
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  useEffect(() => {
    const state = searchParams.get("payment");
    if (!state) return;
    setNotice(
      state === "paid"
        ? "پرداخت تأیید شد و ظرفیت بسته به حساب شما افزوده شد."
        : state === "cancelled"
          ? "پرداخت لغو شد؛ مبلغی به‌عنوان خرید ثبت نشده است."
          : state === "pending"
            ? "پرداخت هنوز در حال بررسی است."
            : "تأیید پرداخت کامل نشد؛ وضعیت سفارش را دوباره بررسی کنید.",
    );
    void data.load();
    setSearchParams({}, { replace: true });
  }, []);
  const activeAllocations = useMemo(
    () =>
      data.capacity?.allocations.filter(
        (item) =>
          item.status === "ACTIVE" && new Date(item.expires_at) > new Date(),
      ) ?? [],
    [data.capacity],
  );
  const buy = async (item: Package) => {
    setBusy(item.id);
    setNotice("");
    try {
      const order = (await request(
        "/personal/payments/orders",
        actor.session,
        actor.organizationId,
        {
          method: "POST",
          headers: { "idempotency-key": crypto.randomUUID() },
          body: JSON.stringify({ packageId: item.id }),
        },
      )) as PaymentOrder;
      if (!order.paymentUrl) throw new Error("نشانی پرداخت دریافت نشد.");
      window.location.assign(order.paymentUrl);
    } catch (cause) {
      setNotice(
        cause instanceof Error ? cause.message : "ایجاد سفارش ناموفق بود.",
      );
      setBusy("");
    }
  };
  const cancel = async (id: string) => {
    setBusy(id);
    try {
      await request(
        `/personal/payments/orders/${id}/cancel`,
        actor.session,
        actor.organizationId,
        { method: "POST" },
      );
      setNotice("سفارش لغو شد.");
      await data.load();
    } catch (cause) {
      setNotice(
        cause instanceof Error ? cause.message : "لغو سفارش ناموفق بود.",
      );
    } finally {
      setBusy("");
    }
  };
  const showReceipt = async (id: string) => {
    setBusy(id);
    try {
      setReceipt(
        (await request(
          `/personal/payments/orders/${id}/receipt`,
          actor.session,
          actor.organizationId,
        )) as Receipt,
      );
    } catch (cause) {
      setNotice(
        cause instanceof Error ? cause.message : "دریافت رسید ناموفق بود.",
      );
    } finally {
      setBusy("");
    }
  };
  const cancelSupport = async (id: string) => {
    setBusy(id);
    try {
      await request(
        `/personal/support/cases/${id}/cancel`,
        actor.session,
        actor.organizationId,
        { method: "POST" },
      );
      setNotice("درخواست پشتیبانی لغو و ظرفیت رزروشده آزاد شد.");
      await data.load();
    } catch (cause) {
      setNotice(
        cause instanceof Error
          ? cause.message
          : "لغو درخواست پشتیبانی ناموفق بود.",
      );
    } finally {
      setBusy("");
    }
  };
  return (
    <section className="page personal-workspace">
      <PageHeader
        eyebrow="خدمات شخصی"
        title="ظرفیت و بسته‌های شما"
        description="مصرف ماهانه، بسته‌های خریداری‌شده و سوابق پرداخت را شفاف ببینید."
        action={
          <ContextualHelpTrigger
            actor={actor}
            relatedFeature="PERSONAL_CAPACITY"
            label="راهنمای ظرفیت و خرید"
          />
        }
      />
      {notice && (
        <Alert variant={notice.includes("تأیید شد") ? "success" : "info"}>
          {notice}
        </Alert>
      )}
      {data.error && <Alert variant="danger">{data.error}</Alert>}
      {data.loading ? (
        <LoadingState />
      ) : (
        <>
          <section className="personal-capacity-grid">
            {data.capacity?.pools.map((pool) => (
              <Card key={pool.poolCode}>
                <SectionHeader
                  title={poolLabel[pool.poolCode]}
                  description={`پایان دوره ماهانه: ${date(pool.periodEndsAt)}`}
                />
                <dl className="personal-summary">
                  <div>
                    <dt>باقی‌مانده ماهانه</dt>
                    <dd>
                      {n(pool.monthlyRemaining)} از {n(pool.monthlyGranted)}
                    </dd>
                  </div>
                  <div>
                    <dt>باقی‌مانده بسته‌ها</dt>
                    <dd>
                      {n(pool.purchasedRemaining)} از {n(pool.purchasedGranted)}
                    </dd>
                  </div>
                  <div>
                    <dt>مصرف قطعی</dt>
                    <dd>{n(pool.monthlySettled + pool.purchasedSettled)}</dd>
                  </div>
                  <div>
                    <dt>در حال پردازش</dt>
                    <dd>{n(pool.monthlyReserved + pool.purchasedReserved)}</dd>
                  </div>
                </dl>
              </Card>
            ))}
          </section>
          <Card>
            <SectionHeader
              title="بسته‌های قابل خرید"
              description={
                data.payments?.payment.availability === "ENABLED"
                  ? "پس از پرداخت موفق، ظرفیت به‌صورت خودکار افزوده می‌شود."
                  : "پرداخت آنلاین فعلاً در دسترس نیست."
              }
            />
            <div className="personal-package-list">
              {data.capacity?.packages.map((item) => (
                <article key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <p>{item.description}</p>
                    <small>
                      {n(item.unit_count)} واحد {poolLabel[item.pool_code]} ·
                      اعتبار {n(item.validity_days)} روز
                    </small>
                  </div>
                  <div>
                    <b>{money(item.price_irt)}</b>
                    <Button
                      type="button"
                      loading={busy === item.id}
                      disabled={
                        data.payments?.payment.availability !== "ENABLED"
                      }
                      onClick={() => void buy(item)}
                    >
                      خرید بسته
                    </Button>
                  </div>
                </article>
              ))}
              {!data.capacity?.packages.length && (
                <EmptyState
                  title="بسته‌ای موجود نیست"
                  body="بسته‌های فعال پس از انتشار مدیر پلتفرم اینجا نمایش داده می‌شوند."
                />
              )}
            </div>
          </Card>
          <Card>
            <SectionHeader
              title="ظرفیت‌های فعال"
              description="بسته‌های خریداری‌شده تا تاریخ انقضا قابل استفاده‌اند."
            />
            <div className="personal-allocation-list">
              {activeAllocations.map((item) => (
                <p key={item.id}>
                  <PackageCheck size={17} />
                  <span>
                    <strong>{item.package_name_snapshot}</strong>
                    <small>
                      {n(item.granted_units)} واحد {poolLabel[item.pool_code]} ·
                      تا {date(item.expires_at)}
                    </small>
                  </span>
                </p>
              ))}
              {!activeAllocations.length && (
                <p className="hint">
                  بستهٔ فعالی ندارید؛ سهمیه ماهانه همچنان برقرار است.
                </p>
              )}
            </div>
          </Card>
          <Card>
            <SectionHeader
              title="سفارش‌ها و رسیدها"
              description="رسید ساده پرداخت، فاکتور رسمی مالیاتی نیست."
              action={
                <ContextualHelpTrigger
                  actor={actor}
                  relatedFeature="PERSONAL_PAYMENT"
                  label="راهنمای پرداخت و رسید"
                />
              }
            />
            <div className="personal-order-list">
              {data.payments?.orders.map((order) => (
                <article key={order.id}>
                  <div>
                    <strong>{order.packageName}</strong>
                    <small>
                      {money(order.amountIrt)} · {date(order.createdAt)}
                    </small>
                  </div>
                  <StatusBadge
                    tone={
                      order.status === "PAID"
                        ? "success"
                        : ["FAILED", "EXPIRED"].includes(order.status)
                          ? "danger"
                          : order.status === "PENDING"
                            ? "warning"
                            : "neutral"
                    }
                  >
                    {orderLabel[order.status] ?? order.status}
                  </StatusBadge>
                  <div className="inline-actions">
                    {order.status === "PAID" && (
                      <Button
                        variant="secondary"
                        loading={busy === order.id}
                        onClick={() => void showReceipt(order.id)}
                      >
                        <ReceiptText size={16} />
                        نمایش رسید
                      </Button>
                    )}
                    {["CREATED", "FAILED", "PENDING"].includes(
                      order.status,
                    ) && (
                      <Button
                        variant="ghost"
                        loading={busy === order.id}
                        onClick={() => void cancel(order.id)}
                      >
                        لغو سفارش
                      </Button>
                    )}
                  </div>
                </article>
              ))}
              {!data.payments?.orders.length && (
                <p className="hint">هنوز سفارشی ثبت نشده است.</p>
              )}
            </div>
            {receipt && (
              <aside className="personal-receipt" aria-label="رسید پرداخت">
                <h3>رسید پرداخت ژوپیتر</h3>
                <p>
                  <strong>{receipt.packageName}</strong> ·{" "}
                  {n(receipt.unitCount)} واحد {poolLabel[receipt.poolCode]}
                </p>
                <p>
                  {money(receipt.amountIrt)} · پرداخت در {date(receipt.paidAt)}
                </p>
                <p dir="ltr">Reference: {receipt.reference}</p>
                <small>
                  این رسید، تأیید پرداخت و تخصیص خدمت است و فاکتور رسمی مالیاتی
                  محسوب نمی‌شود.
                </small>
              </aside>
            )}
          </Card>
          <Card>
            <SectionHeader
              title="کمک کارشناس ژوپیتر"
              description={data.support?.description}
              action={
                <ContextualHelpTrigger
                  actor={actor}
                  relatedFeature="PERSONAL_SUPPORT"
                  label="راهنمای پشتیبانی شخصی"
                />
              }
            />
            <p>
              برای درخواست کمک، یک تیکت ارسال‌شده را باز کنید و گزینهٔ «کمک
              کارشناس ژوپیتر» را بزنید.
            </p>
            <div className="personal-case-list">
              {data.cases.map((item) => (
                <article key={item.id}>
                  <Link to={`/tickets/${item.ticket_id}?tab=conversation`}>
                    <span>
                      {personalSupportCaseLabels[item.status] ?? item.status}
                    </span>
                    <small>
                      {item.assigned_agent_name
                        ? `کارشناس: ${item.assigned_agent_name}`
                        : `ثبت: ${date(item.created_at)}`}
                    </small>
                  </Link>
                  {item.status === "QUEUED" && (
                    <Button
                      type="button"
                      variant="ghost"
                      loading={busy === item.id}
                      onClick={() => void cancelSupport(item.id)}
                    >
                      لغو درخواست
                    </Button>
                  )}
                </article>
              ))}
            </div>
          </Card>
        </>
      )}
    </section>
  );
}
