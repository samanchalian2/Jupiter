import {describe,it,expect} from 'vitest';
import {issueOrdering} from '../src/issue-explorer.js';
describe('bounded Issue ordering',()=>{
 it('defaults to stable descending last-seen and never interpolates caller SQL',()=>{
  expect(issueOrdering({})).toMatchObject({sort:'LAST_SEEN',groupBy:'NONE',groupColumn:null,orderBy:'last_seen DESC,id DESC'});
  for(const sort of ['last_seen','title; DROP TABLE x','', 'LAST_SEEN DESC'])expect(()=>issueOrdering({sort})).toThrow('INVALID_ISSUE_FILTER');
  for(const groupBy of ['tenant_reference','status;--',''])expect(()=>issueOrdering({groupBy})).toThrow('INVALID_ISSUE_FILTER');
  expect(()=>issueOrdering({status:'invalid'})).toThrow('INVALID_ISSUE_FILTER');
 });
 it('groups globally before numeric occurrence ordering and ranks severity explicitly',()=>{
  expect(issueOrdering({groupBy:'STATUS',sort:'OCCURRENCES'}).orderBy).toBe('status ASC,occurrence_count DESC,id DESC');
  expect(issueOrdering({groupBy:'SEVERITY',sort:'FIRST_SEEN'}).orderBy).toContain("WHEN 'CRITICAL' THEN 5");
  expect(issueOrdering({sort:'FIRST_SEEN'}).orderBy).toBe('first_seen DESC,id DESC');
 });
});
