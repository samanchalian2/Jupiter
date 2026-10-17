import { describe, expect, it } from 'vitest';
import { initialFilters, result, scopeQuery } from './client.js';
describe('independent Console client',()=>{
 it('binds explicit environment and encodes filters without SQL fragments',()=>{const query=scopeQuery('env-one',{...initialFilters,q:'متن & test',tenant:'tenant/x',release:'v2'},Date.UTC(2026,9,17));expect(query.get('environmentId')).toBe('env-one');expect(query.get('q')).toBe('متن & test');expect(query.get('tenantReference')).toBe('tenant/x');expect(query.get('from')).toBe('2026-10-16T00:00:00.000Z');expect(query.get('pageSize')).toBe('25');});
 it('does not expose provider/SQL failure bodies',async()=>{await expect(result(new Response('secret SQL',{status:503}))).rejects.toThrow('عملیات انجام نشد');await expect(result(new Response('private',{status:403}))).rejects.toThrow('دسترسی ندارید');});
 it('returns the authorized projection unchanged',async()=>{await expect(result(new Response('{"items":[]}'))).resolves.toEqual({items:[]});});
});
