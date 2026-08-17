import { describe, expect, it } from 'vitest';
import { KnowledgeService } from '../src/knowledge/knowledge.service.js';

const contributor = { userId: 'author', organizationId: 'org-a', roles: ['EXPERT'] };
const reviewer = { userId: 'reviewer', organizationId: 'org-a', roles: ['SUPERVISOR'] };

function serviceWith(results: Array<{ rowCount?: number; rows?: unknown[] }> = []) {
  const calls: Array<{ sql: string; values?: unknown[] }> = [];
  const database = {
    withOrganization: async (_organizationId: string, work: (client: { query: (sql: string, values?: unknown[]) => Promise<{ rowCount: number; rows: unknown[] }> }) => unknown) => work({
      query: async (sql: string, values?: unknown[]) => {
        calls.push({ sql, values });
        const result = results.shift() ?? {};
        return { rowCount: result.rowCount ?? (result.rows?.length ?? 0), rows: result.rows ?? [] };
      },
    }),
  };
  return { service: new KnowledgeService(database as never), calls };
}

describe('Knowledge article lifecycle', () => {
  it('keeps published search separate from the review queue', async () => {
    const { service, calls } = serviceWith([{ rows: [] }]);
    await service.list(contributor, 'راهنما');
    expect(calls[0].sql).toContain("status='PUBLISHED'");
    expect(calls[0].values).toEqual(['%راهنما%']);
  });

  it('lets a contributor create and submit only their draft for review', async () => {
    const { service, calls } = serviceWith([{ rows: [{ id: 'article', title: 'راهنمای شبکه', body: 'متن مقاله', status: 'DRAFT' }] }, { rows: [] }, { rows: [{ id: 'article', status: 'IN_REVIEW' }] }]);
    await service.create(contributor, { title: 'راهنمای شبکه', body: 'متن مقاله' });
    await service.submitReview(contributor, 'article');
    expect(calls[2].sql).toContain("status='DRAFT'");
    expect(calls[2].values).toEqual(['article', 'author', false]);
  });

  it('does not allow a requester to author, review, or publish', async () => {
    const { service } = serviceWith();
    const requester = { userId: 'requester', organizationId: 'org-a', roles: ['REQUESTER'] };
    await expect(service.create(requester, { title: 'مقاله معتبر', body: 'متن' })).rejects.toBeDefined();
    await expect(service.reviewQueue(requester)).rejects.toBeDefined();
    await expect(service.publish(requester, 'article')).rejects.toBeDefined();
  });

  it('publishes only an article that is already in review', async () => {
    const { service, calls } = serviceWith([{ rows: [{ id: 'article', status: 'PUBLISHED' }] }]);
    await expect(service.publish(reviewer, 'article')).resolves.toEqual({ id: 'article', status: 'PUBLISHED' });
    expect(calls[0].sql).toContain("status='IN_REVIEW'");
    expect(calls[0].values).toEqual(['reviewer', 'article']);
  });
});
