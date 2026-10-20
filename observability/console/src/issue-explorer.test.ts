import {describe,it,expect} from 'vitest';
import {initialIssueSelection,issueQuery,withoutIssueOrdering} from './IssueExplorerControls.js';
describe('Issue Explorer query ownership',()=>{
 it('preserves scope and bound filters while selecting explicit ordering/status',()=>{
  const base=new URLSearchParams({environmentId:'env',tenantReference:'tenant-a',release:'v1',page:'2'});
  const result=issueQuery(base,{sort:'OCCURRENCES',groupBy:'STATUS',status:'OPEN'});
  expect(Object.fromEntries(result)).toEqual({environmentId:'env',tenantReference:'tenant-a',release:'v1',page:'2',sort:'OCCURRENCES',groupBy:'STATUS',status:'OPEN'});expect(base.has('sort')).toBe(false);
 });
 it('does not send list-only ordering to detail/export and preserves group drill-down',()=>{
  const result=withoutIssueOrdering(issueQuery(new URLSearchParams({environmentId:'env'}),{...initialIssueSelection,status:'RESOLVED'}));
  expect(Object.fromEntries(result)).toEqual({environmentId:'env',status:'RESOLVED'});
  expect(issueQuery(new URLSearchParams(),initialIssueSelection).get('groupBy')).toBe('NONE');
 });
});
