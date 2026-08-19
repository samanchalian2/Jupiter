export type AiAnalysis = { title?: string; normalizedDescription?: string; priority?: 'LOW'|'NORMAL'|'HIGH'|'URGENT'; tags?: string[]; missingFields?: string[]; initialResponse?: string; confidence: number };
export type AiProviderConfiguration = { baseUrl: string; apiKey: string; model: string };
export interface AiProvider { analyze(input: { promptVersion: string; text: string; configuration: AiProviderConfiguration }): Promise<{ output: AiAnalysis; usage: { inputTokens?: number; outputTokens?: number } }> }
