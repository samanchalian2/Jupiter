import { describe, expect, it } from 'vitest';
import { assertTransition } from '../src/tickets/ticket-lifecycle.js';
describe('ticket lifecycle', () => {
  it('permits only canonical transitions', () => {
    expect(() => assertTransition('DRAFT','OPEN')).not.toThrow();
    expect(() => assertTransition('IN_PROGRESS','RESOLVED')).not.toThrow();
    expect(() => assertTransition('OPEN','CLOSED')).toThrow();
    expect(() => assertTransition('CLOSED','RESOLVED')).toThrow();
  });
});
