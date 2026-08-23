import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpAiProvider, HttpTranscriptionProvider } from '../src/jobs/http-providers.js';

afterEach(() => vi.unstubAllGlobals());

describe('OpenAI-compatible HTTP provider', () => {
  it('uses Chat Completions structured output with request-scoped credentials', async () => {
    const fetchMock = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) => new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify({ title: 'Printer issue', normalizedDescription: 'Printer is offline', priority: 'NORMAL', tags: [], missingFields: [], initialResponse: '', confidence: 0.9 }) } }],
      usage: { prompt_tokens: 10, completion_tokens: 6 },
    }), { status: 200, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    const result = await new HttpAiProvider().analyze({ promptVersion: 'v1', text: 'printer is offline', configuration: { baseUrl: 'https://ai.example.test/v1', apiKey: 'organization-key', model: 'analysis-model' } });
    expect(result.output.title).toBe('Printer issue');
    expect(result.usage).toEqual({ inputTokens: 10, outputTokens: 6 });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(init).toBeDefined();
    expect(url).toBe('https://ai.example.test/v1/chat/completions');
    expect((init!.headers as Record<string,string>).authorization).toBe('Bearer organization-key');
    const body = JSON.parse(String(init!.body));
    expect(body.model).toBe('analysis-model');
    expect(body.response_format.type).toBe('json_schema');
    expect(body.response_format.json_schema.strict).toBe(true);
  });

  it('uses Audio Transcriptions multipart input with the organization model', async () => {
    const fetchMock = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) => new Response(JSON.stringify({ text: 'printer is offline', language: 'en' }), { status: 200, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    const result = await new HttpTranscriptionProvider().transcribe({ audio: new Blob(['voice'], { type: 'audio/webm' }), filename: 'request.webm', language: 'en', configuration: { baseUrl: 'https://ai.example.test/v1', apiKey: 'organization-key', model: 'transcription-model' } });
    expect(result).toEqual({ text: 'printer is offline', language: 'en' });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://ai.example.test/v1/audio/transcriptions');
    expect((init!.headers as Record<string,string>).authorization).toBe('Bearer organization-key');
    expect(init!.body).toBeInstanceOf(FormData);
    const form = init!.body as FormData;
    expect(form.get('model')).toBe('transcription-model');
    expect(form.get('language')).toBe('en');
  });

  it('requests the versioned ticket-intake schema and normalizes array maps', async () => {
    const fetchMock=vi.fn(async(_url:string|URL|Request,_init?:RequestInit)=>new Response(JSON.stringify({choices:[{message:{content:JSON.stringify({contractVersion:'ticket-intake.v3',title:'Printer issue',titleLibraryId:null,categoryId:null,subcategoryId:null,departmentId:null,locationId:null,disciplineId:null,priority:'NORMAL',customFields:[{key:'asset',value:12}],tags:[],missingFields:['locationId'],confidenceByField:[{field:'title',confidence:.9},{field:'customFields.asset',confidence:.8}],interpretation:'مشکل اصلی پرینتر است.',primaryIssue:{summary:'خرابی پرینتر',serviceAsset:'پرینتر',issueType:'خرابی',confidence:.9},secondaryIssues:[],clarificationQuestion:null,clarificationConfidence:null})}}],usage:{prompt_tokens:15,completion_tokens:8}}),{status:200,headers:{'content-type':'application/json'}}));
    vi.stubGlobal('fetch',fetchMock);
    const result=await new HttpAiProvider().analyzeIntake({context:{description:'Printer issue',categories:[],subcategories:[],departments:[],locations:[],disciplines:[],customFields:[],titleLibrary:[],tags:[]},configuration:{baseUrl:'https://ai.example.test/v1',apiKey:'organization-key',model:'analysis-model'}});
    expect(result.output.contractVersion).toBe('ticket-intake.v6');expect(result.output.customFields).toEqual({asset:12});expect(result.output.confidenceByField).toEqual({title:.9,'customFields.asset':.8});expect(result.output.primaryIssue?.summary).toContain('پرینتر');
    const body=JSON.parse(String(fetchMock.mock.calls[0]![1]!.body));expect(body.response_format.json_schema.name).toBe('jupiter_ticket_intake_v6');expect(body.response_format.json_schema.strict).toBe(true);expect(body.messages[0].content).toContain('exactly one concise tag for each core dimension');expect(body.messages[0].content).toContain('previousPrimaryIssue');
  });
});
