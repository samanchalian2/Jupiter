import { afterEach, describe, expect, it, vi } from 'vitest';
import { instrumentJupiterFetch } from './JupiterObservability';

afterEach(() => vi.unstubAllGlobals());
function fixture() {
  vi.stubGlobal('location', { origin: 'http://localhost:5173' });
  const observer = {
    capture: vi.fn(async () => null),
    reportApiFailure: vi.fn(async () => null),
    trace: () => ({ traceId: 'a'.repeat(32), spanId: 'b'.repeat(16), traceparent: `00-${'a'.repeat(32)}-${'b'.repeat(16)}-01` }),
  };
  return observer;
}
describe('Jupiter fetch observation', () => {
  it('preserves response/body and forwards correlation without recording content', async () => {
    const observer = fixture(), response = new Response('{"secret":"private ticket"}', { status: 201 });
    const transport = vi.fn<typeof fetch>(async () => response);
    const wrapped = instrumentJupiterFetch(transport, observer, '/api/v1');
    expect(await wrapped('/api/v1/tickets/6d5a1b5c-60c5-44af-b289-7565ed975f06?token=private', { method: 'POST', body: 'secret body', headers: { authorization: 'Bearer private' } })).toBe(response);
    expect(await response.text()).toContain('private ticket');
    const init = transport.mock.calls[0][1] as RequestInit;
    expect(new Headers(init.headers).get('traceparent')).toMatch(/^00-[a-f0-9]{32}-[a-f0-9]{16}-01$/);
    expect(JSON.stringify(observer.capture.mock.calls)).not.toMatch(/private|secret body|token=/);
    expect(observer.capture).toHaveBeenCalledWith(expect.objectContaining({ httpStatus: 201, eventCode: 'api.operation', severity: 'INFO' }));
  });
  it('distinguishes an expected rejection from a server failure', async () => {
    const observer = fixture();
    await instrumentJupiterFetch(async () => new Response('', { status: 403 }), observer, '/api/v1')('/api/v1/tickets');
    expect(observer.capture).toHaveBeenLastCalledWith(expect.objectContaining({ severity: 'INFO', httpStatus: 403 }));
    await instrumentJupiterFetch(async () => new Response('', { status: 500 }), observer, '/api/v1')('/api/v1/tickets');
    expect(observer.capture).toHaveBeenLastCalledWith(expect.objectContaining({ severity: 'ERROR', httpStatus: 500 }));
  });
  it('does not observe Hub, unrelated services or signed attachment URLs', async () => {
    const observer = fixture(), transport = vi.fn(async () => new Response(''));
    const wrapped = instrumentJupiterFetch(transport, observer, '/api/v1');
    for (const url of ['/api/v1/observability/events/batch', 'https://files.example/download?secret=one', '/other-api/test']) await wrapped(url);
    expect(transport).toHaveBeenCalledTimes(3);
    expect(observer.capture).not.toHaveBeenCalled();
  });
  it('keeps the original network failure and discards late old-account completions', async () => {
    const observer = fixture(), failure = new TypeError('network failure');
    await expect(instrumentJupiterFetch(async () => { throw failure; }, observer, '/api/v1')('/api/v1/tickets')).rejects.toBe(failure);
    expect(observer.reportApiFailure).toHaveBeenCalledTimes(1);
    let identity = 'old';
    await instrumentJupiterFetch(async () => { identity = 'new'; return new Response(''); }, observer, '/api/v1', () => identity)('/api/v1/tickets');
    expect(observer.capture).not.toHaveBeenCalled();
  });
});
