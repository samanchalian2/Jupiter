import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { loadObservabilityHelp, OBSERVABILITY_HELP_TOPICS } from './ObservabilityHelp';

describe('Jupiter-only Observability Help adapter', () => {
  it('maps all eleven topics to validated repository metadata and published slug lookup', async () => {
    expect(OBSERVABILITY_HELP_TOPICS).toHaveLength(11);
    for (const [topic] of OBSERVABILITY_HELP_TOPICS) {
      const slug = `observability-${topic}`;
      const source = readFileSync(new URL(`../../../docs/help/${slug}.md`, import.meta.url), 'utf8');
      expect(source).toContain(`slug: ${slug}`);
      expect(source).toContain(`relatedFeature: OBSERVABILITY_${topic.replaceAll('-', '_').toUpperCase()}`);
      const signal = new AbortController().signal;
      const transport = vi.fn(async () => Response.json({ slug, title: 'راهنما', content: 'متن راهنما' }));
      await expect(loadObservabilityHelp(topic, signal, transport)).resolves.toMatchObject({ slug });
      expect(transport).toHaveBeenCalledWith(`/help/articles/${slug}`, { signal });
    }
  });
  it('never treats unauthorized, unpublished or wrong-slug responses as readable Help', async () => {
    const signal = new AbortController().signal;
    for (const status of [401, 403, 404]) {
      await expect(loadObservabilityHelp('console', signal, async () => new Response('', { status }))).rejects.toThrow();
    }
    await expect(loadObservabilityHelp('console', signal, async () => Response.json({ slug: 'other', title: 'عنوان', content: 'متن' }))).rejects.toThrow();
  });
});
