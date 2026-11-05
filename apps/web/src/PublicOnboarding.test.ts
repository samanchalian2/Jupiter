import { describe, expect, it, vi } from 'vitest';
import { PublicSession, sendOrganizationApplication, selectCurrentApplication } from './PublicOnboarding';

describe('approved application landing',()=>{
  const approved={id:'approved',status:'APPROVED',assignedSlug:'approved-org'} as Parameters<typeof selectCurrentApplication>[0][number];
  it('keeps approved organization as current instead of implicitly opening a blank form',()=>{
    expect(selectCurrentApplication([approved])).toBe(approved);
  });
  it('opens a new application only after an explicit request for another organization',()=>{
    expect(selectCurrentApplication([approved],true)).toBeNull();
  });
  it('preserves pending applications ahead of approved history, even on another-organization intent',()=>{
    for(const status of ['DRAFT','NEEDS_INFORMATION','UNDER_REVIEW','SUBMITTED']){
      const pending={...approved,id:'pending',status} as typeof approved;
      expect(selectCurrentApplication([approved,pending])).toBe(pending);
      expect(selectCurrentApplication([approved,pending],true)).toBe(pending);
    }
    expect(selectCurrentApplication([{...approved,status:'REJECTED'},{...approved,status:'CANCELLED'}])).toBeNull();
  });
});

const session: PublicSession = {
  accessToken: 'test-access',
  user: { displayName:'کاربر آزمون', email:'person@example.test', memberships:[] },
};
const payload = {
  organizationName:'سازمان آزمون',
  contactName:'کاربر آزمون',
  details:{},
};

describe('organization application one-step submission', () => {
  it('creates and immediately submits a new application from one user action', async () => {
    const request = vi.fn()
      .mockResolvedValueOnce({id:'application-1',status:'DRAFT'})
      .mockResolvedValueOnce({id:'application-1',status:'SUBMITTED'});
    const keys = ['create-key','submit-key'];

    await expect(sendOrganizationApplication(request,session,null,payload,()=>keys.shift()!))
      .resolves.toMatchObject({status:'SUBMITTED'});
    expect(request.mock.calls.map((call)=>[call[0],call[3]])).toEqual([
      ['/organization-applications',expect.objectContaining({method:'POST',headers:{'idempotency-key':'create-key'}})],
      ['/organization-applications/application-1/submit',expect.objectContaining({method:'POST',headers:{'idempotency-key':'submit-key'}})],
    ]);
  });

  it('updates a returned information request and resubmits it without a separate save action', async () => {
    const request = vi.fn()
      .mockResolvedValueOnce({id:'application-2',status:'NEEDS_INFORMATION'})
      .mockResolvedValueOnce({id:'application-2',status:'SUBMITTED'});

    await sendOrganizationApplication(
      request,
      session,
      {id:'application-2',status:'NEEDS_INFORMATION'} as never,
      payload,
      (()=>{let index=0;return()=>`key-${++index}`;})(),
    );
    expect(request.mock.calls.map((call)=>call[0])).toEqual([
      '/organization-applications/application-2',
      '/organization-applications/application-2/submit',
    ]);
  });
});
