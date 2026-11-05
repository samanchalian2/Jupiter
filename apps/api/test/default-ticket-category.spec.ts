import {expect,it,vi} from 'vitest';
import {ensureDefaultTicketCategory} from '../src/organization/default-ticket-category.js';
it('creates IT category and audit only for an empty SETUP organization',async()=>{
  const query=vi.fn(async(sql:string)=>sql.includes('SELECT status')?{rows:[{status:'setup',workspace_type:'ORGANIZATION'}]}:sql.includes('SELECT id FROM categories')?{rows:[],rowCount:0}:sql.includes('INSERT INTO categories')?{rows:[{id:'category'}]}:{rows:[]});
  await ensureDefaultTicketCategory({query} as never,'org','actor');
  expect(query.mock.calls.some(([sql])=>sql.includes("'IT_SERVICES','خدمات فناوری اطلاعات'"))).toBe(true);
  expect(query.mock.calls.some(([sql])=>sql.includes('default_ticket_category_created'))).toBe(true);
});
it.each([{status:'active',workspace_type:'ORGANIZATION'},{status:'archived',workspace_type:'ORGANIZATION'},{status:'setup',workspace_type:'PERSONAL'}])('never modifies ineligible workspace %j',async org=>{
  const query=vi.fn(async()=>({rows:[org]}));await ensureDefaultTicketCategory({query} as never,'org','actor');expect(query).toHaveBeenCalledTimes(1);
});
it('preserves an existing custom catalog',async()=>{
  const query=vi.fn(async(sql:string)=>sql.includes('SELECT status')?{rows:[{status:'setup',workspace_type:'ORGANIZATION'}]}:{rows:[{id:'custom'}],rowCount:1});
  await ensureDefaultTicketCategory({query} as never,'org','actor');expect(query).toHaveBeenCalledTimes(2);
});
