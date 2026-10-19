import {describe,expect,it} from 'vitest';
import {comparisonInput} from './ProductComparisonPanel.js';
import {initialFilters} from './client.js';
const a={applicationId:'app-a',environmentId:'env-a',applicationName:'Display only',environmentKey:'production'},b={...a,applicationId:'app-b',environmentId:'env-b',tenantReference:'tenant-b'};
describe('explicit product comparison request',()=>{
 it('uses one common window and strips client display names and pagination',()=>{const input=comparisonInput([a,b],{...initialFilters,release:' v2 ',q:' issue ',page:7},Date.UTC(2026,9,1));expect(input.targets).toEqual([{applicationId:'app-a',environmentId:'env-a'},{applicationId:'app-b',environmentId:'env-b',tenantReference:'tenant-b'}]);expect(input.to).toBe('2026-10-01T00:00:00.000Z');expect(input.from).toBe('2026-09-30T00:00:00.000Z');expect(input).toMatchObject({release:'v2',q:'issue'});expect(input).not.toHaveProperty('page');expect(JSON.stringify(input)).not.toContain('Display only');});
 it('never silently duplicates a product or widens the target list',()=>{expect(()=>comparisonInput([],initialFilters)).toThrow();expect(()=>comparisonInput([a,{...a,environmentId:'other'}],initialFilters)).toThrow();expect(()=>comparisonInput(Array.from({length:11},(_,i)=>({...a,applicationId:`app-${i}`})),initialFilters)).toThrow();});
});
