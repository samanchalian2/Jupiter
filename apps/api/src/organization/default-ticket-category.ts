import type {PoolClient} from 'pg';

/** Caller owns tenant context, operator authorization and transaction. */
export async function ensureDefaultTicketCategory(client:PoolClient,organizationId:string,actorUserId:string){
  const org=(await client.query<{status:string;workspace_type:string}>('SELECT status,workspace_type FROM organizations WHERE id=$1 FOR UPDATE',[organizationId])).rows[0];
  if(!org||org.status!=='setup'||org.workspace_type!=='ORGANIZATION')return;
  if((await client.query('SELECT id FROM categories WHERE organization_id=$1 LIMIT 1',[organizationId])).rowCount)return;
  const created=await client.query<{id:string}>("INSERT INTO categories(organization_id,code,name) VALUES($1,'IT_SERVICES','خدمات فناوری اطلاعات') ON CONFLICT(organization_id,code) DO NOTHING RETURNING id",[organizationId]);
  if(created.rows[0])await client.query("INSERT INTO audit_logs(organization_id,actor_user_id,action,target_type,target_id,metadata) VALUES($1,$2,'organization.default_ticket_category_created','category',$3,$4::jsonb)",[organizationId,actorUserId,created.rows[0].id,JSON.stringify({source:'SETUP_DEFAULT',code:'IT_SERVICES'})]);
}
