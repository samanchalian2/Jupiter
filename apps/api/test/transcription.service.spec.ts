import { describe, expect, it } from 'vitest';
import { TranscriptionService } from '../src/transcription/transcription.service.js';

describe('Transcription job controls', () => {
  it('requeues only a requester-owned failed job and records the retry', async () => {
    const calls: Array<{ sql: string; values?: unknown[] }> = [];
    const service = new TranscriptionService({ withOrganization: async (_organizationId: string, work: (client: { query: (sql: string, values?: unknown[]) => Promise<{ rowCount: number; rows: unknown[] }> }) => unknown) => work({ query: async (sql, values) => { calls.push({ sql, values }); if (sql.startsWith('SELECT 1 FROM tickets')) return { rowCount: 1, rows: [{}] }; if (sql.startsWith('UPDATE transcription_jobs')) return { rowCount: 1, rows: [{ id: 'job', status: 'QUEUED', attempts: 0 }] }; return { rowCount: 1, rows: [] }; } }) } as never);
    await expect(service.retry({ userId: 'user', organizationId: 'org' }, 'ticket', 'job')).resolves.toMatchObject({ status: 'QUEUED' });
    expect(calls.some((call) => call.sql.includes("status='QUEUED',attempts=0"))).toBe(true);
    expect(calls.some((call) => call.values?.includes('transcription.retried'))).toBe(true);
  });
});
