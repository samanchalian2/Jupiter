import { afterEach, describe, expect, it, vi } from 'vitest';
import { AiConnectionTestService } from '../src/ai/ai-connection-test.service.js';
import { AiCredentialService } from '../src/ai/ai-credential.service.js';

const originalKey = process.env.AI_CREDENTIAL_ENCRYPTION_KEY;

afterEach(() => {
  process.env.AI_CREDENTIAL_ENCRYPTION_KEY = originalKey;
  vi.unstubAllGlobals();
});

function subject(isPlatformAdmin = true) {
  process.env.AI_CREDENTIAL_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
  const credentials = new AiCredentialService();
  const encrypted = credentials.encrypt('never-return-this-key');
  const audits: unknown[][] = [];
  const database = {
    query: async (sql: string) => {
      if (sql.includes('FROM users')) return { rows: [{ is_platform_admin: isPlatformAdmin }], rowCount: 1 };
      if (sql.includes('FROM organization_ai_settings')) return { rows: [{ enabled: true, provider_base_url: 'https://api.openai.com/v1', analysis_model: 'gpt-4.1-mini', api_key_ciphertext: encrypted.ciphertext, api_key_iv: encrypted.iv, api_key_auth_tag: encrypted.authTag }], rowCount: 1 };
      throw new Error(`Unexpected query: ${sql}`);
    },
    withOrganization: async (_organizationId: string, work: (client: { query: (sql: string, parameters: unknown[]) => Promise<{ rows: unknown[] }> }) => Promise<unknown>) => work({
      query: async (_sql, parameters) => { audits.push(parameters); return { rows: [] }; },
    }),
  };
  return { service: new AiConnectionTestService(database as never, credentials), audits };
}

describe('AI connection test', () => {
  it('confirms a configured analysis endpoint without exposing the API key', async () => {
    const { service, audits } = subject();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"id":"ok"}', { status: 200 })));
    await expect(service.testPlatform('admin-id', 'org-id')).resolves.toMatchObject({ success: true, code: 'ok' });
    expect(JSON.stringify(audits)).not.toContain('never-return-this-key');
  });

  it('gives a safe, actionable invalid-key diagnosis', async () => {
    const { service, audits } = subject();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"error":{"code":"invalid_api_key"}}', { status: 401 })));
    await expect(service.testPlatform('admin-id', 'org-id')).resolves.toMatchObject({ success: false, code: 'invalid_api_key' });
    expect(JSON.stringify(audits)).not.toContain('never-return-this-key');
  });

  it('keeps billing failures distinct from ordinary rate limits', async () => {
    const { service } = subject();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"error":{"code":"billing_not_active"}}', { status: 429 })));
    await expect(service.testPlatform('admin-id', 'org-id')).resolves.toMatchObject({ success: false, code: 'billing_or_quota' });
  });

  it('remains platform-admin-only', async () => {
    const { service } = subject(false);
    await expect(service.testPlatform('member-id', 'org-id')).rejects.toBeDefined();
  });

  it('does not misreport an audit failure as a provider connection failure', async () => {
    const { service } = subject();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"id":"ok"}', { status: 200 })));
    (service as any).record = async () => { throw new Error('audit unavailable'); };
    await expect(service.testPlatform('admin-id', 'org-id')).rejects.toThrow('audit unavailable');
  });
});
