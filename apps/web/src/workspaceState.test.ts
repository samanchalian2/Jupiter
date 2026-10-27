import { describe, expect, it } from 'vitest';
import { createLatestResultGuard, summarizeSetupSteps, ticketFilterStorageKey } from './workspaceState';
import { canApplyRefreshedSession, isPasswordChangeChallenge, isSessionResponse } from './authenticationResult';

describe('GOAL-070 isolated workspace state',()=>{
  it('partitions persistent ticket filters by account, tenant, workspace and view',()=>{
    const a=ticketFilterStorageKey('melika','saba','ORGANIZATION',false);
    expect(new Set([a,ticketFilterStorageKey('jalal','saba','ORGANIZATION',false),ticketFilterStorageKey('melika','other','ORGANIZATION',false),ticketFilterStorageKey('melika','saba','PERSONAL',false),ticketFilterStorageKey('melika','saba','ORGANIZATION',true)]).size).toBe(5);
    expect(a).not.toBe('jupiter.ticket-filters.saba.requester');
    expect(ticketFilterStorageKey(undefined,'saba','ORGANIZATION',false)).toBeNull();
  });
  it('invalidates late results on replacement and account unmount',()=>{
    const guard=createLatestResultGuard(),old=guard.begin(),current=guard.begin();
    expect(old()).toBe(false);expect(current()).toBe(true);
    guard.invalidate();expect(current()).toBe(false);
    const next=guard.begin();expect(next()).toBe(true);expect(old()).toBe(false);
  });
  it('counts skipped optional steps but never counts a skipped required step as complete',()=>{
    const steps=[{key:'PROFILE'},{key:'CATALOG'},{key:'AI',optional:true},{key:'SLA',optional:true}];
    expect(summarizeSetupSteps({PROFILE:'COMPLETE',CATALOG:'COMPLETE',AI:'SKIPPED',SLA:'SKIPPED'},steps)).toEqual({completed:2,skipped:2,pending:0,total:4});
    expect(summarizeSetupSteps({PROFILE:'SKIPPED'},steps)).toEqual({completed:0,skipped:0,pending:4,total:4});
  });
  it('never interprets a password-change challenge as an authenticated session',()=>{
    const challenge={passwordChangeRequired:true,passwordChangeToken:'test',expiresAt:new Date().toISOString()};
    expect(isPasswordChangeChallenge(challenge)).toBe(true);expect(isSessionResponse(challenge)).toBe(false);
    expect(isSessionResponse({accessToken:'normal',user:{displayName:'کاربر',memberships:[]}})).toBe(true);
    expect(isSessionResponse({accessToken:'invalid'})).toBe(false);
  });
  it('does not let a shared refresh cookie silently switch the account of another tab',()=>{
    const owner={accessToken:'old',user:{id:'melika',displayName:'ملیکا',email:null,memberships:[]}};
    const refreshed={...owner,accessToken:'new'};
    expect(canApplyRefreshedSession(owner,owner,refreshed)).toBe(true);
    expect(canApplyRefreshedSession(owner,owner,{...refreshed,user:{...owner.user,id:'jalal'}})).toBe(false);
    expect(canApplyRefreshedSession(owner,refreshed,refreshed)).toBe(false);
  });
});
