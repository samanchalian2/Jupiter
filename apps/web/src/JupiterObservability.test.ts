import { afterEach, describe, expect, it, vi } from 'vitest';
import { instrumentJupiterFetch } from './JupiterObservability';

afterEach(() => vi.unstubAllGlobals());
function fixture() {
  vi.stubGlobal('location', { origin: 'http://localhost:5173' });
  const observer = {
    capture: vi.fn(async () => null),
    reportApiFailure: vi.fn(async () => null),
    notifyApiConnectivity: vi.fn(),
    notifyAuthenticatedActivity: vi.fn(),
    trace: () => ({ traceId: 'a'.repeat(32), spanId: 'b'.repeat(16), traceparent: `00-${'a'.repeat(32)}-${'b'.repeat(16)}-01` }),
  };
  return observer;
}
describe('Jupiter fetch observation', () => {
  it('notifies same-scope activity before dispatch and API connectivity only after a successful response',async()=>{
    const observer=fixture(),scope={applicationId:crypto.randomUUID(),environmentId:crypto.randomUUID(),actorReference:'current-actor',tenantReference:'current-tenant'},response=new Response('committed',{status:201});
    const transport=vi.fn<typeof fetch>(async()=>{expect(observer.notifyAuthenticatedActivity).toHaveBeenCalledExactlyOnceWith(scope);expect(observer.notifyApiConnectivity).not.toHaveBeenCalled();return response;});
    const request=instrumentJupiterFetch(transport,observer,'/api/v1',()=>JSON.stringify(scope),()=>scope);
    expect(await request('/api/v1/tickets',{method:'POST'})).toBe(response);expect(transport).toHaveBeenCalledTimes(1);expect(observer.notifyApiConnectivity).toHaveBeenCalledExactlyOnceWith(scope,true);
    observer.notifyApiConnectivity.mockClear();await instrumentJupiterFetch(async()=>new Response(null,{status:503}),observer,'/api/v1',()=>JSON.stringify(scope),()=>scope)('/api/v1/tickets');expect(observer.notifyApiConnectivity).not.toHaveBeenCalled();
  });
  it('does not notify connectivity from a late old-identity response or from Hub/self calls',async()=>{
    const observer=fixture(),scope={applicationId:crypto.randomUUID(),environmentId:crypto.randomUUID(),actorReference:'old-actor',tenantReference:'tenant'};let identity='old',complete!:(response:Response)=>void;
    const request=instrumentJupiterFetch(async()=>new Promise<Response>(done=>complete=done),observer,'/api/v1',()=>identity,()=>scope),pending=request('/api/v1/tickets');identity='new';complete(new Response('ok'));await pending;expect(observer.notifyApiConnectivity).not.toHaveBeenCalled();expect(observer.capture).not.toHaveBeenCalled();
    observer.notifyAuthenticatedActivity.mockClear();await instrumentJupiterFetch(async()=>new Response('ok'),observer,'/api/v1',()=>identity,()=>scope)('/api/v1/observability/events/batch');expect(observer.notifyAuthenticatedActivity).not.toHaveBeenCalled();expect(observer.notifyApiConnectivity).not.toHaveBeenCalled();
  });
  it('contains throwing and rejecting recovery observers without replacing business success or failure',async()=>{
    const observer=fixture(),scope={applicationId:crypto.randomUUID(),environmentId:crypto.randomUUID(),actorReference:'actor',tenantReference:null},response=new Response('committed',{status:201}),failure=new TypeError('original failure');
    observer.notifyAuthenticatedActivity.mockImplementation(()=>{throw Error('Controlled notification failure');});observer.notifyApiConnectivity.mockImplementation(()=>Promise.reject(Error('Controlled asynchronous failure')));
    const transport=vi.fn<typeof fetch>(async()=>response);expect(await instrumentJupiterFetch(transport,observer,'/api/v1',()=>JSON.stringify(scope),()=>scope)('/api/v1/tickets')).toBe(response);expect(transport).toHaveBeenCalledTimes(1);
    await expect(instrumentJupiterFetch(async()=>{throw failure;},observer,'/api/v1',()=>JSON.stringify(scope),()=>scope)('/api/v1/tickets')).rejects.toBe(failure);await new Promise(done=>setTimeout(done,10));expect(observer.notifyApiConnectivity).toHaveBeenCalledTimes(1);
  });
  it('dispatches once with original arguments when trace preparation fails', async () => {
    const observer=fixture(),response=new Response('business response',{status:201});
    observer.trace=()=>{throw Error('private observer failure');};
    const transport=vi.fn<typeof fetch>(async()=>response),init={method:'POST',body:'private input'};
    await expect(instrumentJupiterFetch(transport,observer,'/api/v1')('/api/v1/tickets',init)).resolves.toBe(response);
    expect(transport).toHaveBeenCalledExactlyOnceWith('/api/v1/tickets',init);
    expect(observer.capture).not.toHaveBeenCalled();expect(observer.reportApiFailure).not.toHaveBeenCalled();
  });
  it('does not block dispatch or attribute telemetry when the identity snapshot fails', async () => {
    const observer=fixture(),response=new Response('ok'),transport=vi.fn<typeof fetch>(async()=>response);
    await expect(instrumentJupiterFetch(transport,observer,'/api/v1',()=>{throw Error('identity unavailable');})('/api/v1/tickets')).resolves.toBe(response);
    expect(transport).toHaveBeenCalledTimes(1);expect(observer.capture).not.toHaveBeenCalled();
  });
  it('keeps the response and original network error when the final identity check fails', async () => {
    const observer=fixture(),response=new Response('ok'),failure=new TypeError('original network failure');
    const identity=()=>{if(++calls%2===0)throw Error('identity unavailable');return 'old';};let calls=0;
    const transport=vi.fn<typeof fetch>(async()=>response);
    await expect(instrumentJupiterFetch(transport,observer,'/api/v1',identity)('/api/v1/tickets')).resolves.toBe(response);
    expect(transport).toHaveBeenCalledTimes(1);
    await expect(instrumentJupiterFetch(async()=>{throw failure;},observer,'/api/v1',identity)('/api/v1/tickets')).rejects.toBe(failure);
    expect(observer.capture).not.toHaveBeenCalled();expect(observer.reportApiFailure).not.toHaveBeenCalled();
  });
  it('does not replace a committed response or report a false network failure when capture throws', async () => {
    const observer=fixture(),response=new Response('committed',{status:201}),transport=vi.fn<typeof fetch>(async()=>response);
    observer.capture.mockImplementation(()=>{throw Error('private capture failure');});
    await expect(instrumentJupiterFetch(transport,observer,'/api/v1')('/api/v1/tickets',{method:'POST'})).resolves.toBe(response);
    expect(await response.text()).toBe('committed');expect(transport).toHaveBeenCalledTimes(1);expect(observer.reportApiFailure).not.toHaveBeenCalled();
  });
  it('keeps the exact business rejection if failure reporting throws', async () => {
    const observer=fixture(),failure=new TypeError('business failure'),transport=vi.fn<typeof fetch>(async()=>{throw failure;});
    observer.reportApiFailure.mockImplementation(()=>{throw Error('private reporter failure');});
    await expect(instrumentJupiterFetch(transport,observer,'/api/v1')('/api/v1/tickets')).rejects.toBe(failure);
    expect(transport).toHaveBeenCalledTimes(1);expect(observer.reportApiFailure).toHaveBeenCalledTimes(1);
  });
  it('consumes rejected diagnostic promises without replacing business outcomes', async () => {
    const observer=fixture(),response=new Response('ok'),failure=new TypeError('business failure');
    observer.capture.mockRejectedValue(Error('private asynchronous capture'));
    observer.reportApiFailure.mockRejectedValue(Error('private asynchronous reporter'));
    await expect(instrumentJupiterFetch(async()=>response,observer,'/api/v1')('/api/v1/tickets')).resolves.toBe(response);
    await expect(instrumentJupiterFetch(async()=>{throw failure;},observer,'/api/v1')('/api/v1/tickets')).rejects.toBe(failure);
    await new Promise(resolve=>setTimeout(resolve,10)); // Vitest must see no unhandled rejection.
  });
  it('does not await stalled diagnostic promises', async () => {
    const observer=fixture(),response=new Response('ok');observer.capture.mockImplementation(()=>new Promise(()=>undefined));
    await expect(instrumentJupiterFetch(async()=>response,observer,'/api/v1')('/api/v1/tickets')).resolves.toBe(response);
  },1000);
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
