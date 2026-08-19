import type { AiAnalysis, AiProvider } from '../ai/ai-provider.js';
import type { TranscriptionProvider } from '../transcription/transcription-provider.js';
import { TICKET_INTAKE_CONTRACT_VERSION, type TicketIntakeProvider, type TicketIntakeProviderOutput } from '../ticket-intake/ticket-intake-provider.js';

async function checkedFetch(url: string, init: RequestInit) {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(30_000) });
  if (!response.ok) {
    let providerCode = '';
    try {
      const body = await response.clone().json() as { error?: { code?: unknown } };
      if (typeof body.error?.code === 'string' && /^[a-z0-9_.-]{1,80}$/i.test(body.error.code)) providerCode = ` (${body.error.code})`;
    } catch { /* Provider error bodies are intentionally not propagated. */ }
    throw new Error(`AI provider returned HTTP ${response.status}${providerCode}`);
  }
  return response;
}

const analysisSchema = {
  name: 'jupiter_ticket_analysis', strict: true,
  schema: {
    type: 'object', additionalProperties: false,
    properties: {
      title: { type: 'string' }, normalizedDescription: { type: 'string' },
      priority: { type: 'string', enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'] },
      tags: { type: 'array', items: { type: 'string' } }, missingFields: { type: 'array', items: { type: 'string' } },
      initialResponse: { type: 'string' }, confidence: { type: 'number', minimum: 0, maximum: 1 },
    },
    required: ['title', 'normalizedDescription', 'priority', 'tags', 'missingFields', 'initialResponse', 'confidence'],
  },
} as const;

const ticketIntakeSchema = {
  name: 'jupiter_ticket_intake_v1', strict: true,
  schema: {
    type: 'object', additionalProperties: false,
    properties: {
      contractVersion: { type: 'string', enum: [TICKET_INTAKE_CONTRACT_VERSION] },
      title: { type: 'string' },
      categoryId: { type: ['string','null'] }, subcategoryId: { type: ['string','null'] },
      departmentId: { type: ['string','null'] }, locationId: { type: ['string','null'] }, disciplineId: { type: ['string','null'] },
      priority: { type: 'string', enum: ['LOW','NORMAL','HIGH','URGENT'] },
      customFields: { type: 'array', items: { type: 'object', additionalProperties: false, properties: { key: { type: 'string' }, value: { type: ['string','number','boolean','null'] } }, required: ['key','value'] } },
      missingFields: { type: 'array', items: { type: 'string' } },
      confidenceByField: { type: 'array', items: { type: 'object', additionalProperties: false, properties: { field: { type: 'string' }, confidence: { type: 'number', minimum: 0, maximum: 1 } }, required: ['field','confidence'] } },
    },
    required: ['contractVersion','title','categoryId','subcategoryId','departmentId','locationId','disciplineId','priority','customFields','missingFields','confidenceByField'],
  },
} as const;

export class HttpAiProvider implements AiProvider, TicketIntakeProvider {
  async analyze(input: Parameters<AiProvider['analyze']>[0]) {
    const response = await checkedFetch(`${input.configuration.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST', headers: { authorization: `Bearer ${input.configuration.apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({ model: input.configuration.model, messages: [
        { role: 'system', content: `Extract a concise help-desk ticket. Follow the output schema exactly, never invent facts. Prompt contract: ${input.promptVersion}.` },
        { role: 'user', content: input.text },
      ], response_format: { type: 'json_schema', json_schema: analysisSchema } }),
    });
    const result = await response.json() as { choices?: Array<{message?:{content?:string}}>; usage?:{prompt_tokens?:number;completion_tokens?:number} };
    const content = result.choices?.[0]?.message?.content;
    if (!content) throw new Error('AI provider response is invalid');
    let output: AiAnalysis;
    try { output = JSON.parse(content) as AiAnalysis; } catch { throw new Error('AI provider response is invalid'); }
    if (typeof output.confidence !== 'number' || output.confidence < 0 || output.confidence > 1) throw new Error('AI provider response is invalid');
    return { output, usage: { inputTokens: result.usage?.prompt_tokens, outputTokens: result.usage?.completion_tokens } };
  }

  async analyzeIntake(input: Parameters<TicketIntakeProvider['analyzeIntake']>[0]) {
    const response = await checkedFetch(`${input.configuration.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST', headers: { authorization: `Bearer ${input.configuration.apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({ model: input.configuration.model, messages: [
        { role: 'system', content: 'Classify a help-desk request using only IDs and custom-field options present in the supplied tenant catalog. Never rewrite the user description. Return confidence for every proposed field.' },
        { role: 'user', content: JSON.stringify(input.context) },
      ], response_format: { type: 'json_schema', json_schema: ticketIntakeSchema } }),
    });
    const result = await response.json() as { choices?: Array<{message?:{content?:string}}>; usage?:{prompt_tokens?:number;completion_tokens?:number} };
    const content = result.choices?.[0]?.message?.content;
    if (!content) throw new Error('AI provider response is invalid');
    let raw: Omit<TicketIntakeProviderOutput,'customFields'|'confidenceByField'> & { customFields:Array<{key:string;value:unknown}>; confidenceByField:Array<{field:string;confidence:number}> };
    try { raw = JSON.parse(content) as typeof raw; } catch { throw new Error('AI provider response is invalid'); }
    if (raw.contractVersion !== TICKET_INTAKE_CONTRACT_VERSION || !Array.isArray(raw.customFields) || !Array.isArray(raw.confidenceByField)) throw new Error('AI provider response is invalid');
    const customFields = Object.fromEntries(raw.customFields.filter((item) => item && typeof item.key === 'string').map((item) => [item.key,item.value]));
    const confidenceByField = Object.fromEntries(raw.confidenceByField.filter((item) => item && typeof item.field === 'string' && typeof item.confidence === 'number').map((item) => [item.field,Math.max(0,Math.min(1,item.confidence))]));
    return { output: { ...raw, customFields, confidenceByField } as TicketIntakeProviderOutput, usage: { inputTokens: result.usage?.prompt_tokens, outputTokens: result.usage?.completion_tokens } };
  }
}

export class HttpTranscriptionProvider implements TranscriptionProvider {
  async transcribe(input: Parameters<TranscriptionProvider['transcribe']>[0]) {
    if (!('audio' in input)) throw new Error('Legacy transcription jobs require migration to ticket intake sessions');
    const form = new FormData();
    form.append('file', input.audio, input.filename);
    form.append('model', input.configuration.model);
    form.append('response_format', 'json');
    if (input.language) form.append('language', input.language);
    const response = await checkedFetch(`${input.configuration.baseUrl.replace(/\/$/, '')}/audio/transcriptions`, {
      method: 'POST', headers: { authorization: `Bearer ${input.configuration.apiKey}` }, body: form,
    });
    const result = await response.json() as { text?: unknown; language?: unknown };
    if (typeof result.text !== 'string' || !result.text.trim()) throw new Error('Transcription provider response is invalid');
    return { text: result.text, language: typeof result.language === 'string' ? result.language : undefined };
  }
}
