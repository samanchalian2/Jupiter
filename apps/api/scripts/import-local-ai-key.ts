import { AiCredentialService } from '../src/ai/ai-credential.service.js';
import { loadLocalEnvironment } from '../src/config.js';
import { DatabaseService } from '../src/database/database.service.js';

async function main() {
  loadLocalEnvironment();
  const slug = process.env.AI_MIGRATION_ORGANIZATION_SLUG?.trim();
  const source = process.env.OPENAI_API_KEY?.trim();
  if (!slug || !source) throw new Error('AI migration source and target are required');
  const encrypted = new AiCredentialService().encrypt(source);
  const database = new DatabaseService();
  try {
    const result = await database.query(
      `INSERT INTO organization_ai_settings(
        organization_id,enabled,model,analysis_model,transcription_model,provider_base_url,
        api_key_ciphertext,api_key_iv,api_key_auth_tag
      ) SELECT id,false,'gpt-4.1-mini','gpt-4.1-mini','gpt-4o-mini-transcribe','https://api.openai.com/v1',$1,$2,$3
        FROM organizations WHERE slug=$4
      ON CONFLICT(organization_id) DO UPDATE SET
        api_key_ciphertext=$1,api_key_iv=$2,api_key_auth_tag=$3,
        credential_version=organization_ai_settings.credential_version+1,updated_at=now()
      RETURNING organization_id`,
      [encrypted.ciphertext, encrypted.iv, encrypted.authTag, slug],
    );
    if (result.rowCount !== 1) throw new Error('AI migration target organization was not found');
    console.log(`Encrypted AI credential imported for organization ${slug}. Remove OPENAI_API_KEY after migration.`);
  } finally { await database.onModuleDestroy(); }
}

void main();
