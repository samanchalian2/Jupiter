import { join } from 'node:path';
import { loadLocalEnvironment } from '../src/config.js';
import { DatabaseService } from '../src/database/database.service.js';
import { ProductHelpService } from '../src/help/help.service.js';
import { loadHelpSeeds, type HelpSeedArticle } from '../src/help/help-seed.js';

function actorId() {
  const value = process.argv.find(item => item.startsWith('--actor-id='))?.slice('--actor-id='.length)?.trim();
  if (!value) throw new Error('Use --actor-id=<active Platform Admin UUID> to publish the Help catalog.');
  return value;
}

function canonical(seed: HelpSeedArticle) {
  return {
    title: seed.title, summary: seed.summary, content: seed.content, category: seed.category,
    audience: [...seed.audience].sort(), tags: [...seed.tags].sort(), productArea: seed.productArea,
    relatedFeature: seed.relatedFeature ?? null, relatedRoute: seed.relatedRoute ?? null,
  };
}

function differs(current: Record<string, unknown>, seed: HelpSeedArticle) {
  const expected = canonical(seed);
  return current.source !== 'RUNTIME' || current.title !== expected.title || current.summary !== expected.summary || current.content !== expected.content ||
    current.category !== expected.category || current.productArea !== expected.productArea ||
    current.relatedFeature !== expected.relatedFeature || current.relatedRoute !== expected.relatedRoute ||
    JSON.stringify([...(current.audience as string[])].sort()) !== JSON.stringify(expected.audience) ||
    JSON.stringify([...(current.tags as string[])].sort()) !== JSON.stringify(expected.tags);
}

async function main() {
  loadLocalEnvironment();
  const actor = actorId();
  const database = new DatabaseService();
  const help = new ProductHelpService(database);
  try {
    const seeds = await loadHelpSeeds(join(import.meta.dirname, '../../../docs/help'));
    const existing = new Map((await help.adminList(actor)).map(article => [article.slug, article]));
    let created = 0; let revised = 0; let unchanged = 0;
    for (const { article: seed } of seeds) {
      const article = existing.get(seed.slug);
      if (!article) {
        const draft = await help.create(actor, { ...seed });
        await help.publish(actor, draft.id, draft.revisionId);
        created++;
        continue;
      }
      const current = await help.adminDetail(actor, article.id);
      if (!differs(current.article as Record<string, unknown>, seed)) { unchanged++; continue; }
      const draft = await help.draft(actor, article.id, { ...seed });
      await help.publish(actor, article.id, draft.revisionId);
      revised++;
    }
    console.log(`Product Help runtime publication complete: ${created} created, ${revised} revised, ${unchanged} unchanged.`);
  } finally { await database.onModuleDestroy(); }
}

void main();
