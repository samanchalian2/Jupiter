import {it,expect,describe} from 'vitest';
import {incidentRoute,incidentHref,incidentScopeQuery} from './incident-route.js';
const route={applicationId:'10000000-0000-4000-8000-000000000001',environmentId:'20000000-0000-4000-8000-000000000001',incidentId:'30000000-0000-4000-8000-000000000001'};
describe('portable Incident page identity',()=>{
 it('round trips tenant-free, all-authorized and opaque concrete scope distinctly',()=>{for(const tenantReference of [undefined,null,'سازمان / & =']){const target={...route,tenantReference};expect(incidentRoute(incidentHref(target))).toEqual(tenantReference===undefined?route:target);expect(incidentScopeQuery(target).has('tenantReference')).toBe(tenantReference!==undefined);}});
 it('rejects malformed and duplicate scope without swallowing host fragments',()=>{for(const value of ['#obs/incident/invalid',incidentHref(route)+'?tenant=a&tenant=b',incidentHref(route)+'?token=not-allowed',incidentHref(route)+'?tenant=%GG',incidentHref(route)+'?tenant='+'x'.repeat(161)])expect(incidentRoute(value)).toBe('INVALID');expect(incidentRoute('#alerts')).toBeNull();expect(incidentRoute('')).toBeNull();});
});
