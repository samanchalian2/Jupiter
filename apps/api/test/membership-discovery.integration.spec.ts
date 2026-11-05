import {afterAll,beforeAll,expect,it} from 'vitest';
import {randomUUID} from 'node:crypto';
import {DatabaseService} from '../src/database/database.service.js';
import {databaseUrl} from '../src/config.js';
import {readSessionMemberships} from '../src/auth/membership-discovery.js';
import {TicketActorService} from '../src/tickets/ticket-actor.service.js';
import type {PoolClient} from 'pg';

const target=new URL(databaseUrl());
if(!['localhost','127.0.0.1','[::1]'].includes(target.hostname)||!(/^\/goal070_tests_[0-9a-f]{32}$/.test(target.pathname)||(process.env.CI==='true'&&target.pathname==='/jupiter_ci')))throw Error('Disposable isolated test database required');
const database=new DatabaseService();const ids={own:randomUUID(),foreign:randomUUID(),archived:randomUUID(),inactive:randomUUID(),user:randomUUID(),other:randomUUID()};
const runtime={transaction:<T>(work:(client:PoolClient)=>Promise<T>)=>database.transaction(async c=>{await c.query('SET LOCAL ROLE jupiter_app');return work(c);}),withOrganization:database.withOrganization.bind(database)};
beforeAll(async()=>{
  await database.query("INSERT INTO users(id,email,display_name) VALUES($1,$2,'Discovery fixture'),($3,$4,'Foreign fixture')",[ids.user,`discovery-${ids.user}@example.invalid`,ids.other,`discovery-${ids.other}@example.invalid`]);
  for(const [key,status] of [['own','setup'],['foreign','active'],['archived','archived'],['inactive','active']] as const){
    await database.query('INSERT INTO organizations(id,name,slug,status,archived_at,archived_by_user_id,archive_reason) VALUES($1,$2,$3,$4,CASE WHEN $4=\'archived\' THEN now() END,CASE WHEN $4=\'archived\' THEN $5::uuid END,CASE WHEN $4=\'archived\' THEN \'Isolated archived fixture\' END)',[ids[key],key,'discovery-'+ids[key],status,ids.user]);
    const member=(await database.query("INSERT INTO memberships(organization_id,user_id,status) VALUES($1,$2,$3) RETURNING id",[ids[key],key==='foreign'?ids.other:ids.user,key==='inactive'?'inactive':'active'])).rows[0];
    await database.query("INSERT INTO membership_roles(membership_id,role_id) SELECT $1,id FROM roles WHERE code='ORG_OWNER'",[member.id]);
  }
});
afterAll(()=>database.onModuleDestroy());
it('discovers own membership under real runtime RLS, excluding foreign, archived and inactive memberships',async()=>{
  const unscoped=await runtime.transaction(c=>c.query('SELECT id FROM memberships WHERE user_id=$1',[ids.user]));
  expect(unscoped.rowCount).toBe(0);
  const found=await readSessionMemberships(runtime,ids.user);
  expect(found).toHaveLength(1);expect(found[0]).toMatchObject({organization_id:ids.own,organization_status:'setup',role_codes:['ORG_OWNER']});
  const foreign=await readSessionMemberships(runtime,ids.other);
  expect(foreign).toHaveLength(1);expect(foreign[0].organization_id).toBe(ids.foreign);
});
it('authorizes the same user only in their SETUP tenant and rejects foreign context and revocation',async()=>{
  const actors=new TicketActorService({verify:async()=>({sub:ids.user})} as never,runtime as never);
  expect(await actors.fromHeaders('Bearer synthetic',ids.own)).toMatchObject({userId:ids.user,organizationId:ids.own,roles:['ORG_OWNER']});
  await expect(actors.fromHeaders('Bearer synthetic',ids.foreign)).rejects.toThrow();
  await database.query('DELETE FROM membership_roles WHERE membership_id IN (SELECT id FROM memberships WHERE organization_id=$1)',[ids.own]);
  await database.query("UPDATE memberships SET status='inactive' WHERE organization_id=$1",[ids.own]);
  expect(await readSessionMemberships(runtime,ids.user)).toEqual([]);
  await expect(actors.fromHeaders('Bearer synthetic',ids.own)).rejects.toThrow();
});
