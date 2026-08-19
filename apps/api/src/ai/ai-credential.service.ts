import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { aiCredentialEncryptionKey } from '../config.js';

export type EncryptedAiCredential = {
  ciphertext: Buffer;
  iv: Buffer;
  authTag: Buffer;
};

@Injectable()
export class AiCredentialService {
  encrypt(plaintext: string): EncryptedAiCredential {
    const value = plaintext.trim();
    if (!value) throw new ServiceUnavailableException('AI credential is empty');
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key(), iv);
    const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    return { ciphertext, iv, authTag: cipher.getAuthTag() };
  }

  decrypt(value: EncryptedAiCredential): string {
    try {
      const decipher = createDecipheriv('aes-256-gcm', this.key(), value.iv);
      decipher.setAuthTag(value.authTag);
      return Buffer.concat([decipher.update(value.ciphertext), decipher.final()]).toString('utf8');
    } catch {
      throw new ServiceUnavailableException('AI credential cannot be decrypted');
    }
  }

  private key() {
    const key = aiCredentialEncryptionKey();
    if (!key) throw new ServiceUnavailableException('AI credential encryption is not configured');
    return key;
  }
}

