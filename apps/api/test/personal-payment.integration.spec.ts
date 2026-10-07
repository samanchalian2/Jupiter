import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ConflictException, ForbiddenException, ServiceUnavailableException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../src/database/database.service.js';
import { PersonalCapacityService } from '../src/personal-capacity/personal-capacity.service.js';
import { PaymentCreateInput, PaymentProviderRegistry, PaymentVerifyInput, PersonalPaymentProvider } from '../src/personal-payments/payment-provider.js';
import { PersonalPaymentService } from '../src/personal-payments/personal-payment.service.js';

class ScriptedProvider implements PersonalPaymentProvider {
  readonly code='ZARINPAL' as const;
  createCalls=0;verifyCalls=0;failNextCreate=false;verifyKind:'SUCCESS'|'FAIL'|'MISMATCH'='SUCCESS';
  async create(input:PaymentCreateInput) { this.createCalls++;if(this.failNextCreate){this.failNextCreate=false;throw new ServiceUnavailableException('test');}const authority=`TEST_${input.orderId}`;return {authority,paymentUrl:this.paymentUrl(authority),resultCode:'100'}; }
  async verify(input:PaymentVerifyInput) { this.verifyCalls++;if(this.verifyKind==='FAIL')return {verified:false,resultCode:'-51'};return {verified:true,referenceId:`REF-${input.authority}`,verifiedAmountIrt:this.verifyKind==='MISMATCH'?input.amountIrt+1:input.amountIrt,resultCode:'100'}; }
  paymentUrl(authority:string){return `http://test.invalid/pay/${authority}`;}
}
class ScriptedRegistry extends PaymentProviderRegistry {
  constructor(readonly scripted:ScriptedProvider){super();}
  override provider(){return this.scripted;}
  override readiness(){return {ready:true,callbackConfigured:true};}
}

const database=new DatabaseService();
const capacity=new PersonalCapacityService(database);
const provider=new ScriptedProvider();
const payments=new PersonalPaymentService(database,new ScriptedRegistry(provider));
const marker=randomUUID().replace(/-/g,'').slice(0,12);
let platformId='',outsiderId='',ownerAId='',ownerBId='',personalAId='',personalBId='',packageId='';
const organizations:string[]=[];const users:string[]=[];
const actorA=()=>({userId:ownerAId,organizationId:personalAId,roles:['REQUESTER']});
const actorB=()=>({userId:ownerBId,organizationId:personalBId,roles:['REQUESTER']});

async function personal(ownerId:string,label:string){
  const organization=(await database.query<{id:string}>(`INSERT INTO organizations(slug,name,status,workspace_type,personal_owner_user_id) VALUES($1,$2,'active','PERSONAL',$3) RETURNING id`,[`payment-${label}-${marker}`,`Payment ${label}`,ownerId])).rows[0];
  organizations.push(organization.id);
  const membership=(await database.query<{id:string}>(`INSERT INTO memberships(organization_id,user_id,status) VALUES($1,$2,'active') RETURNING id`,[organization.id,ownerId])).rows[0];
  await database.query(`INSERT INTO membership_roles(membership_id,role_id) SELECT $1,id FROM roles WHERE code='REQUESTER'`,[membership.id]);
  return organization.id;
}

describe('GOAL-064 personal payment core',()=>{
  beforeAll(async()=>{
    const rows=await Promise.all([
      database.query<{id:string}>(`INSERT INTO users(email,display_name,password_hash,is_platform_admin) VALUES($1,'Payment Platform','fixture',true) RETURNING id`,[`payment-platform-${marker}@jupiter.test`]),
      database.query<{id:string}>(`INSERT INTO users(email,display_name,password_hash) VALUES($1,'Payment Outsider','fixture') RETURNING id`,[`payment-outsider-${marker}@jupiter.test`]),
      database.query<{id:string}>(`INSERT INTO users(email,display_name,password_hash) VALUES($1,'Payment Owner A','fixture') RETURNING id`,[`payment-owner-a-${marker}@jupiter.test`]),
      database.query<{id:string}>(`INSERT INTO users(email,display_name,password_hash) VALUES($1,'Payment Owner B','fixture') RETURNING id`,[`payment-owner-b-${marker}@jupiter.test`]),
    ]);
    [platformId,outsiderId,ownerAId,ownerBId]=rows.map(row=>row.rows[0].id);users.push(platformId,outsiderId,ownerAId,ownerBId);
    personalAId=await personal(ownerAId,'a');personalBId=await personal(ownerBId,'b');
    packageId=(await capacity.savePackage(platformId,{code:`PAY_${marker.toUpperCase()}`,name:'بسته پرداخت آزمایشی',description:'بسته آزمون مرز پرداخت شخصی',poolCode:'SUPPORT',unitCount:7,priceIrt:250000,validityDays:90,status:'ACTIVE'})).id;
    await payments.savePlatformSettings(platformId,{availability:'ENABLED',mode:'LOCAL_TEST'});
  });

  afterAll(async()=>{
    await database.query(`UPDATE personal_payment_settings SET availability='DISABLED',mode='LOCAL_TEST',updated_by_user_id=NULL,updated_at=now() WHERE provider_code='ZARINPAL'`);
    await database.query('DELETE FROM personal_payment_refunds WHERE organization_id=ANY($1::uuid[])',[organizations]);
    await database.query('DELETE FROM personal_payment_attempts WHERE organization_id=ANY($1::uuid[])',[organizations]);
    await database.query('DELETE FROM personal_payment_fulfillments WHERE organization_id=ANY($1::uuid[])',[organizations]);
    await database.query('DELETE FROM personal_package_allocations WHERE organization_id=ANY($1::uuid[])',[organizations]);
    await database.query('DELETE FROM personal_payment_orders WHERE organization_id=ANY($1::uuid[])',[organizations]);
    await database.query('DELETE FROM audit_logs WHERE organization_id=ANY($1::uuid[]) OR actor_user_id=ANY($2::uuid[])',[organizations,users]);
    await database.query('DELETE FROM membership_roles WHERE membership_id IN (SELECT id FROM memberships WHERE organization_id=ANY($1::uuid[]))',[organizations]);
    await database.query('DELETE FROM memberships WHERE organization_id=ANY($1::uuid[])',[organizations]);
    await database.query('DELETE FROM organizations WHERE id=ANY($1::uuid[])',[organizations]);
    await database.query('DELETE FROM personal_packages WHERE id=$1',[packageId]);
    await database.query('DELETE FROM users WHERE id=ANY($1::uuid[])',[users]);
    await database.onModuleDestroy();
  });

  it('allows only the active personal owner and snapshots server-owned package terms idempotently',async()=>{
    await expect(payments.createOrder({userId:outsiderId,organizationId:personalAId,roles:['REQUESTER']},packageId,`deny-${marker}`)).rejects.toBeInstanceOf(ForbiddenException);
    const key=`create-${marker}`;
    const first=await payments.createOrder(actorA(),packageId,key);
    const duplicate=await payments.createOrder(actorA(),packageId,key);
    expect(duplicate.id).toBe(first.id);expect(provider.createCalls).toBe(1);
    const stored=(await database.query<{package_name_snapshot:string;pool_code:string;unit_count_snapshot:number;amount_irt_snapshot:string;currency:string;validity_days_snapshot:number;status:string}>(`SELECT package_name_snapshot,pool_code,unit_count_snapshot,amount_irt_snapshot::text,currency,validity_days_snapshot,status FROM personal_payment_orders WHERE id=$1`,[first.id])).rows[0];
    expect(stored).toEqual({package_name_snapshot:'بسته پرداخت آزمایشی',pool_code:'SUPPORT',unit_count_snapshot:7,amount_irt_snapshot:'250000',currency:'IRT',validity_days_snapshot:90,status:'PENDING'});
    await capacity.savePackage(platformId,{id:packageId,code:`PAY_${marker.toUpperCase()}`,name:'نام بعدی کاتالوگ',description:'تغییر بعد از snapshot',poolCode:'SUPPORT',unitCount:11,priceIrt:900000,validityDays:365,status:'ACTIVE'});
    expect((await database.query<{amount:string;units:number}>(`SELECT amount_irt_snapshot::text AS amount,unit_count_snapshot AS units FROM personal_payment_orders WHERE id=$1`,[first.id])).rows[0]).toEqual({amount:'250000',units:7});
  });

  it('verifies server-side and fulfills exactly once while isolating receipt and tenant rows',async()=>{
    const order=(await database.query<{id:string;provider_authority:string}>(`SELECT id,provider_authority FROM personal_payment_orders WHERE idempotency_key=$1`,[`create-${marker}`])).rows[0];
    const paid=await payments.callback(order.provider_authority,'OK');
    const replay=await payments.callback(order.provider_authority,'OK');
    expect(paid.status).toBe('PAID');expect(replay.status).toBe('PAID');expect(provider.verifyCalls).toBe(1);
    expect((await database.query<{count:number}>(`SELECT count(*)::int AS count FROM personal_payment_fulfillments WHERE order_id=$1`,[order.id])).rows[0].count).toBe(1);
    expect((await database.query<{count:number}>(`SELECT count(*)::int AS count FROM personal_package_allocations WHERE organization_id=$1 AND allocation_source='PAYMENT'`,[personalAId])).rows[0].count).toBe(1);
    const receipt=await payments.receipt(actorA(),order.id);expect(receipt).toMatchObject({officialInvoice:false,amountIrt:'250000',currency:'IRT',unitCount:7});
    await expect(payments.receipt(actorB(),order.id)).rejects.toThrow();
    const tenantRows=await database.withOrganization(personalBId,client=>client.query(`SELECT id FROM personal_payment_orders WHERE id=$1`,[order.id]));expect(tenantRows.rowCount).toBe(0);
  });

  it('supports provider retry, owner cancellation, expiry and rejects failed or mismatched verification',async()=>{
    provider.failNextCreate=true;
    const retryKey=`retry-${marker}`;
    await expect(payments.createOrder(actorA(),packageId,retryKey)).rejects.toBeInstanceOf(ServiceUnavailableException);
    const retried=await payments.createOrder(actorA(),packageId,retryKey);expect(retried.status).toBe('PENDING');
    const cancelled=await payments.cancel(actorA(),retried.id);expect(cancelled.status).toBe('CANCELLED');

    const failed=await payments.createOrder(actorA(),packageId,`failed-${marker}`);provider.verifyKind='FAIL';
    const failedAuthority=(await database.query<{provider_authority:string}>('SELECT provider_authority FROM personal_payment_orders WHERE id=$1',[failed.id])).rows[0].provider_authority;
    await expect(payments.callback(failedAuthority,'OK')).rejects.toBeInstanceOf(ConflictException);
    expect((await database.query<{count:number}>('SELECT count(*)::int AS count FROM personal_payment_fulfillments WHERE order_id=$1',[failed.id])).rows[0].count).toBe(0);

    provider.verifyKind='MISMATCH';const mismatch=await payments.createOrder(actorA(),packageId,`mismatch-${marker}`);
    const mismatchAuthority=(await database.query<{provider_authority:string}>('SELECT provider_authority FROM personal_payment_orders WHERE id=$1',[mismatch.id])).rows[0].provider_authority;
    await expect(payments.callback(mismatchAuthority,'OK')).rejects.toBeInstanceOf(ConflictException);
    provider.verifyKind='SUCCESS';

    const expired=await payments.createOrder(actorA(),packageId,`expired-${marker}`);
    await database.query(`UPDATE personal_payment_orders SET expires_at=now()-interval '1 minute' WHERE id=$1`,[expired.id]);
    const expiredAuthority=(await database.query<{provider_authority:string}>('SELECT provider_authority FROM personal_payment_orders WHERE id=$1',[expired.id])).rows[0].provider_authority;
    await expect(payments.callback(expiredAuthority,'OK')).rejects.toBeInstanceOf(ConflictException);
  });

  it('records only external manual refunds with the real Platform actor and no credential material',async()=>{
    const paid=(await database.query<{id:string}>(`SELECT id FROM personal_payment_orders WHERE organization_id=$1 AND status='PAID' LIMIT 1`,[personalAId])).rows[0];
    const refund=await payments.recordRefund(platformId,paid.id,{amountIrt:100000,externalReference:`EXT-${marker}`,reason:'بازپرداخت انجام‌شده خارج از ژوپیتر'});expect(refund.id).toBeTruthy();
    await expect(payments.recordRefund(outsiderId,paid.id,{amountIrt:1,externalReference:'NO',reason:'غیرمجاز'})).rejects.toBeInstanceOf(ForbiddenException);
    await expect(payments.recordRefund(platformId,paid.id,{amountIrt:200000,externalReference:`EXT2-${marker}`,reason:'بیش از مبلغ'})).rejects.toBeInstanceOf(ConflictException);
    const audit=(await database.query<{actor_user_id:string;metadata:string}>(`SELECT actor_user_id,metadata::text FROM audit_logs WHERE action='personal_payment.external_refund_recorded' AND target_id=$1`,[refund.id])).rows[0];
    expect(audit.actor_user_id).toBe(platformId);expect(audit.metadata).not.toMatch(/merchant|secret|credential/i);
  });
});
