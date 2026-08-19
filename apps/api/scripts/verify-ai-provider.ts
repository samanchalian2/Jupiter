import { AiCredentialService } from '../src/ai/ai-credential.service.js';
import { loadLocalEnvironment } from '../src/config.js';
import { DatabaseService } from '../src/database/database.service.js';
import { HttpAiProvider } from '../src/jobs/http-providers.js';

async function main() {
  loadLocalEnvironment();
  const slug = process.env.AI_TEST_ORGANIZATION_SLUG?.trim();
  if (!slug) throw new Error('AI_TEST_ORGANIZATION_SLUG is required');
  const database = new DatabaseService();
  try {
    const setting = (await database.query<{
      provider_base_url: string; analysis_model: string;
      api_key_ciphertext: Buffer; api_key_iv: Buffer; api_key_auth_tag: Buffer;
    }>(`SELECT s.provider_base_url,s.analysis_model,s.api_key_ciphertext,s.api_key_iv,s.api_key_auth_tag
        FROM organization_ai_settings s JOIN organizations o ON o.id=s.organization_id
        WHERE o.slug=$1 AND s.enabled=true AND s.api_key_ciphertext IS NOT NULL`, [slug])).rows[0];
    if (!setting) throw new Error('Enabled organization AI configuration was not found');
    const apiKey = new AiCredentialService().decrypt({ ciphertext: setting.api_key_ciphertext, iv: setting.api_key_iv, authTag: setting.api_key_auth_tag });
    const result = await new HttpAiProvider().analyze({ promptVersion: 'verification-v1', text: 'A shared office printer is offline.', configuration: { baseUrl: setting.provider_base_url, model: setting.analysis_model, apiKey } });
    console.log(`AI provider verification succeeded for ${slug}; confidence=${result.output.confidence}.`);
  } finally { await database.onModuleDestroy(); }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'AI provider verification failed');
  process.exitCode = 1;
});
