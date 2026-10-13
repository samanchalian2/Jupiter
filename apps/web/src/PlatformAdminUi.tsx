import { ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';

export type PlatformListState = {
  query: string;
  status: string;
  page: number;
  pageSize: number;
  setQuery: (value: string) => void;
  setStatus: (value: string) => void;
  setPage: (value: number) => void;
  setPageSize: (value: number) => void;
  reset: () => void;
};

const allowedPageSizes = [10, 25, 50];

export function usePlatformListState(prefix: string): PlatformListState {
  const [params, setParams] = useSearchParams();
  const numericPage = Number(params.get(`${prefix}Page`) ?? 1);
  const numericSize = Number(params.get(`${prefix}Size`) ?? 10);
  const page = Number.isInteger(numericPage) && numericPage > 0 ? numericPage : 1;
  const pageSize = allowedPageSizes.includes(numericSize) ? numericSize : 10;
  const update = (key: string, value: string | null, resetPage = true) => {
    const next = new URLSearchParams(params);
    if (value) next.set(`${prefix}${key}`, value);
    else next.delete(`${prefix}${key}`);
    if (resetPage && key !== 'Page') next.delete(`${prefix}Page`);
    setParams(next, { replace: true });
  };
  return {
    query: params.get(`${prefix}Q`) ?? '',
    status: params.get(`${prefix}Status`) ?? 'ALL',
    page,
    pageSize,
    setQuery: (value) => update('Q', value),
    setStatus: (value) => update('Status', value === 'ALL' ? null : value),
    setPage: (value) => update('Page', value > 1 ? String(value) : null, false),
    setPageSize: (value) => update('Size', value === 10 ? null : String(value)),
    reset: () => {
      const next = new URLSearchParams(params);
      ['Q', 'Status', 'Page', 'Size'].forEach((key) => next.delete(`${prefix}${key}`));
      setParams(next, { replace: true });
    },
  };
}

export function normalizePlatformSearch(value: unknown) {
  return String(value ?? '').trim().toLocaleLowerCase('fa-IR');
}

export function paginatePlatformItems<T>(items: T[], page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  return {
    items: items.slice((safePage - 1) * pageSize, safePage * pageSize),
    page: safePage,
    totalPages,
  };
}

export function PlatformFilterToolbar({
  state,
  searchLabel,
  searchPlaceholder,
  statusLabel = 'وضعیت',
  statusOptions,
  resultCount,
  children,
}: {
  state: PlatformListState;
  searchLabel: string;
  searchPlaceholder: string;
  statusLabel?: string;
  statusOptions?: { value: string; label: string }[];
  resultCount: number;
  children?: ReactNode;
}) {
  const filtered = Boolean(state.query || state.status !== 'ALL');
  return (
    <div className="platform-filter-toolbar" role="search" aria-label="فیلتر فهرست">
      <label className="platform-search-field">
        <span>{searchLabel}</span>
        <input
          type="search"
          value={state.query}
          onChange={(event) => state.setQuery(event.target.value)}
          placeholder={searchPlaceholder}
        />
      </label>
      {statusOptions && (
        <label>
          <span>{statusLabel}</span>
          <select value={state.status} onChange={(event) => state.setStatus(event.target.value)}>
            <option value="ALL">همه</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      )}
      {children}
      <p className="platform-result-count" role="status">
        {resultCount.toLocaleString('fa-IR')} نتیجه
      </p>
      {filtered && <button type="button" className="ghost" onClick={state.reset}>پاک‌کردن فیلترها</button>}
    </div>
  );
}

export function PlatformPagination({ state, totalItems }: { state: PlatformListState; totalItems: number }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / state.pageSize));
  const page = Math.min(state.page, totalPages);
  if (totalItems <= 10) return null;
  return (
    <nav className="platform-pagination" aria-label="صفحه‌بندی فهرست">
      <label>
        تعداد در صفحه
        <select value={state.pageSize} onChange={(event) => state.setPageSize(Number(event.target.value))}>
          {allowedPageSizes.map((size) => <option key={size} value={size}>{size.toLocaleString('fa-IR')}</option>)}
        </select>
      </label>
      <div>
        <button type="button" className="secondary" disabled={page <= 1} onClick={() => state.setPage(page - 1)}>قبلی</button>
        <span>صفحهٔ {page.toLocaleString('fa-IR')} از {totalPages.toLocaleString('fa-IR')}</span>
        <button type="button" className="secondary" disabled={page >= totalPages} onClick={() => state.setPage(page + 1)}>بعدی</button>
      </div>
    </nav>
  );
}

export function PlatformNoResults({ filtered, empty }: { filtered: boolean; empty: string }) {
  return (
    <div className="platform-no-results" role="status">
      <strong>{filtered ? 'نتیجه‌ای با این فیلتر پیدا نشد' : empty}</strong>
      <p>{filtered ? 'عبارت جست‌وجو یا وضعیت انتخاب‌شده را تغییر دهید.' : 'پس از ثبت اولین مورد، اطلاعات در این بخش نمایش داده می‌شود.'}</p>
    </div>
  );
}
