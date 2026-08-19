import type { AiProviderConfiguration } from '../ai/ai-provider.js';

export type TranscriptionInput =
  | { attachmentId: string; language?: string }
  | { audio: Blob; filename: string; language?: string; configuration: AiProviderConfiguration };

export interface TranscriptionProvider { transcribe(input:TranscriptionInput):Promise<{text:string;language?:string}> }
