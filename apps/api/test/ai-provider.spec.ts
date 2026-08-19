import { describe, expect, it } from 'vitest';
import { AiProvider } from '../src/ai/ai-provider.js';

describe('AI provider contract', () => {
  it('requires structured, bounded analysis output', async () => {
    const provider: AiProvider = { analyze: async () => ({ output: { title: 'Normalized title', priority: 'NORMAL', confidence: 0.8 }, usage: { inputTokens: 3, outputTokens: 2 } }) };
    const result = await provider.analyze({ promptVersion: 'v1', text: 'redacted input', configuration: { baseUrl: 'https://api.openai.com/v1', apiKey: 'test-key', model: 'test-model' } });
    expect(result.output.confidence).toBeGreaterThanOrEqual(0);
    expect(result.output.confidence).toBeLessThanOrEqual(1);
    expect(result.usage.inputTokens).toBe(3);
  });
  it('keeps provider failures explicit for the queue worker to record', async () => {
    const provider: AiProvider = { analyze: async () => { throw new Error('provider unavailable'); } };
    await expect(provider.analyze({ promptVersion: 'v1', text: 'safe', configuration: { baseUrl: 'https://api.openai.com/v1', apiKey: 'test-key', model: 'test-model' } })).rejects.toThrow('provider unavailable');
  });
});
