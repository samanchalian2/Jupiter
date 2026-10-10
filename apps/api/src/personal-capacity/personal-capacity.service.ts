import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../database/database.service.js';
import { TicketActor } from '../tickets/ticket-actor.service.js';

export type PersonalCapacityPool = 'SUPPORT' | 'AI';

type PackageInput = {
  id?: string;
  code?: string;
  name?: string;
  description?: string;
  poolCode?: PersonalCapacityPool;
  unitCount?: number;
  priceIrt?: number;
  validityDays?: number;
  status?: 'DRAFT' | 'ACTIVE' | 'RETIRED';
};

type Reservation = { id:string;status:'RESERVED'|'SETTLED'|'RELEASED';source:'MONTHLY'|'PURCHASED' };
type PersonalAiCapability = 'AI_TICKET_REVIEW' | 'AI_SMART_INTAKE';

@Injectable()
export class PersonalCapacityService {
  constructor(private readonly database: DatabaseService) {}

  async platformPolicies(actorId:string) {
    await this.platform(actorId);
    return (await this.database.query(
      `SELECT pool_code,default_monthly_units,updated_at
       FROM personal_allowance_policies ORDER BY pool_code`,
    )).rows;
  }

  async savePolicy(actorId:string,input:{poolCode?:string;monthlyUnits?:number}) {
    await this.platform(actorId);
    const pool=this.pool(input.poolCode);
    if(!Number.isInteger(input.monthlyUnits)||input.monthlyUnits!<0||input.monthlyUnits!>1000000) {
      throw new BadRequestException('مقدار سهمیه ماهانه معتبر نیست.');
    }
    return this.database.transaction(async client=>{
      const record=(await client.query<{pool_code:string;default_monthly_units:number}>(
        `UPDATE personal_allowance_policies
         SET default_monthly_units=$2,updated_by_user_id=$3,updated_at=now()
         WHERE pool_code=$1 RETURNING pool_code,default_monthly_units`,
        [pool,input.monthlyUnits,actorId],
      )).rows[0];
      await this.audit(client,null,actorId,'personal_capacity.policy_changed','personal_allowance_policy',null,{poolCode:pool,monthlyUnits:input.monthlyUnits});
      return record;
    });
  }

  async platformWorkspaces(actorId:string) {
    await this.platform(actorId);
    return (await this.database.query(
      `SELECT organization.id,organization.slug,organization.name,organization.status,
        owner.display_name AS owner_name,owner.email AS owner_email
       FROM organizations organization
       JOIN users owner ON owner.id=organization.personal_owner_user_id
       WHERE organization.workspace_type='PERSONAL'
       ORDER BY owner.display_name,organization.created_at`,
    )).rows;
  }

  async platformOverrides(actorId:string) {
    await this.platform(actorId);
    return (await this.database.query(
      `SELECT override.organization_id,organization.name AS workspace_name,
        override.pool_code,override.monthly_units,override.updated_at
       FROM personal_allowance_overrides override
       JOIN organizations organization ON organization.id=override.organization_id
       ORDER BY organization.name,override.pool_code`,
    )).rows;
  }

  async saveOverride(actorId:string,input:{organizationId?:string;poolCode?:string;monthlyUnits?:number|null}) {
    await this.platform(actorId);
    const organizationId=input.organizationId??'';
    const pool=this.pool(input.poolCode);
    await this.personalWorkspace(organizationId);
    if(input.monthlyUnits!==null&&input.monthlyUnits!==undefined&&
      (!Number.isInteger(input.monthlyUnits)||input.monthlyUnits<0||input.monthlyUnits>1000000)) {
      throw new BadRequestException('مقدار override معتبر نیست.');
    }
    return this.database.transaction(async client=>{
      if(input.monthlyUnits===null||input.monthlyUnits===undefined) {
        await client.query('DELETE FROM personal_allowance_overrides WHERE organization_id=$1 AND pool_code=$2',[organizationId,pool]);
      } else {
        await client.query(
          `INSERT INTO personal_allowance_overrides(organization_id,pool_code,monthly_units,updated_by_user_id)
           VALUES($1,$2,$3,$4)
           ON CONFLICT(organization_id,pool_code) DO UPDATE
           SET monthly_units=EXCLUDED.monthly_units,updated_by_user_id=EXCLUDED.updated_by_user_id,updated_at=now()`,
          [organizationId,pool,input.monthlyUnits,actorId],
        );
      }
      await this.audit(client,organizationId,actorId,'personal_capacity.override_changed','personal_allowance_override',null,{poolCode:pool,monthlyUnits:input.monthlyUnits??null});
      return {organizationId,poolCode:pool,monthlyUnits:input.monthlyUnits??null};
    });
  }

  async platformPackages(actorId:string) {
    await this.platform(actorId);
    return (await this.database.query(
      `SELECT id,code,name,description,pool_code,unit_count,price_irt::text,
        validity_days,status,created_at,updated_at
       FROM personal_packages ORDER BY pool_code,name`,
    )).rows;
  }

  async savePackage(actorId:string,input:PackageInput) {
    await this.platform(actorId);
    const code=(input.code??'').trim().toUpperCase();
    const name=(input.name??'').trim();
    const description=(input.description??'').trim();
    const pool=this.pool(input.poolCode);
    const status=input.status??'';
    if(!/^[A-Z0-9_]{3,64}$/.test(code)||name.length<2||name.length>120||description.length<2||description.length>1000||
      !Number.isInteger(input.unitCount)||input.unitCount!<1||input.unitCount!>1000000||
      !Number.isSafeInteger(input.priceIrt)||input.priceIrt!<0||
      !Number.isInteger(input.validityDays)||input.validityDays!<1||input.validityDays!>1825||
      !['DRAFT','ACTIVE','RETIRED'].includes(status)) throw new BadRequestException('مشخصات بسته شخصی معتبر نیست.');
    return this.database.transaction(async client=>{
      let record:{id:string;code:string};
      if(input.id) {
        record=(await client.query<{id:string;code:string}>(
          `UPDATE personal_packages SET code=$2,name=$3,description=$4,pool_code=$5,
            unit_count=$6,price_irt=$7,validity_days=$8,status=$9,
            updated_by_user_id=$10,updated_at=now()
           WHERE id=$1 RETURNING id,code`,
          [input.id,code,name,description,pool,input.unitCount,input.priceIrt,input.validityDays,status,actorId],
        )).rows[0];
        if(!record) throw new NotFoundException('بسته شخصی یافت نشد.');
      } else {
        record=(await client.query<{id:string;code:string}>(
          `INSERT INTO personal_packages(
            code,name,description,pool_code,unit_count,price_irt,validity_days,status,updated_by_user_id
           ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id,code`,
          [code,name,description,pool,input.unitCount,input.priceIrt,input.validityDays,status,actorId],
        )).rows[0];
      }
      await this.audit(client,null,actorId,'personal_capacity.package_saved','personal_package',record.id,{code,poolCode:pool,unitCount:input.unitCount,priceIrt:input.priceIrt,validityDays:input.validityDays,status});
      return record;
    });
  }

  async platformAllocations(actorId:string) {
    await this.platform(actorId);
    return (await this.database.query(
      `SELECT allocation.id,allocation.organization_id,organization.name AS workspace_name,
        allocation.package_id,allocation.package_name_snapshot,allocation.pool_code,
        allocation.granted_units,allocation.price_irt_snapshot::text,
        allocation.starts_at,allocation.expires_at,allocation.status,
        allocation.allocation_source,allocation.created_at
       FROM personal_package_allocations allocation
       JOIN organizations organization ON organization.id=allocation.organization_id
       ORDER BY allocation.created_at DESC`,
    )).rows;
  }

  async allocatePackage(actorId:string,input:{organizationId?:string;packageId?:string;reason?:string;idempotencyKey?:string}) {
    await this.platform(actorId);
    const organizationId=input.organizationId??'';
    const packageId=input.packageId??'';
    const reason=input.reason?.trim()??'';
    const key=input.idempotencyKey?.trim()??'';
    if(reason.length<2||reason.length>1000||key.length<8||key.length>200) throw new BadRequestException('دلیل و کلید تکرارناپذیری معتبر الزامی است.');
    await this.personalWorkspace(organizationId);
    return this.database.transaction(async client=>{
      const existing=(await client.query<{id:string}>('SELECT id FROM personal_package_allocations WHERE organization_id=$1 AND idempotency_key=$2',[organizationId,key])).rows[0];
      if(existing) return existing;
      const personalPackage=(await client.query<{
        id:string;code:string;name:string;pool_code:string;unit_count:number;price_irt:string;validity_days:number;
      }>(
        `SELECT id,code,name,pool_code,unit_count,price_irt::text,validity_days
         FROM personal_packages WHERE id=$1 AND status='ACTIVE' FOR SHARE`,[packageId],
      )).rows[0];
      if(!personalPackage) throw new NotFoundException('بسته فعال شخصی یافت نشد.');
      const record=(await client.query<{id:string}>(
        `INSERT INTO personal_package_allocations(
          organization_id,package_id,package_code_snapshot,package_name_snapshot,pool_code,
          granted_units,price_irt_snapshot,starts_at,expires_at,status,
          allocation_source,idempotency_key,allocation_reason,allocated_by_user_id
         ) VALUES($1,$2,$3,$4,$5,$6,$7,now(),now()+($8::text||' days')::interval,
           'ACTIVE','MANUAL',$9,$10,$11) RETURNING id`,
        [organizationId,personalPackage.id,personalPackage.code,personalPackage.name,personalPackage.pool_code,
          personalPackage.unit_count,personalPackage.price_irt,personalPackage.validity_days,key,reason,actorId],
      )).rows[0];
      await this.audit(client,organizationId,actorId,'personal_capacity.package_allocated','personal_package_allocation',record.id,{packageId:personalPackage.id,poolCode:personalPackage.pool_code,unitCount:personalPackage.unit_count,validityDays:personalPackage.validity_days,source:'MANUAL'});
      return record;
    });
  }

  async revokeAllocation(actorId:string,allocationId:string,reason?:string) {
    await this.platform(actorId);
    const note=reason?.trim()??'';
    if(note.length<2||note.length>1000) throw new BadRequestException('دلیل معتبر الزامی است.');
    const raw=(await this.database.query<{organization_id:string;pool_code:string}>('SELECT organization_id,pool_code FROM personal_package_allocations WHERE id=$1',[allocationId])).rows[0];
    if(!raw) throw new NotFoundException('تخصیص بسته یافت نشد.');
    return this.database.transaction(async client=>{
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[`${raw.organization_id}:${raw.pool_code}`]);
      const record=(await client.query<{id:string;status:string}>(
        `UPDATE personal_package_allocations SET status='REVOKED'
         WHERE id=$1 AND organization_id=$2 AND status='ACTIVE' RETURNING id,status`,[allocationId,raw.organization_id],
      )).rows[0];
      if(!record) throw new ConflictException('این تخصیص قبلاً متوقف شده است.');
      await this.audit(client,raw.organization_id,actorId,'personal_capacity.allocation_revoked','personal_package_allocation',allocationId,{reason:note});
      return record;
    });
  }

  async ownerSummary(actor:TicketActor) {
    await this.personalOwner(actor);
    return this.database.withOrganization(actor.organizationId,client=>this.summary(client,actor.organizationId,actor.userId));
  }

  async reserveAiAction(actor:TicketActor,capability:PersonalAiCapability,idempotencyKey:string) {
    await this.personalOwner(actor);
    return this.database.withOrganization(actor.organizationId,client=>this.reserve(client,{
      organizationId:actor.organizationId,
      poolCode:'AI',
      subjectType:'AI_ACTION',
      idempotencyKey:this.aiKey(capability,idempotencyKey),
      actorId:actor.userId,
    }));
  }

  async settleAiAction(organizationId:string,idempotencyKey:string,subjectId:string) {
    return this.database.withOrganization(organizationId,async client=>{
      const reservation=await this.aiReservation(client,idempotencyKey);
      if(!reservation) throw new NotFoundException('رزرو ظرفیت هوش مصنوعی یافت نشد.');
      const record=await this.settle(client,reservation.id,subjectId,null);
      return {id:record.id,idempotent:reservation.status==='SETTLED'};
    });
  }

  async releaseAiAction(organizationId:string,idempotencyKey:string) {
    return this.database.withOrganization(organizationId,async client=>{
      const reservation=await this.aiReservation(client,idempotencyKey);
      if(!reservation) return {released:false};
      const record=await this.release(client,reservation.id,null,'AI_ACTION_NOT_DELIVERED');
      return {released:record?.status==='RELEASED'&&reservation.status==='RESERVED'};
    });
  }

  async aiActionReference(organizationId:string,idempotencyKey:string) {
    return this.database.withOrganization(organizationId,async client=>{
      const reservation=await this.aiReservation(client,idempotencyKey);
      return {actionId:reservation?.id??null};
    });
  }

  async platformSummary(actorId:string,organizationId:string) {
    await this.platform(actorId);
    await this.personalWorkspace(organizationId);
    return this.database.withOrganization(organizationId,client=>this.summary(client,organizationId,actorId));
  }

  async reserve(client:PoolClient,input:{organizationId:string;poolCode:PersonalCapacityPool;subjectType:'SUPPORT_CASE'|'AI_ACTION';idempotencyKey:string;actorId:string}) {
    const pool=this.pool(input.poolCode);
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[`${input.organizationId}:${pool}`]);
    const existing=(await client.query<Reservation>(
      'SELECT id,status,source FROM personal_capacity_reservations WHERE idempotency_key=$1',[input.idempotencyKey],
    )).rows[0];
    if(existing) return existing;
    const window=await this.ensureWindow(client,input.organizationId,pool,input.actorId);
    const monthlyUsed=Number((await client.query<{units:string}>(
      `SELECT count(*)::text AS units FROM personal_capacity_reservations
       WHERE allowance_window_id=$1 AND status IN ('RESERVED','SETTLED')`,[window.id],
    )).rows[0].units);
    if(monthlyUsed<window.granted_units) {
      return this.insertReservation(client,input,'MONTHLY',window.id,null);
    }
    const allocation=(await client.query<{id:string}>(
      `SELECT allocation.id
       FROM personal_package_allocations allocation
       WHERE allocation.pool_code=$1 AND allocation.status='ACTIVE'
         AND allocation.starts_at<=now() AND allocation.expires_at>now()
         AND allocation.granted_units>(
           SELECT count(*) FROM personal_capacity_reservations reservation
           WHERE reservation.package_allocation_id=allocation.id
             AND reservation.status IN ('RESERVED','SETTLED')
         )
       ORDER BY allocation.expires_at,allocation.created_at,allocation.id
       LIMIT 1`,[pool],
    )).rows[0];
    if(allocation) return this.insertReservation(client,input,'PURCHASED',null,allocation.id);
    throw new ConflictException({
      message:'ظرفیت این سرویس در حال حاضر کافی نیست. تیکت و ویرایش دستی شما محفوظ است.',
      reasonCode:'PERSONAL_CAPACITY_EXHAUSTED',poolCode:pool,
    });
  }

  async settle(client:PoolClient,reservationId:string,subjectId:string,actorId:string|null) {
    const reservation=(await client.query<Reservation & {organization_id:string}>(
      'SELECT id,status,source,organization_id FROM personal_capacity_reservations WHERE id=$1 FOR UPDATE',[reservationId],
    )).rows[0];
    if(!reservation) throw new NotFoundException('رزرو ظرفیت یافت نشد.');
    if(reservation.status==='RELEASED') throw new ConflictException('رزرو آزادشده قابل تسویه نیست.');
    if(reservation.status==='SETTLED') return reservation;
    const record=(await client.query<Reservation>(
      `UPDATE personal_capacity_reservations
       SET status='SETTLED',subject_id=$2,settled_at=now(),updated_at=now()
       WHERE id=$1 RETURNING id,status,source`,[reservationId,subjectId],
    )).rows[0];
    await this.audit(client,reservation.organization_id,actorId,'personal_capacity.settled','personal_capacity_reservation',reservationId,{subjectId});
    return record;
  }

  async release(client:PoolClient,reservationId:string,actorId:string|null,reason:string) {
    const reservation=(await client.query<Reservation & {organization_id:string}>(
      'SELECT id,status,source,organization_id FROM personal_capacity_reservations WHERE id=$1 FOR UPDATE',[reservationId],
    )).rows[0];
    if(!reservation||reservation.status!=='RESERVED') return reservation??null;
    const record=(await client.query<Reservation>(
      `UPDATE personal_capacity_reservations
       SET status='RELEASED',released_at=now(),release_reason=$2,updated_at=now()
       WHERE id=$1 RETURNING id,status,source`,[reservationId,reason],
    )).rows[0];
    await this.audit(client,reservation.organization_id,actorId,'personal_capacity.released','personal_capacity_reservation',reservationId,{reason});
    return record;
  }

  private async summary(client:PoolClient,organizationId:string,actorId:string) {
    const windows=[];
    for(const pool of ['SUPPORT','AI'] as PersonalCapacityPool[]) windows.push(await this.ensureWindow(client,organizationId,pool,actorId));
    const poolRows=[];
    for(const window of windows) {
      const used=(await client.query<{reserved:string;settled:string}>(
        `SELECT count(*) FILTER(WHERE status='RESERVED')::text AS reserved,
          count(*) FILTER(WHERE status='SETTLED')::text AS settled
         FROM personal_capacity_reservations WHERE allowance_window_id=$1`,[window.id],
      )).rows[0];
      const purchased=(await client.query<{granted:string;reserved:string;settled:string}>(
        `SELECT
          COALESCE((SELECT sum(allocation.granted_units)
            FROM personal_package_allocations allocation
            WHERE allocation.pool_code=$1 AND allocation.status='ACTIVE'
              AND allocation.starts_at<=now() AND allocation.expires_at>now()),0)::text AS granted,
          count(reservation.id) FILTER(WHERE reservation.status='RESERVED')::text AS reserved,
          count(reservation.id) FILTER(WHERE reservation.status='SETTLED')::text AS settled
         FROM personal_capacity_reservations reservation
         JOIN personal_package_allocations allocation ON allocation.id=reservation.package_allocation_id
         WHERE allocation.pool_code=$1 AND allocation.status='ACTIVE'
           AND allocation.starts_at<=now() AND allocation.expires_at>now()`,[window.pool_code],
      )).rows[0];
      const monthlyReserved=Number(used.reserved),monthlySettled=Number(used.settled);
      const purchasedGranted=Number(purchased.granted),purchasedReserved=Number(purchased.reserved),purchasedSettled=Number(purchased.settled);
      poolRows.push({
        poolCode:window.pool_code,periodStartsAt:window.period_starts_at,periodEndsAt:window.period_ends_at,
        policySource:window.policy_source,monthlyGranted:window.granted_units,
        monthlyReserved,monthlySettled,monthlyRemaining:Math.max(0,window.granted_units-monthlyReserved-monthlySettled),
        purchasedGranted,purchasedReserved,purchasedSettled,
        purchasedRemaining:Math.max(0,purchasedGranted-purchasedReserved-purchasedSettled),
      });
    }
    const packages=(await client.query(
      `SELECT id,code,name,description,pool_code,unit_count,price_irt::text,validity_days
       FROM personal_packages WHERE status='ACTIVE' ORDER BY pool_code,name`,
    )).rows;
    const allocations=(await client.query(
      `SELECT id,package_name_snapshot,pool_code,granted_units,price_irt_snapshot::text,
        starts_at,expires_at,status
       FROM personal_package_allocations ORDER BY expires_at,created_at`,
    )).rows;
    return {organizationId,pools:poolRows,packages,allocations};
  }

  private async ensureWindow(client:PoolClient,organizationId:string,pool:PersonalCapacityPool,actorId:string) {
    const existing=(await client.query<{
      id:string;pool_code:PersonalCapacityPool;period_starts_at:Date;period_ends_at:Date;granted_units:number;policy_source:string;
    }>(
      `SELECT id,pool_code,period_starts_at,period_ends_at,granted_units,policy_source
       FROM personal_allowance_windows
       WHERE pool_code=$1 AND period_starts_at<=now() AND period_ends_at>now()`,[pool],
    )).rows[0];
    if(existing) return existing;
    const policy=(await client.query<{units:number;source:string}>(
      `SELECT COALESCE(override.monthly_units,policy.default_monthly_units) AS units,
        CASE WHEN override.organization_id IS NULL THEN 'DEFAULT' ELSE 'OVERRIDE' END AS source
       FROM personal_allowance_policies policy
       LEFT JOIN personal_allowance_overrides override
         ON override.organization_id=$1 AND override.pool_code=policy.pool_code
       WHERE policy.pool_code=$2`,[organizationId,pool],
    )).rows[0];
    if(!policy) throw new NotFoundException('سیاست ظرفیت شخصی یافت نشد.');
    const inserted=(await client.query<{
      id:string;pool_code:PersonalCapacityPool;period_starts_at:Date;period_ends_at:Date;granted_units:number;policy_source:string;
    }>(
      `INSERT INTO personal_allowance_windows(
        organization_id,pool_code,period_starts_at,period_ends_at,granted_units,policy_source
       ) VALUES($1,$2,date_trunc('month',now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC',
         (date_trunc('month',now() AT TIME ZONE 'UTC')+interval '1 month') AT TIME ZONE 'UTC',$3,$4)
       ON CONFLICT(organization_id,pool_code,period_starts_at,period_ends_at) DO NOTHING
       RETURNING id,pool_code,period_starts_at,period_ends_at,granted_units,policy_source`,
      [organizationId,pool,policy.units,policy.source],
    )).rows[0];
    const record=inserted ?? (await client.query(
      `SELECT id,pool_code,period_starts_at,period_ends_at,granted_units,policy_source
       FROM personal_allowance_windows
       WHERE pool_code=$1 AND period_starts_at<=now() AND period_ends_at>now()`,[pool],
    )).rows[0];
    if(inserted) await this.audit(client,organizationId,actorId,'personal_capacity.window_provisioned','personal_allowance_window',record.id,{poolCode:pool,grantedUnits:record.granted_units,policySource:record.policy_source});
    return record;
  }

  private insertReservation(client:PoolClient,input:{organizationId:string;poolCode:PersonalCapacityPool;subjectType:'SUPPORT_CASE'|'AI_ACTION';idempotencyKey:string;actorId:string},source:'MONTHLY'|'PURCHASED',windowId:string|null,allocationId:string|null) {
    return client.query<Reservation>(
      `INSERT INTO personal_capacity_reservations(
        organization_id,pool_code,source,allowance_window_id,package_allocation_id,
        subject_type,idempotency_key
       ) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id,status,source`,
      [input.organizationId,input.poolCode,source,windowId,allocationId,input.subjectType,input.idempotencyKey],
    ).then(async result=>{
      const record=result.rows[0];
      await this.audit(client,input.organizationId,input.actorId,'personal_capacity.reserved','personal_capacity_reservation',record.id,{poolCode:input.poolCode,source,subjectType:input.subjectType});
      return record;
    });
  }

  private pool(value?:string):PersonalCapacityPool {
    if(value!=='SUPPORT'&&value!=='AI') throw new BadRequestException('استخر ظرفیت معتبر نیست.');
    return value;
  }

  private aiKey(capability:PersonalAiCapability,idempotencyKey:string) {
    return `PERSONAL_AI:${capability}:${idempotencyKey}`;
  }

  private async aiReservation(client:PoolClient,idempotencyKey:string) {
    const keys=(['AI_TICKET_REVIEW','AI_SMART_INTAKE'] as PersonalAiCapability[]).map(capability=>this.aiKey(capability,idempotencyKey));
    return (await client.query<Reservation>(
      `SELECT id,status,source FROM personal_capacity_reservations
       WHERE pool_code='AI' AND subject_type='AI_ACTION' AND idempotency_key=ANY($1::text[])
       ORDER BY created_at DESC LIMIT 1`,[keys],
    )).rows[0];
  }

  private async personalWorkspace(organizationId:string) {
    const row=(await this.database.query<{id:string}>(
      `SELECT id FROM organizations WHERE id=$1 AND workspace_type='PERSONAL'`,[organizationId],
    )).rows[0];
    if(!row) throw new NotFoundException('فضای شخصی یافت نشد.');
    return row;
  }

  private async personalOwner(actor:TicketActor) {
    const row=(await this.database.query<{personal_owner_user_id:string}>(
      `SELECT personal_owner_user_id FROM organizations
       WHERE id=$1 AND workspace_type='PERSONAL' AND status='active'`,[actor.organizationId],
    )).rows[0];
    if(!row||row.personal_owner_user_id!==actor.userId||!actor.roles.includes('REQUESTER')) throw new ForbiddenException('فضای شخصی معتبر نیست.');
  }

  private async platform(userId:string) {
    const row=(await this.database.query<{is_platform_admin:boolean}>(
      'SELECT is_platform_admin FROM users WHERE id=$1 AND is_active=true',[userId],
    )).rows[0];
    if(!row?.is_platform_admin) throw new ForbiddenException();
  }

  private audit(client:PoolClient,organizationId:string|null,actorId:string|null,action:string,targetType:string,targetId:string|null,metadata:object) {
    return client.query(
      `INSERT INTO audit_logs(organization_id,actor_user_id,action,target_type,target_id,metadata)
       VALUES($1,$2,$3,$4,$5,$6)`,[organizationId,actorId,action,targetType,targetId,metadata],
    );
  }
}
