import { describe, expect, it } from 'vitest';
import { applySecurityHeaders, FixedWindowRateLimiter } from '../src/observability/request-guard.js';

describe('Request guard', () => {
  it('sets defensive browser headers', () => {
    const headers = new Map<string, string>();
    applySecurityHeaders({ setHeader: (name, value) => headers.set(name, value) });
    expect(headers.get('X-Frame-Options')).toBe('DENY');
    expect(headers.get('X-Content-Type-Options')).toBe('nosniff');
  });
  it('limits a client inside a fixed time window', () => {
    const limiter = new FixedWindowRateLimiter(2, 1000);
    expect(limiter.allow('client', 1)).toBe(true);
    expect(limiter.allow('client', 2)).toBe(true);
    expect(limiter.allow('client', 3)).toBe(false);
    expect(limiter.allow('client', 1002)).toBe(true);
  });
});
