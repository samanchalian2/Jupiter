import { afterEach, describe, expect, it } from 'vitest';
import { AiCredentialService } from '../src/ai/ai-credential.service.js';
import { AiGatewayService } from '../src/ai/ai-gateway.service.js';

const originalNodeEnv = process.env.NODE_ENV;
const originalAllowedHosts = process.env.AI_PROVIDER_ALLOWED_HOSTS;
const originalMasterKey = process.env.AI_CREDENTIAL_ENCRYPTION_KEY;

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv;
  process.env.AI_PROVIDER_ALLOWED_HOSTS = originalAllowedHosts;
  process.env.AI_CREDENTIAL_ENCRYPTION_KEY = originalMasterKey;
});

function gateway() {
  const auditMetadata: object[] = [];
  const insertedParameters: unknown[][] = [];
  const client = { query: async (sql: string, parameters: unknown[] = []) => {
    if (sql.startsWith('SELECT api_key_ciphertext')) return { rows: [{ has_api_key: false }], rowCount: 1 };
    if (sql.includes('INSERT INTO organization_ai_settings')) {
      insertedParameters.push(parameters);
      return { rows: [{ organizationId: parameters[0], enabled: parameters[1], hasApiKey: Boolean(parameters[5]) }], rowCount: 1 };
    }
    if (sql.includes('INSERT INTO audit_logs')) { auditMetadata.push(parameters[5] as object); return { rows: [], rowCount: 1 }; }
    throw new Error(`Unexpected SQL: ${sql}`);
  }};
  const database = {
    query: async () => ({ rows: [{ is_platform_admin: true }], rowCount: 1 }),
    withOrganization: async (_organizationId: string, work: (value: typeof client) => Promise<unknown>) => work(client),
  };
  return { service: new AiGatewayService(database as never, new AiCredentialService()), auditMetadata, insertedParameters };
}

describe('organization AI settings security', () => {
  it('stores encrypted credentials and audits only change indicators', async () => {
    process.env.AI_CREDENTIAL_ENCRYPTION_KEY = Buffer.alloc(32, 4).toString('base64');
    const { service, auditMetadata, insertedParameters } = gateway();
    const result = await service.configurePlatform('admin-id', { organizationId: 'org-id', enabled: true, providerBaseUrl: 'https://api.openai.com/v1/', analysisModel: 'gpt-4.1-mini', transcriptionModel: 'gpt-4o-mini-transcribe', apiKey: 'sensitive-key' });
    expect(result).toMatchObject({ hasApiKey: true });
    expect(JSON.stringify(insertedParameters)).not.toContain('sensitive-key');
    expect(JSON.stringify(auditMetadata)).not.toContain('sensitive-key');
    expect(auditMetadata[0]).toMatchObject({ credentialChanged: true, credentialRemoved: false });
  });

  it('rejects unsafe production endpoints and allows configured HTTPS hosts', () => {
    process.env.NODE_ENV = 'production';
    process.env.AI_PROVIDER_ALLOWED_HOSTS = 'api.openai.com,ai.example.test';
    const { service } = gateway();
    expect(() => (service as any).validProviderBaseUrl('http://api.openai.com/v1')).toThrow('must use HTTPS');
    expect(() => (service as any).validProviderBaseUrl('https://untrusted.example/v1')).toThrow('not allowed');
    expect((service as any).validProviderBaseUrl('https://ai.example.test/v1/')).toBe('https://ai.example.test/v1');
  });
});
