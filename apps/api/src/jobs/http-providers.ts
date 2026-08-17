import type { AiProvider } from '../ai/ai-provider.js';
import type { TranscriptionProvider } from '../transcription/transcription-provider.js';

async function call(url: string | undefined, key: string | undefined, body: unknown) {
  if (!url || !key) throw new Error('Provider is not configured');
  const response = await fetch(url, { method: 'POST', headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`Provider returned ${response.status}`);
  return response.json() as Promise<Record<string, unknown>>;
}

export class HttpAiProvider implements AiProvider {
  async analyze(input: { promptVersion: string; text: string; model: string }) {
    const result = await call(process.env.AI_PROVIDER_URL, process.env.AI_PROVIDER_API_KEY, input);
    const output = result.output as { title?: string; normalizedDescription?: string; priority?: 'LOW'|'NORMAL'|'HIGH'|'URGENT'; tags?: string[]; missingFields?: string[]; initialResponse?: string; confidence?: number } | undefined;
    if (!output || typeof output.confidence !== 'number') throw new Error('Provider response is invalid');
    return { output: { ...output, confidence: Math.max(0, Math.min(1, output.confidence)) }, usage: (result.usage as { inputTokens?: number; outputTokens?: number }) ?? {} };
  }
}

export class HttpTranscriptionProvider implements TranscriptionProvider {
  async transcribe(input: { attachmentId: string; language?: string }) {
    const result = await call(process.env.TRANSCRIPTION_PROVIDER_URL, process.env.TRANSCRIPTION_PROVIDER_API_KEY, input);
    if (typeof result.text !== 'string' || !result.text.trim()) throw new Error('Provider response is invalid');
    return { text: result.text, language: typeof result.language === 'string' ? result.language : undefined };
  }
}
