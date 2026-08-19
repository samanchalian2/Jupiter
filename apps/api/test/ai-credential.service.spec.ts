import { afterEach, describe, expect, it } from 'vitest';
import { AiCredentialService } from '../src/ai/ai-credential.service.js';

const originalKey = process.env.AI_CREDENTIAL_ENCRYPTION_KEY;

afterEach(() => {
  if (originalKey === undefined) delete process.env.AI_CREDENTIAL_ENCRYPTION_KEY;
  else process.env.AI_CREDENTIAL_ENCRYPTION_KEY = originalKey;
});

describe('AI credential encryption', () => {
  it('encrypts with unique IVs and decrypts with AES-256-GCM', () => {
    process.env.AI_CREDENTIAL_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
    const service = new AiCredentialService();
    const first = service.encrypt('secret-value');
    const second = service.encrypt('secret-value');
    expect(first.ciphertext.toString('utf8')).not.toContain('secret-value');
    expect(first.iv.equals(second.iv)).toBe(false);
    expect(service.decrypt(first)).toBe('secret-value');
  });

  it('rejects tampered ciphertext and invalid master keys without exposing plaintext', () => {
    process.env.AI_CREDENTIAL_ENCRYPTION_KEY = Buffer.alloc(32, 8).toString('base64');
    const service = new AiCredentialService();
    const encrypted = service.encrypt('do-not-leak');
    encrypted.authTag[0] ^= 1;
    expect(() => service.decrypt(encrypted)).toThrow('AI credential cannot be decrypted');
    process.env.AI_CREDENTIAL_ENCRYPTION_KEY = 'invalid';
    expect(() => service.encrypt('do-not-leak')).toThrow('AI credential encryption is not configured');
  });
});

