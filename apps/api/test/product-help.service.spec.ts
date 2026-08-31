import { describe, expect, it } from 'vitest';
import { ProductHelpService } from '../src/help/help.service.js';
import { parseHelpSeed, seedHelpArticle } from '../src/help/help-seed.js';

function serviceWith(results: Array<{ rows?: unknown[]; rowCount?: number }> = []) {
  const calls: Array<{ sql:string; values?:unknown[] }> = [];
  const database = { query: async (sql:string, values?:unknown[]) => {
    calls.push({ sql, values }); const result = results.shift() ?? {};
    return { rows: result.rows ?? [], rowCount: result.rowCount ?? (result.rows?.length ?? 0) };
  } };
  return { service: new ProductHelpService(database as never), calls };
}

describe('Product Help audience boundary', () => {
  it('returns only published revisions allowed to an anonymous ALL audience', async () => {
    const { service, calls } = serviceWith([{ rows: [{ slug:'getting-started',title:'شروع',summary:'خلاصه',category:'شروع',audience:['ALL'],tags:[],product_area:'راهنما',related_feature:null,related_route:null,version:1,published_at:'2026-01-01' }] }]);
    await expect(service.list()).resolves.toHaveLength(1);
    expect(calls[0].sql).toContain("article.status='PUBLISHED'");
    expect(calls[0].sql).toContain("revision.publication_status='PUBLISHED'");
    expect(calls[0].values?.[0]).toEqual(['ALL']);
  });

  it('maps only active membership roles and platform privilege to allowed audiences', async () => {
    const { service, calls } = serviceWith([{ rows: [{ is_platform_admin: true }] }, { rows: [{ code:'ORG_OWNER' }, { code:'ORG_ADMIN' }] }, { rows: [] }]);
    await service.list('user-id');
    expect(calls[1].sql).toContain("m.status='active'");
    expect(calls[2].values?.[0]).toEqual(['ALL', 'PLATFORM_ADMIN', 'ORG_OWNER', 'ORG_ADMIN']);
  });

  it('does not disclose an unpublished or unauthorized slug as an article', async () => {
    const { service, calls } = serviceWith([{ rows: [] }]);
    await expect(service.detail(undefined, 'platform-commercial-admin')).rejects.toMatchObject({ status: 404 });
    expect(calls[0].sql).toContain("revision.audience && $1::text[]");
    expect(calls[0].values).toEqual([['ALL'], 'platform-commercial-admin']);
  });
});

describe('Product Help repository seed', () => {
  const valid = `---\nslug: first-guide\ntitle: راهنمای اول\nsummary: یک خلاصه معتبر\ncategory: شروع کار\naudience: ["ALL"]\ntags: ["شروع"]\nproductArea: راهنما\nrelatedFeature: ticketing\nrelatedRoute: /dashboard\n---\n# راهنما\nمتن`;

  it('parses explicit Persian metadata and rejects unsafe audience values', () => {
    expect(parseHelpSeed(valid)).toMatchObject({ slug:'first-guide', audience:['ALL'], relatedRoute:'/dashboard' });
    expect(() => parseHelpSeed(valid.replace('["ALL"]', '["UNKNOWN"]'))).toThrow('invalid audience');
  });

  it('never overwrites an existing runtime article during reseeding', async () => {
    const calls: string[] = [];
    const client = { query: async (sql:string) => { calls.push(sql); return { rowCount:1, rows:[{ id:'existing' }] }; } };
    await expect(seedHelpArticle(client as never, parseHelpSeed(valid), 'first-guide.md')).resolves.toEqual({ slug:'first-guide', created:false });
    expect(calls).toHaveLength(1);
    expect(calls[0]).toContain('SELECT id FROM product_help_articles');
  });
});
