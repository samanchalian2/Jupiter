import { describe, expect, it } from 'vitest';
import { redactForAi } from '../src/ai/redactor.js';
describe('AI redactor',()=>it('removes basic direct identifiers',()=>expect(redactForAi('mail a@b.com and 09123456789')).toBe('mail [email redacted] and [number redacted]')));
