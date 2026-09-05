import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Pool, PoolClient } from 'pg';
import { isHelpContextFeature, isHelpRelatedRoute } from './help-catalog.js';

export const HELP_AUDIENCES = ['REQUESTER', 'EXPERT', 'SUPERVISOR', 'ORG_ADMIN', 'ORG_OWNER', 'PLATFORM_ADMIN', 'ALL'] as const;
export type HelpAudience = (typeof HELP_AUDIENCES)[number];

export type HelpSeedArticle = {
  slug: string; title: string; summary: string; category: string; audience: HelpAudience[];
  tags: string[]; productArea: string; relatedFeature?: string; relatedRoute?: string; content: string;
};

function value(header: Record<string, string>, key: string, required = true) {
  const result = header[key]?.trim();
  if (required && !result) throw new Error(`Help seed field ${key} is required.`);
  return result;
}

function array(header: Record<string, string>, key: string) {
  const raw = value(header, key);
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.some(item => typeof item !== 'string')) throw new Error();
    return parsed.map(item => item.trim()).filter(Boolean);
  } catch { throw new Error(`Help seed field ${key} must be a JSON string array.`); }
}

export function parseHelpSeed(source: string): HelpSeedArticle {
  const match = source.replace(/^\uFEFF/, '').match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]+)$/);
  if (!match) throw new Error('Help seed requires YAML-like front matter bounded by ---.');
  const header: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(':');
    if (separator <= 0) throw new Error(`Invalid Help seed header: ${line}`);
    header[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }
  const audience = array(header, 'audience') as HelpAudience[];
  if (!audience.length || audience.some(item => !HELP_AUDIENCES.includes(item))) throw new Error('Help seed has an invalid audience.');
  const article = {
    slug: value(header, 'slug'), title: value(header, 'title'), summary: value(header, 'summary'),
    category: value(header, 'category'), audience, tags: array(header, 'tags'), productArea: value(header, 'productArea'),
    relatedFeature: value(header, 'relatedFeature', false) || undefined,
    relatedRoute: value(header, 'relatedRoute', false) || undefined, content: match[2].trim(),
  };
  if (!/^[a-z0-9][a-z0-9-]{2,120}$/.test(article.slug) || !article.content) throw new Error(`Invalid Help seed ${article.slug}.`);
  if (article.relatedFeature && !isHelpContextFeature(article.relatedFeature)) throw new Error(`Help seed ${article.slug} has an unknown related feature.`);
  if (article.relatedRoute && !isHelpRelatedRoute(article.relatedRoute)) throw new Error(`Help seed ${article.slug} has an unknown related route.`);
  return article;
}

export async function loadHelpSeeds(directory: string) {
  const files = (await readdir(directory)).filter(file => file.endsWith('.md')).sort();
  return Promise.all(files.map(async file => ({ file, article: parseHelpSeed(await readFile(join(directory, file), 'utf8')) })));
}

type HelpClient = Pick<PoolClient, 'query'>;
export async function seedHelpArticle(client: HelpClient, seed: HelpSeedArticle, sourceKey: string) {
  // A slug is a stable article identity. Never modify it from repository input:
  // runtime revisions after initial publication are authoritative.
  const existing = await client.query<{ id: string }>('SELECT id FROM product_help_articles WHERE slug=$1', [seed.slug]);
  if (existing.rowCount) return { slug: seed.slug, created: false };
  const article = (await client.query<{ id: string }>('INSERT INTO product_help_articles(slug,status) VALUES($1,\'PUBLISHED\') RETURNING id', [seed.slug])).rows[0];
  const checksum = createHash('sha256').update(JSON.stringify(seed)).digest('hex');
  const revision = (await client.query<{ id: string }>(`INSERT INTO product_help_article_revisions(article_id,version,title,summary,content,category,audience,tags,product_area,related_feature,related_route,publication_status,source,source_key,source_checksum,published_at)
    VALUES($1,1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'PUBLISHED','REPOSITORY_SEED',$11,$12,now()) RETURNING id`, [article.id, seed.title, seed.summary, seed.content, seed.category, seed.audience, seed.tags, seed.productArea, seed.relatedFeature ?? null, seed.relatedRoute ?? null, sourceKey, checksum])).rows[0];
  await client.query('UPDATE product_help_articles SET current_published_revision_id=$1,updated_at=now() WHERE id=$2', [revision.id, article.id]);
  await client.query('INSERT INTO audit_logs(organization_id,actor_user_id,action,target_type,target_id,metadata) VALUES(NULL,NULL,$1,$2,$3,$4)', ['help.seed_published', 'product_help_article', article.id, { slug: seed.slug, sourceKey }]);
  return { slug: seed.slug, created: true };
}

export async function seedHelpRepository(pool: Pool, directory: string) {
  const seeds = await loadHelpSeeds(directory);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const results = [];
    for (const seed of seeds) results.push(await seedHelpArticle(client, seed.article, seed.file));
    await client.query('COMMIT');
    return results;
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
