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
  name: 'jupiter_ticket_intake_v6', strict: true,
  schema: {
    type: 'object', additionalProperties: false,
    properties: {
      contractVersion: { type: 'string', enum: [TICKET_INTAKE_CONTRACT_VERSION] },
      title: { type: 'string' },
      titleLibraryId: { type: ['string','null'] },
      categoryId: { type: ['string','null'] }, subcategoryId: { type: ['string','null'] },
      departmentId: { type: ['string','null'] }, locationId: { type: ['string','null'] }, disciplineId: { type: ['string','null'] },
      priority: { type: 'string', enum: ['LOW','NORMAL','HIGH','URGENT'] },
      customFields: { type: 'array', items: { type: 'object', additionalProperties: false, properties: { key: { type: 'string' }, value: { type: ['string','number','boolean','null'] } }, required: ['key','value'] } },
      tags: { type: 'array', maxItems: 5, items: { type: 'object', additionalProperties: false, properties: { tagId: { type: ['string','null'] }, name: { type: 'string' }, kind: { type: 'string', enum: ['DOMAIN','SERVICE_ASSET','ISSUE_TYPE','IMPACT_SCOPE','CONTEXT','OTHER'] } }, required: ['tagId','name','kind'] } },
      missingFields: { type: 'array', items: { type: 'string' } },
      confidenceByField: { type: 'array', items: { type: 'object', additionalProperties: false, properties: { field: { type: 'string' }, confidence: { type: 'number', minimum: 0, maximum: 1 } }, required: ['field','confidence'] } },
      interpretation: { type: ['string','null'] },
      primaryIssue: { type: ['object','null'], additionalProperties: false, properties: { summary: { type: 'string' }, serviceAsset: { type: ['string','null'] }, issueType: { type: ['string','null'] }, confidence: { type: 'number', minimum: 0, maximum: 1 } }, required: ['summary','serviceAsset','issueType','confidence'] },
      secondaryIssues: { type: 'array', maxItems: 2, items: { type: 'object', additionalProperties: false, properties: { summary:{type:'string'},title:{type:'string'},description:{type:'string'},categoryId:{type:['string','null']},subcategoryId:{type:['string','null']},departmentId:{type:['string','null']},locationId:{type:['string','null']},disciplineId:{type:['string','null']},priority:{type:'string',enum:['LOW','NORMAL','HIGH','URGENT']},customFields:{type:'array',items:{type:'object',additionalProperties:false,properties:{key:{type:'string'},value:{type:['string','number','boolean','null']}},required:['key','value']}},tags:{type:'array',maxItems:5,items:{type:'object',additionalProperties:false,properties:{tagId:{type:['string','null']},name:{type:'string'},kind:{type:'string',enum:['DOMAIN','SERVICE_ASSET','ISSUE_TYPE','IMPACT_SCOPE','CONTEXT','OTHER']}},required:['tagId','name','kind']}},confidenceByField:{type:'array',items:{type:'object',additionalProperties:false,properties:{field:{type:'string'},confidence:{type:'number',minimum:0,maximum:1}},required:['field','confidence']}},confidence:{type:'number',minimum:0,maximum:1}}, required:['summary','title','description','categoryId','subcategoryId','departmentId','locationId','disciplineId','priority','customFields','tags','confidenceByField','confidence'] } },
      clarificationQuestion: { type: ['string','null'] },
      clarificationConfidence: { type: ['number','null'], minimum: 0, maximum: 1 },
    },
    required: ['contractVersion','title','titleLibraryId','categoryId','subcategoryId','departmentId','locationId','disciplineId','priority','customFields','tags','missingFields','confidenceByField','interpretation','primaryIssue','secondaryIssues','clarificationQuestion','clarificationConfidence'],
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
        { role: 'system', content: 'You classify a Persian help-desk conversation using only IDs and options in the supplied tenant context. Raw requester messages are evidence: never rewrite them. Resolve self-corrections such as «ببخشید» and «اشتباه گفتم», negation and chronology before classifying. Return a concise separate interpretation and one primary issue. The earliest distinct requester issue is the primary issue. When previousPrimaryIssue is supplied, preserve it as the primary issue: later messages that explain a secondary proposal must enrich that proposal, not reorder it as primary, unless the requester explicitly says the primary issue itself was wrong or replaced. A statement about another device may be a secondary issue, not the primary issue; include it in secondaryIssues unless it clearly replaces the earlier issue. Each secondary issue must be a self-contained proposed ticket: concise title, privacy-preserving standalone description (never quote raw conversation), tenant taxonomy IDs, priority, tags, custom fields and confidence for every field. Ask one short Persian clarification only when ambiguity materially changes the primary classification, otherwise return null. The title must be a concise Persian problem label of 4–12 words, not a copy of the description and without dates or generic prefixes. If an active titleLibrary entry is the same request, return its exact ID and title; otherwise set titleLibraryId to null and create a precise new title. For every support request, propose exactly one concise tag for each core dimension: DOMAIN, SERVICE_ASSET and ISSUE_TYPE. When the active tenant vocabulary has no suitable value, use null tagId and create the concise candidate name; do not omit core tags merely because the vocabulary is empty. Add at most two IMPACT_SCOPE or CONTEXT tags only when the requester evidence supports them. Reuse only supplied active tag IDs. Return confidence for every proposed field.' },
        { role: 'user', content: JSON.stringify(input.context) },
      ], response_format: { type: 'json_schema', json_schema: ticketIntakeSchema } }),
    });
    const result = await response.json() as { choices?: Array<{message?:{content?:string}}>; usage?:{prompt_tokens?:number;completion_tokens?:number} };
    const content = result.choices?.[0]?.message?.content;
    if (!content) throw new Error('AI provider response is invalid');
    let raw: Omit<TicketIntakeProviderOutput,'customFields'|'confidenceByField'> & { customFields:Array<{key:string;value:unknown}>; confidenceByField:Array<{field:string;confidence:number}> };
    try { raw = JSON.parse(content) as typeof raw; } catch { throw new Error('AI provider response is invalid'); }
    if ((raw.contractVersion !== TICKET_INTAKE_CONTRACT_VERSION && raw.contractVersion !== 'ticket-intake.v5' && raw.contractVersion !== 'ticket-intake.v4' && raw.contractVersion !== 'ticket-intake.v3') || !Array.isArray(raw.customFields) || !Array.isArray(raw.tags) || !Array.isArray(raw.confidenceByField)) throw new Error('AI provider response is invalid');
    const customFields = Object.fromEntries(raw.customFields.filter((item) => item && typeof item.key === 'string').map((item) => [item.key,item.value]));
    const confidenceByField = Object.fromEntries(raw.confidenceByField.filter((item) => item && typeof item.field === 'string' && typeof item.confidence === 'number').map((item) => [item.field,Math.max(0,Math.min(1,item.confidence))]));
    const secondaryIssues=(raw.secondaryIssues??[]).map((item:any)=>({...item,customFields:Object.fromEntries((item.customFields??[]).filter((field:any)=>field&&typeof field.key==='string').map((field:any)=>[field.key,field.value])),confidenceByField:Object.fromEntries((item.confidenceByField??[]).filter((field:any)=>field&&typeof field.field==='string'&&typeof field.confidence==='number').map((field:any)=>[field.field,Math.max(0,Math.min(1,field.confidence))]))}));
    return { output: { ...raw,contractVersion:TICKET_INTAKE_CONTRACT_VERSION, customFields, confidenceByField,secondaryIssues } as TicketIntakeProviderOutput, usage: { inputTokens: result.usage?.prompt_tokens, outputTokens: result.usage?.completion_tokens } };
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
