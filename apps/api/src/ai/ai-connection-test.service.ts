import { ForbiddenException, Injectable } from '@nestjs/common';
import { AiCredentialService } from './ai-credential.service.js';
import { DatabaseService } from '../database/database.service.js';

export type AiConnectionTestResult = {
  success: boolean;
  code: 'ok' | 'not_configured' | 'credential_unavailable' | 'invalid_api_key' | 'billing_or_quota' | 'rate_limited' | 'model_or_endpoint_access' | 'provider_unavailable';
  message: string;
};

type StoredConfiguration = {
  enabled: boolean;
  provider_base_url: string;
  analysis_model: string;
  api_key_ciphertext: Buffer | null;
  api_key_iv: Buffer | null;
  api_key_auth_tag: Buffer | null;
};

@Injectable()
export class AiConnectionTestService {
  constructor(private readonly database: DatabaseService, private readonly credentials: AiCredentialService) {}

  async testPlatform(actorId: string, organizationId: string): Promise<AiConnectionTestResult> {
    const admin = (await this.database.query<{ is_platform_admin: boolean }>(
      'SELECT is_platform_admin FROM users WHERE id=$1 AND is_active=true', [actorId],
    )).rows[0]?.is_platform_admin;
    if (!admin) throw new ForbiddenException();

    const configuration = (await this.database.query<StoredConfiguration>(
      `SELECT enabled,provider_base_url,analysis_model,api_key_ciphertext,api_key_iv,api_key_auth_tag
       FROM organization_ai_settings WHERE organization_id=$1`, [organizationId],
    )).rows[0];
    if (!configuration?.enabled || !configuration.api_key_ciphertext || !configuration.api_key_iv || !configuration.api_key_auth_tag) {
      return this.record(actorId, organizationId, { success: false, code: 'not_configured', message: 'AI برای این سازمان فعال نیست یا کلید API تنظیم نشده است.' });
    }

    let apiKey: string;
    try {
      apiKey = this.credentials.decrypt({
        ciphertext: configuration.api_key_ciphertext,
        iv: configuration.api_key_iv,
        authTag: configuration.api_key_auth_tag,
      });
    } catch {
      return this.record(actorId, organizationId, { success: false, code: 'credential_unavailable', message: 'کلید ذخیره‌شده قابل استفاده نیست. کلید را دوباره تنظیم کنید.' });
    }

    let result: AiConnectionTestResult;
    try {
      const response = await fetch(`${configuration.provider_base_url.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          model: configuration.analysis_model,
          messages: [{ role: 'user', content: 'Jupiter connection check. Reply with OK.' }],
          max_tokens: 1,
        }),
        signal: AbortSignal.timeout(30_000),
      });
      if (response.ok) {
        result = { success: true, code: 'ok', message: 'اتصال با موفقیت برقرار شد؛ Base URL، کلید API و مدل تحلیل قابل استفاده هستند.' };
      } else {
        const providerCode = await this.providerCode(response);
        result = this.diagnose(response.status, providerCode);
      }
    } catch (error) {
      const cause = error instanceof Error ? (error as Error & { cause?: { code?: unknown } }).cause : undefined;
      console.warn(JSON.stringify({
        event: 'ai.connection_test_transport_error',
        errorName: error instanceof Error ? error.name : 'UnknownError',
        errorCode: typeof cause?.code === 'string' ? cause.code : undefined,
      }));
      result = { success: false, code: 'provider_unavailable', message: 'اتصال به ارائه‌دهنده برقرار نشد. Base URL، شبکه و گواهی TLS را بررسی کنید.' };
    }
    return this.record(actorId, organizationId, result);
  }

  private async providerCode(response: Response) {
    try {
      const body = await response.json() as { error?: { code?: unknown } };
      return typeof body.error?.code === 'string' ? body.error.code.toLowerCase() : '';
    } catch {
      return '';
    }
  }

  private diagnose(status: number, providerCode: string): AiConnectionTestResult {
    if (status === 401 || providerCode === 'invalid_api_key') return { success: false, code: 'invalid_api_key', message: 'کلید API پذیرفته نشد. کلید صحیح همان پروژهٔ API را جایگزین و دوباره ذخیره کنید.' };
    if (providerCode === 'billing_not_active' || providerCode === 'insufficient_quota' || status === 402) return { success: false, code: 'billing_or_quota', message: 'کلید معتبر است، اما صورت‌حساب یا اعتبار API فعال نیست. وضعیت Billing و Usage Limit پروژه را بررسی کنید.' };
    if (status === 429) return { success: false, code: 'rate_limited', message: 'ارائه‌دهنده موقتاً درخواست را محدود کرده است. چند لحظه بعد دوباره امتحان کنید.' };
    if (status === 403 || status === 404 || providerCode === 'model_not_found') return { success: false, code: 'model_or_endpoint_access', message: 'Base URL یا مدل تحلیل برای این کلید در دسترس نیست. نام مدل و دسترسی پروژه را بررسی کنید.' };
    return { success: false, code: 'provider_unavailable', message: 'ارائه‌دهنده پاسخ موفق نداد. Base URL و وضعیت سرویس را بررسی کنید.' };
  }

  private async record(actorId: string, organizationId: string, result: AiConnectionTestResult) {
    await this.database.withOrganization(organizationId, async (client) => {
      await client.query(
        `INSERT INTO audit_logs(organization_id,actor_user_id,action,target_type,target_id,metadata)
         VALUES($1,$2,'ai.connection_tested','organization',$1,$3)`,
        [organizationId, actorId, { success: result.success, code: result.code }],
      );
    });
    return result;
  }
}
