import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { beginPlatformApplicationReview } from './PlatformPro';
import { normalizePlatformSearch, paginatePlatformItems } from './PlatformAdminUi';
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
    expect(styles).toContain('@media (max-width: 1100px)');
    expect(styles).toContain('@media (max-width: 900px)');
    expect(styles).toContain('.responsive-platform-table td::before');
    expect(styles).toContain('content: attr(data-label)');
  });

  it('requires layered confirmation before safe organization deletion', () => {
    const source = readFileSync(new URL('./PlatformPro.tsx',import.meta.url),'utf8');
    expect(source).toContain('حذف امن');
    expect(source).toContain('slug === pending.organization.slug');
    expect(source).toContain('reason.trim().length >= 10');
    expect(source).toContain('acknowledged');
    expect(source).toContain('selected.workspace_type !== "PERSONAL"');
    expect(source).toContain('"idempotency-key": crypto.randomUUID()');
    expect(source).toContain('${pending.organization.id}/${pending.mode}');
    expect(source).toContain('بازیابی در حالت معلق');
  });

  it('keeps platform discovery URL-driven, filtered and paginated without API contract changes', () => {
    expect(normalizePlatformSearch('  Jupiter-DEMO  ')).toBe('jupiter-demo');
    expect(paginatePlatformItems([1,2,3,4,5], 2, 2)).toEqual({items:[3,4],page:2,totalPages:3});
    expect(paginatePlatformItems([1,2], 9, 10)).toEqual({items:[1,2],page:1,totalPages:1});
    const source = readFileSync(new URL('./PlatformPro.tsx',import.meta.url),'utf8');
    const commercial = readFileSync(new URL('./PlatformCommercial.tsx',import.meta.url),'utf8');
    const styles = readFileSync(new URL('./styles.css',import.meta.url),'utf8');
    expect(source).toContain('useSearchParams');
    expect(source).toContain('PlatformFilterToolbar');
    expect(source).toContain('PlatformPagination');
    expect(source).toContain('platform-admin-nav');
    expect(commercial).toContain('commercialSections');
    expect(commercial).toContain('commercial-section-nav');
    expect(commercial).toContain("area==='catalog'");
    expect(commercial).toContain("area==='subscriptions'");
    expect(commercial).toContain("area==='capacity'");
    expect(commercial).toContain("area==='personal'");
    expect(commercial).toContain("area==='assist'");
    expect(styles).not.toContain('.platform-commercial-catalog > :is(.card:nth-child');
  });
});
