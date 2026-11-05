import type {PoolClient} from 'pg';
import type {DatabaseService} from '../database/database.service.js';

export type SessionMembership={organization_id:string;organization_name:string;organization_slug:string;organization_status:string;workspace_type:'ORGANIZATION'|'PERSONAL';role_codes:string[]};

/** Only called with an authenticated identity. No role/RLS bypass or client-supplied user selector. */
export async function readSessionMemberships(database: Pick<DatabaseService,'transaction'>,userId:string,client?:PoolClient):Promise<SessionMembership[]> {
  if(!client)return database.transaction(c=>readSessionMemberships(database,userId,c));
  const previous=(await client.query<{value:string|null}>("SELECT current_setting('app.organization_id',true) AS value")).rows[0]?.value??'';
  const candidates=(await client.query<{id:string}>("SELECT id FROM organizations WHERE status<>'archived' ORDER BY id")).rows;
  const memberships:SessionMembership[]=[];
  for(const candidate of candidates){
    await client.query('SELECT set_config($1,$2,true)',['app.organization_id',candidate.id]);
    const rows=await client.query<SessionMembership>(`SELECT m.organization_id,o.name AS organization_name,o.slug AS organization_slug,o.status AS organization_status,o.workspace_type,
      array_remove(array_agg(r.code ORDER BY r.code),NULL) AS role_codes
      FROM memberships m JOIN organizations o ON o.id=m.organization_id
      LEFT JOIN membership_roles mr ON mr.membership_id=m.id LEFT JOIN roles r ON r.id=mr.role_id
      WHERE m.organization_id=$1 AND m.user_id=$2 AND m.status='active' AND o.status<>'archived'
      GROUP BY m.organization_id,o.name,o.slug,o.status,o.workspace_type`,[candidate.id,userId]);
    memberships.push(...rows.rows);
  }
  // Transaction rollback restores context on failure. Do not mask an aborted query with another query.
  await client.query('SELECT set_config($1,$2,true)',['app.organization_id',previous]);
  return memberships.sort((a,b)=>b.workspace_type.localeCompare(a.workspace_type)||a.organization_name.localeCompare(b.organization_name)||a.organization_id.localeCompare(b.organization_id));
}
