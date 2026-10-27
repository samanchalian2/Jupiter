import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { App, SetupRoute, type Actor, type Session } from './App';
import { MemoryRouter } from 'react-router-dom';
import { canUseLocalVerification, isOrganizationApplicationsPath, verificationDeliveryMessage } from './onboardingExperience';

afterEach(()=>vi.unstubAllGlobals());

describe('GOAL-070 public onboarding regression',()=>{
  it('shows a safe denied state when a non-platform account signs in on the previous account platform URL',()=>{
    const session={accessToken:'test',user:{id:'requester',displayName:'عضو',platformAdmin:false,memberships:[{organization_id:'org',organization_slug:'org-test',role_codes:['REQUESTER']}]}};
    vi.stubGlobal('sessionStorage',{getItem:(key:string)=>key==='jupiter.session'?JSON.stringify(session):null});
    vi.stubGlobal('window',{location:{pathname:'/platform',search:''}});
    expect(renderToStaticMarkup(<App/>)).toContain('دسترسی به مدیریت پلتفرم ندارید');
  });
  it('resolves Setup admin routes from router location, not an outer window snapshot',()=>{
    const actor={organizationId:'fixture',membership:{role_codes:['ORG_OWNER'],organization_status:'setup'},session:{accessToken:'test',user:{id:'owner'}}} as Actor;
    const render=(path:string)=>renderToStaticMarkup(<MemoryRouter initialEntries={[path]}><SetupRoute actor={actor} onLogout={()=>undefined}/></MemoryRouter>);
    expect(render('/admin/automation')).toContain('سیاست‌های SLA');
    expect(render('/')).toContain('راهنمای راه‌اندازی سازمان');
  });
  it.each(['DELIVERED','FAILED','PENDING_CONFIGURATION'])('describes %s without claiming verification',(status)=>{
    const text=verificationDeliveryMessage(status);
    if(status==='DELIVERED') expect(text).toContain('حساب فقط پس از');
    if(status==='FAILED') expect(text).toContain('ناموفق');
    if(status==='PENDING_CONFIGURATION') expect(text).toContain('ارسال نشده');
  });
  it('has exact global route semantics without accepting path prefixes',()=>{
    expect(isOrganizationApplicationsPath('/organization-applications')).toBe(true);
    expect(isOrganizationApplicationsPath('/organization-applications/')).toBe(true);
    expect(isOrganizationApplicationsPath('/organization-applications-other')).toBe(false);
    expect(isOrganizationApplicationsPath('/o/test/organization-applications')).toBe(false);
  });
  it.each(['172.20.190.16','jupiter.arandi.io','localhost.evil.test'])('never exposes local verification on %s',(host)=>{
    expect(canUseLocalVerification(true,host)).toBe(false);
  });
  it('requires both development and loopback for local verification',()=>{
    expect(canUseLocalVerification(false,'127.0.0.1')).toBe(false);
    expect(canUseLocalVerification(true,'127.0.0.1')).toBe(true);
  });
  it.each([1,2])('renders applicant workspace despite %i personal/organization memberships',(count)=>{
    const session:Session={accessToken:'test',user:{id:'test-user',displayName:'متقاضی',email:'applicant@example.test',memberships:[
      {organization_id:'personal',organization_slug:'personal-test',workspace_type:'PERSONAL',role_codes:['REQUESTER']},
      ...(count===2?[{organization_id:'org',organization_slug:'test-org',workspace_type:'ORGANIZATION' as const,role_codes:['ORG_OWNER']}]:[]),
    ]}};
    vi.stubGlobal('sessionStorage',{getItem:(key:string)=>key==='jupiter.session'?JSON.stringify(session):null});
    vi.stubGlobal('window',{location:{pathname:'/organization-applications',search:''}});
    const html=renderToStaticMarkup(<App/>);
    expect(html).toContain('راه‌اندازی سازمان شما');
    expect(html).not.toContain('یک فضای کاری را انتخاب کنید');
  });
});
