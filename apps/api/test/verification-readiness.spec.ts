import { afterEach, describe, expect, it, vi } from 'vitest';
import { verificationDeliveryReadiness } from '../src/organization-applications/verification-readiness.js';
import { OrganizationApplicationService } from '../src/organization-applications/organization-application.service.js';
import { PublicAccountController } from '../src/organization-applications/organization-application.controller.js';

afterEach(()=>vi.unstubAllEnvs());
describe('GOAL-070 truthful verification readiness',()=>{
  it('reports disabled without pretending a health or inbox check happened',()=>{
    vi.stubEnv('PUBLIC_ACCOUNT_VERIFICATION_DELIVERY','disabled');
    expect(verificationDeliveryReadiness()).toEqual({configured:false,reasonCode:'DELIVERY_DISABLED',transportVerified:false});
  });
  it('validates SMTP configuration without exposing missing setting values',()=>{
    vi.stubEnv('PUBLIC_ACCOUNT_VERIFICATION_DELIVERY','smtp');
    vi.stubEnv('PUBLIC_ACCOUNT_VERIFICATION_SMTP_HOST','');
    expect(verificationDeliveryReadiness()).toEqual({configured:false,reasonCode:'DELIVERY_CONFIGURATION_INVALID',transportVerified:false});
  });
  it('never claims a validated webhook configuration proves delivery',()=>{
    vi.stubEnv('NODE_ENV','production');
    vi.stubEnv('PUBLIC_ACCOUNT_VERIFICATION_DELIVERY','webhook');
    vi.stubEnv('PUBLIC_ACCOUNT_VERIFICATION_WEB_URL','https://jupiter.example.test');
    vi.stubEnv('PUBLIC_ACCOUNT_VERIFICATION_WEBHOOK_URL','https://private.example.test/secret-path');
    const result=verificationDeliveryReadiness();
    expect(result).toEqual({configured:true,reasonCode:'CONFIGURATION_VALID',transportVerified:false});
    expect(JSON.stringify(result)).not.toContain('private.example');
  });
  it('protects aggregated delivery outcomes from a non-platform user',async()=>{
    const database={query:vi.fn().mockResolvedValue({rows:[{is_platform_admin:false}]})};
    const service=new OrganizationApplicationService(database as never,{} as never);
    await expect(service.verificationReadiness('requester')).rejects.toMatchObject({status:403});
    expect(database.query).toHaveBeenCalledTimes(1);
  });
  it('keeps hosted disabled environments out of the local test inbox endpoint',async()=>{
    vi.stubEnv('NODE_ENV','development');vi.stubEnv('PUBLIC_ACCOUNT_VERIFICATION_DELIVERY','disabled');
    const controller=new PublicAccountController({} as never,{} as never,{} as never);
    await expect(controller.testDelivery('person@example.test','Bearer test')).rejects.toMatchObject({status:404});
  });
});
