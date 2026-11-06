import { describe, expect, it } from 'vitest';
import { requestKey } from './requestKey';
import { readFileSync } from 'node:fs';

describe('HTTP Preview request keys', () => {
  it('wires the composer final submission to the HTTP-safe generator',()=>{
    const source=readFileSync(new URL('./TicketComposer.tsx',import.meta.url),'utf8');
    expect(source).toContain("import { requestKey as idempotencyKey } from './requestKey'");
    expect(source).toContain('submissionRef.current={key:idempotencyKey(),payload:fingerprint}');
    expect(source).not.toContain('Math.random()');
  });
  it('uses secure random bytes when randomUUID is unavailable', () => {
    const source = {getRandomValues: crypto.getRandomValues.bind(crypto)};
    const keys = new Set(Array.from({length:100}, () => requestKey(source)));
    expect(keys.size).toBe(100);
    for (const key of keys) expect(key).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
  it('preserves secure-context native generation', () => {
    expect(requestKey({randomUUID:()=> 'native-key' as `${string}-${string}-${string}-${string}-${string}`,getRandomValues:crypto.getRandomValues.bind(crypto)})).toBe('native-key');
  });
});
