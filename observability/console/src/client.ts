/** Host injects authentication/transport. This package knows no product sessions. */
export interface OperationsClient { request(path: string, init?: RequestInit): Promise<Response> }
export interface Filters { hours: number; q: string; severity: string; category: string; release: string; tenant: string; page: number }
export type Resource = 'events' | 'issues' | 'incidents' | 'feedback' | 'alerts';
export const initialFilters: Filters = { hours: 24, q: '', severity: '', category: '', release: '', tenant: '', page: 1 };
export function scopeQuery(environmentId: string, filter: Filters, now = Date.now()) {
  const query = new URLSearchParams({ environmentId, from: new Date(now - filter.hours * 3600000).toISOString(), to: new Date(now).toISOString(), page: String(filter.page), pageSize: '25' });
  for (const [key, value] of Object.entries({ q: filter.q.trim(), severity: filter.severity, category: filter.category, release: filter.release.trim(), tenantReference: filter.tenant.trim() })) if (value) query.set(key, value);
  return query;
}
export async function result<T>(response: Response): Promise<T> {
  if (!response.ok) {
    // Provider/SQL/raw HTTP bodies must never become an operator-facing error.
    throw new Error(response.status === 401 ? 'نشست پایان یافته؛ دوباره وارد شوید.' : response.status === 403 ? 'برای این برنامه یا محدوده دسترسی ندارید.' : response.status === 429 ? 'تعداد درخواست زیاد است؛ کمی بعد تلاش کنید.' : 'عملیات انجام نشد؛ دوباره تلاش کنید.');
  }
  return response.json() as Promise<T>;
}
