import { describe, expect, it } from 'vitest';
import { TranscriptionProvider } from '../src/transcription/transcription-provider.js';
describe('Transcription provider contract',()=>it('surfaces failures so retry/dead-letter policy can handle them',async()=>{const provider:TranscriptionProvider={transcribe:async()=>{throw new Error('unavailable')}};await expect(provider.transcribe({attachmentId:'audio'})).rejects.toThrow('unavailable')}));
