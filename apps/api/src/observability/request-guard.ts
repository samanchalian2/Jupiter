export type ResponseLike = { setHeader(name: string, value: string): void };

export class FixedWindowRateLimiter {
  private readonly entries = new Map<string, { count: number; windowStartedAt: number }>();
  constructor(private readonly limit = 120, private readonly windowMs = 60_000) {}
  allow(key: string, now = Date.now()) {
    const current = this.entries.get(key);
    if (!current || now - current.windowStartedAt >= this.windowMs) {
      this.entries.set(key, { count: 1, windowStartedAt: now });
      return true;
    }
    current.count += 1;
    return current.count <= this.limit;
  }
}

export function applySecurityHeaders(response: ResponseLike) {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.setHeader('Cross-Origin-Resource-Policy', 'same-site');
}
