import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { beginPlatformApplicationReview } from './PlatformPro';
import type { Actor } from './App';

describe('platform organization review and responsive lists', () => {
  it('starts review through the API and returns the immediately reviewable state', async () => {
    const request = vi.fn().mockResolvedValue({status:'UNDER_REVIEW'});
    const actor = {
      session:{accessToken:'test',user:{displayName:'مدیر',email:null,memberships:[],platformAdmin:true}},
      organizationId:'platform-context',
      membership:{organization_id:'platform-context',role_codes:[]},
    } as Actor;
    const application = {
      id:'application-1',status:'SUBMITTED',organizationName:'سازمان آزمون',
      preferredSlug:'test-org',assignedSlug:null,contactName:'متقاضی',contactPhone:null,
      details:{},submittedAt:null,reviewNote:null,reviewedAt:null,
      applicant:{email:'applicant@example.test',displayName:'متقاضی'},
    } as Parameters<typeof beginPlatformApplicationReview>[1];

    await expect(beginPlatformApplicationReview(actor,application,request,()=> 'review-key'))
      .resolves.toMatchObject({id:'application-1',status:'UNDER_REVIEW'});
    expect(request).toHaveBeenCalledWith(
      '/platform/organization-applications/application-1/start-review',
      actor.session,
      actor.organizationId,
      {method:'POST',headers:{'idempotency-key':'review-key'}},
    );
  });

  it('keeps both platform lists complete without a page-wide mobile table crop', () => {
    const source = readFileSync(new URL('./PlatformPro.tsx',import.meta.url),'utf8');
    const styles = readFileSync(new URL('./styles.css',import.meta.url),'utf8');
    expect(source.match(/responsive-platform-table/g)?.length).toBeGreaterThanOrEqual(2);
    expect(source).toContain('data-label="عملیات"');
    expect(styles).toContain('@media (max-width: 900px)');
    expect(styles).toContain('.responsive-platform-table td::before');
    expect(styles).toContain('content: attr(data-label)');
  });
});
