import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../src/database/database.service.js';
import { ProductHelpService } from '../src/help/help.service.js';
import { seedHelpRepository } from '../src/help/help-seed.js';

const database = new DatabaseService();
const help = new ProductHelpService(database);
const suffix = randomUUID().slice(0, 8);
let organizationId = '';
let ownerId = '';
let platformId = '';
let hiddenArticleId = '';
let managedArticleId = '';

beforeAll(async () => {
  await seedHelpRepository((database as unknown as { pool: import('pg').Pool }).pool, join(process.cwd(), '../../docs/help'));
  organizationId = (await database.query<{id:string}>('INSERT INTO organizations(slug,name) VALUES($1,$2) RETURNING id', [`help-${suffix}`, 'Help Test Organization'])).rows[0].id;
  ownerId = (await database.query<{id:string}>('INSERT INTO users(email,display_name,password_hash) VALUES($1,$2,$3) RETURNING id', [`help-owner-${suffix}@jupiter.test`, 'Help Owner', 'scrypt$AA$AA'])).rows[0].id;
  platformId = (await database.query<{id:string}>('INSERT INTO users(email,display_name,password_hash,is_platform_admin) VALUES($1,$2,$3,true) RETURNING id', [`help-platform-${suffix}@jupiter.test`, 'Help Platform', 'scrypt$AA$AA'])).rows[0].id;
  await database.query(`INSERT INTO memberships(organization_id,user_id,status) VALUES($1,$2,'active')`, [organizationId, ownerId]);
  await database.query(`INSERT INTO membership_roles(membership_id,role_id) SELECT m.id,r.id FROM memberships m JOIN roles r ON r.code='ORG_OWNER' WHERE m.organization_id=$1 AND m.user_id=$2`, [organizationId, ownerId]);
  hiddenArticleId = (await database.query<{id:string}>(`INSERT INTO product_help_articles(slug,status) VALUES($1,'PUBLISHED') RETURNING id`, [`unpublished-${suffix}`])).rows[0].id;
  const revision = (await database.query<{id:string}>(`INSERT INTO product_help_article_revisions(article_id,version,title,summary,content,category,audience,tags,product_area,publication_status,source) VALUES($1,1,'پیش‌نویس خصوصی','این محتوا نباید دیده شود','متن پیش‌نویس','آزمون',ARRAY['ALL'],ARRAY[]::text[],'آزمون','DRAFT','RUNTIME') RETURNING id`, [hiddenArticleId])).rows[0];
  await database.query('UPDATE product_help_articles SET current_published_revision_id=$1 WHERE id=$2', [revision.id, hiddenArticleId]);
});

afterAll(async () => {
  await database.query("DELETE FROM audit_logs WHERE action LIKE 'help.%' AND (actor_user_id=$1 OR actor_user_id=$2)", [ownerId, platformId]);
  if (managedArticleId) await database.query('DELETE FROM product_help_articles WHERE id=$1', [managedArticleId]);
  await database.query('DELETE FROM product_help_articles WHERE id=$1', [hiddenArticleId]);
  await database.query('DELETE FROM membership_roles WHERE membership_id IN (SELECT id FROM memberships WHERE organization_id=$1)', [organizationId]);
  await database.query('DELETE FROM memberships WHERE organization_id=$1', [organizationId]);
  await database.query('DELETE FROM organizations WHERE id=$1', [organizationId]);
  await database.query('DELETE FROM users WHERE id IN ($1,$2)', [ownerId, platformId]);
  await database.onModuleDestroy();
});

describe('Product Help publication and audience isolation', () => {
  it('seeds exactly once and exposes ALL articles to an anonymous viewer', async () => {
    const articles = await help.list();
    expect(articles.some((article) => article.slug === 'getting-started')).toBe(true);
    expect(articles.some((article) => article.slug === 'ai-ticket-review')).toBe(false);
  });

  it('shows owner-only and platform-only content only to their exact audiences', async () => {
    const owner = await help.list(ownerId);
    const platform = await help.list(platformId);
    expect(owner.some((article) => article.slug === 'commercial-allowances')).toBe(true);
    expect(owner.some((article) => article.slug === 'platform-commercial-admin')).toBe(false);
    expect(platform.some((article) => article.slug === 'platform-commercial-admin')).toBe(true);
  });

  it('does not reveal unpublished or unauthorized content by list or slug', async () => {
    await expect(help.detail(undefined, `unpublished-${suffix}`)).rejects.toBeInstanceOf(NotFoundException);
    await expect(help.detail(undefined, 'platform-commercial-admin')).rejects.toBeInstanceOf(NotFoundException);
    await expect(help.detail(platformId, 'platform-commercial-admin')).resolves.toMatchObject({ slug: 'platform-commercial-admin', content: expect.any(String) });
  });

  it('limits authoring/export to Platform Admin and keeps revision publication explicit', async () => {
    const initial = { slug:`managed-${suffix}`, title:'راهنمای قابل مدیریت', summary:'خلاصهٔ نسخهٔ اول', content:'متن نسخهٔ اول', category:'آزمون', audience:['ALL'], tags:['آزمون'], productArea:'آزمون', relatedFeature:'TEST_HELP', relatedRoute:'/help' };
    await expect(help.create(ownerId, initial)).rejects.toBeDefined();
    const created = await help.create(platformId, initial); managedArticleId = created.id;
    await expect(help.detail(undefined, initial.slug)).rejects.toBeInstanceOf(NotFoundException);
    const preview = await help.preview(platformId, created.id, created.revisionId);
    expect(preview).toMatchObject({ title: initial.title, publicationStatus:'DRAFT' });
    await help.publish(platformId, created.id, created.revisionId);
    await expect(help.detail(undefined, initial.slug)).resolves.toMatchObject({ content:'متن نسخهٔ اول', version:1 });
    const changed = await help.draft(platformId, created.id, { ...initial, title:'راهنمای نسخهٔ دوم', summary:'خلاصهٔ نسخهٔ دوم', content:'متن نسخهٔ دوم' });
    await expect(help.detail(undefined, initial.slug)).resolves.toMatchObject({ content:'متن نسخهٔ اول', version:1 });
    await help.publish(platformId, created.id, changed.revisionId);
    await expect(help.detail(undefined, initial.slug)).resolves.toMatchObject({ content:'متن نسخهٔ دوم', version:2 });
    const history = await help.adminDetail(platformId, created.id);
    const first = history.revisions.find((revision) => revision.version === 1)!;
    const restored = await help.restore(platformId, created.id, first.revisionId);
    await help.publish(platformId, created.id, restored.revisionId);
    await expect(help.detail(undefined, initial.slug)).resolves.toMatchObject({ content:'متن نسخهٔ اول', version:3 });
    const single = await help.export(platformId, { format:'MARKDOWN', slug:initial.slug });
    const category = await help.export(platformId, { format:'JSON', category:'آزمون' });
    const all = await help.export(platformId, { format:'JSON' });
    expect(single.content).toContain('متن نسخهٔ اول');
    expect(category.content).toContain(initial.slug);
    expect(all.content).toContain(initial.slug);
    await help.unpublish(platformId, created.id);
    await expect(help.detail(undefined, initial.slug)).rejects.toBeInstanceOf(NotFoundException);
  });
});
