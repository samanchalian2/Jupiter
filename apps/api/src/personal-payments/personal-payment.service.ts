import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../database/database.service.js';
import { TicketActor } from '../tickets/ticket-actor.service.js';
import { personalPaymentEnvironment } from '../config.js';
import { PaymentMode, PaymentProviderRegistry } from './payment-provider.js';

type OrderRow={
  id:string;organization_id:string;owner_user_id:string;package_id:string;package_code_snapshot:string;package_name_snapshot:string;
  pool_code:'SUPPORT'|'AI';unit_count_snapshot:number;amount_irt_snapshot:string;currency:'IRT';validity_days_snapshot:number;
  provider_code:'ZARINPAL';provider_mode:PaymentMode;provider_authority:string|null;provider_reference:string|null;
  idempotency_key:string;status:string;expires_at:Date;paid_at:Date|null;created_at:Date;updated_at:Date;
};

@Injectable()
export class PersonalPaymentService {
  constructor(private readonly database:DatabaseService,private readonly providers:PaymentProviderRegistry) {}

  async ownerState(actor:TicketActor) {
    await this.personalOwner(actor);
    const setting=await this.safeSetting();
    const orders=(await this.database.withOrganization(actor.organizationId,client=>client.query<OrderRow>(
      `SELECT * FROM personal_payment_orders WHERE owner_user_id=$1 ORDER BY created_at DESC LIMIT 50`,[actor.userId],
    ))).rows;
    return {payment:{providerCode:'ZARINPAL',availability:setting.availability,mode:setting.mode},orders:orders.map(row=>this.ownerOrder(row))};
  }

  async createOrder(actor:TicketActor,packageId:string|undefined,idempotencyKey:string|undefined) {
    await this.personalOwner(actor);
    const key=idempotencyKey?.trim()??'';
    if(key.length<8||key.length>200) throw new BadRequestException('کلید تکرارناپذیری معتبر الزامی است.');
    const setting=await this.enabledSetting();
    let order=await this.database.transaction(async client=>{
      const existing=(await client.query<OrderRow>(
        `SELECT * FROM personal_payment_orders WHERE organization_id=$1 AND idempotency_key=$2 FOR UPDATE`,[actor.organizationId,key],
      )).rows[0];
      if(existing) return existing;
      const item=(await client.query<{id:string;code:string;name:string;pool_code:'SUPPORT'|'AI';unit_count:number;price_irt:string;validity_days:number}>(
        `SELECT id,code,name,pool_code,unit_count,price_irt::text,validity_days
         FROM personal_packages WHERE id=$1 AND status='ACTIVE' FOR SHARE`,[packageId??''],
      )).rows[0];
      if(!item) throw new NotFoundException('بسته فعال شخصی یافت نشد.');
      if(Number(item.price_irt)<=0) throw new BadRequestException('این بسته برای پرداخت آنلاین قیمت معتبر ندارد.');
      const created=(await client.query<OrderRow>(
        `INSERT INTO personal_payment_orders(
          organization_id,owner_user_id,package_id,package_code_snapshot,package_name_snapshot,pool_code,
          unit_count_snapshot,amount_irt_snapshot,currency,validity_days_snapshot,provider_code,provider_mode,
          idempotency_key,status,expires_at
         ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,'IRT',$9,'ZARINPAL',$10,$11,'CREATED',now()+interval '30 minutes') RETURNING *`,
        [actor.organizationId,actor.userId,item.id,item.code,item.name,item.pool_code,item.unit_count,item.price_irt,item.validity_days,setting.mode,key],
      )).rows[0];
      await this.audit(client,actor.organizationId,actor.userId,'personal_payment.order_created','personal_payment_order',created.id,{packageCode:item.code,poolCode:item.pool_code,unitCount:item.unit_count,amountIrt:item.price_irt,currency:'IRT',provider:'ZARINPAL',mode:setting.mode});
      return created;
    });
    if(order.status!=='PAID'&&order.expires_at<=new Date()) {
      await this.database.query(`UPDATE personal_payment_orders SET status='EXPIRED',updated_at=now() WHERE id=$1 AND status NOT IN ('PAID','CANCELLED','EXPIRED')`,[order.id]);
      throw new ConflictException('سفارش منقضی شده است.');
    }
    if(order.status==='PAID'||order.status==='PENDING') return this.orderWithUrl(order);
    if(order.status==='CANCELLED'||order.status==='EXPIRED') throw new ConflictException('این سفارش دیگر قابل پرداخت نیست.');
    order=await this.claimCreate(order.id,actor.organizationId);
    if(order.status==='EXPIRED') throw new ConflictException('سفارش منقضی شده است.');
    const provider=this.providers.provider(order.provider_mode);
    try {
      const result=await provider.create({orderId:order.id,amountIrt:Number(order.amount_irt_snapshot),currency:'IRT',description:`Jupiter ${order.package_name_snapshot}`,callbackUrl:this.callbackUrl()});
      order=await this.database.transaction(async client=>{
        const updated=(await client.query<OrderRow>(
          `UPDATE personal_payment_orders SET status='PENDING',provider_authority=$3,updated_at=now()
           WHERE id=$1 AND organization_id=$2 AND status='CREATING' RETURNING *`,[order.id,order.organization_id,result.authority],
        )).rows[0];
        if(!updated) throw new ConflictException('وضعیت سفارش تغییر کرده است.');
        await client.query(`INSERT INTO personal_payment_attempts(organization_id,order_id,operation,outcome,provider_code,provider_result_code) VALUES($1,$2,'CREATE','SUCCEEDED','ZARINPAL',$3)`,[order.organization_id,order.id,result.resultCode]);
        await this.audit(client,order.organization_id,actor.userId,'personal_payment.requested','personal_payment_order',order.id,{provider:'ZARINPAL',mode:order.provider_mode});
        return updated;
      });
      return {...this.ownerOrder(order),paymentUrl:result.paymentUrl};
    } catch(error) {
      await this.database.transaction(async client=>{
        await client.query(`UPDATE personal_payment_orders SET status='FAILED',updated_at=now() WHERE id=$1 AND status='CREATING'`,[order.id]);
        await client.query(`INSERT INTO personal_payment_attempts(organization_id,order_id,operation,outcome,provider_code,failure_code) VALUES($1,$2,'CREATE','FAILED','ZARINPAL','PROVIDER_UNAVAILABLE')`,[order.organization_id,order.id]);
      });
      if(error instanceof BadRequestException||error instanceof ConflictException||error instanceof ServiceUnavailableException) throw error;
      throw new ServiceUnavailableException('ایجاد درخواست پرداخت ناموفق بود.');
    }
  }

  async cancel(actor:TicketActor,orderId:string) {
    await this.personalOwner(actor);
    return this.database.transaction(async client=>{
      const order=(await client.query<OrderRow>(`SELECT * FROM personal_payment_orders WHERE id=$1 AND organization_id=$2 AND owner_user_id=$3 FOR UPDATE`,[orderId,actor.organizationId,actor.userId])).rows[0];
      if(!order) throw new NotFoundException('سفارش یافت نشد.');
      if(order.status==='PAID') throw new ConflictException('سفارش پرداخت‌شده قابل لغو نیست.');
      if(order.status==='CANCELLED') return this.ownerOrder(order);
      if(!['CREATED','FAILED','PENDING'].includes(order.status)) throw new ConflictException('سفارش در حال پردازش است.');
      const updated=(await client.query<OrderRow>(`UPDATE personal_payment_orders SET status='CANCELLED',cancelled_at=now(),updated_at=now() WHERE id=$1 RETURNING *`,[order.id])).rows[0];
      await this.audit(client,order.organization_id,actor.userId,'personal_payment.cancelled','personal_payment_order',order.id,{});
      return this.ownerOrder(updated);
    });
  }

  async callback(authority:string|undefined,status:string|undefined) {
    const normalized=authority?.trim()??'';
    if(!normalized||normalized.length>200) throw new BadRequestException('مرجع پرداخت معتبر نیست.');
    let order=(await this.database.query<OrderRow>(`SELECT * FROM personal_payment_orders WHERE provider_code='ZARINPAL' AND provider_authority=$1`,[normalized])).rows[0];
    if(!order) throw new NotFoundException('سفارش پرداخت یافت نشد.');
    if(order.status==='PAID') return this.callbackProjection(order);
    if(status!=='OK') {
      if(order.status==='PENDING') await this.database.transaction(async client=>{
        await client.query(`UPDATE personal_payment_orders SET status='CANCELLED',cancelled_at=now(),updated_at=now() WHERE id=$1 AND status='PENDING'`,[order.id]);
        await client.query(`INSERT INTO personal_payment_attempts(organization_id,order_id,operation,outcome,provider_code,failure_code) VALUES($1,$2,'VERIFY','FAILED','ZARINPAL','CUSTOMER_CANCELLED')`,[order.organization_id,order.id]);
        await this.audit(client,order.organization_id,null,'personal_payment.callback_cancelled','personal_payment_order',order.id,{provider:'ZARINPAL'});
      });
      return {status:'CANCELLED',orderId:order.id,message:'پرداخت تکمیل نشد.'};
    }
    order=await this.claimVerification(order.id);
    if(order.status==='EXPIRED') throw new ConflictException('سفارش منقضی شده است.');
    const provider=this.providers.provider(order.provider_mode);
    let result;
    try { result=await provider.verify({authority:normalized,amountIrt:Number(order.amount_irt_snapshot),currency:'IRT'}); }
    catch(error) {
      await this.database.transaction(async client=>{
        await client.query(`UPDATE personal_payment_orders SET status='PENDING',updated_at=now() WHERE id=$1 AND status='VERIFYING'`,[order.id]);
        await client.query(`INSERT INTO personal_payment_attempts(organization_id,order_id,operation,outcome,provider_code,failure_code) VALUES($1,$2,'VERIFY','FAILED','ZARINPAL','PROVIDER_UNAVAILABLE')`,[order.organization_id,order.id]);
      });
      throw error;
    }
    if(!result.verified||!result.referenceId||result.verifiedAmountIrt!==Number(order.amount_irt_snapshot)) {
      await this.database.transaction(async client=>{
        await client.query(`UPDATE personal_payment_orders SET status='FAILED',updated_at=now() WHERE id=$1 AND status='VERIFYING'`,[order.id]);
        await client.query(`INSERT INTO personal_payment_attempts(organization_id,order_id,operation,outcome,provider_code,provider_result_code,failure_code) VALUES($1,$2,'VERIFY','FAILED','ZARINPAL',$3,$4)`,[order.organization_id,order.id,result.resultCode,result.alreadyVerified?'REPLAY_OR_FOREIGN_VERIFICATION':result.verifiedAmountIrt!==Number(order.amount_irt_snapshot)?'AMOUNT_MISMATCH':'NOT_VERIFIED']);
      });
      throw new ConflictException('تأیید نهایی پرداخت ناموفق بود.');
    }
    return this.database.transaction(async client=>{
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[`payment:${order.id}`]);
      const locked=(await client.query<OrderRow>('SELECT * FROM personal_payment_orders WHERE id=$1 FOR UPDATE',[order.id])).rows[0];
      if(locked.status==='PAID') return this.callbackProjection(locked);
      if(locked.status!=='VERIFYING') throw new ConflictException('وضعیت سفارش برای تأیید معتبر نیست.');
      const allocation=(await client.query<{id:string}>(
        `INSERT INTO personal_package_allocations(
          organization_id,package_id,package_code_snapshot,package_name_snapshot,pool_code,granted_units,
          price_irt_snapshot,starts_at,expires_at,status,allocation_source,idempotency_key,allocation_reason,allocated_by_user_id
         ) VALUES($1,$2,$3,$4,$5,$6,$7,now(),now()+($8::text||' days')::interval,'ACTIVE','PAYMENT',$9,$10,NULL)
         ON CONFLICT(organization_id,idempotency_key) DO UPDATE SET idempotency_key=EXCLUDED.idempotency_key RETURNING id`,
        [locked.organization_id,locked.package_id,locked.package_code_snapshot,locked.package_name_snapshot,locked.pool_code,
          locked.unit_count_snapshot,locked.amount_irt_snapshot,locked.validity_days_snapshot,`PAYMENT_ORDER:${locked.id}`,'پرداخت تأییدشده'],
      )).rows[0];
      await client.query(`INSERT INTO personal_payment_fulfillments(organization_id,order_id,allocation_id) VALUES($1,$2,$3) ON CONFLICT(order_id) DO NOTHING`,[locked.organization_id,locked.id,allocation.id]);
      const paid=(await client.query<OrderRow>(`UPDATE personal_payment_orders SET status='PAID',provider_reference=$2,paid_at=now(),updated_at=now() WHERE id=$1 RETURNING *`,[locked.id,result.referenceId])).rows[0];
      await client.query(`INSERT INTO personal_payment_attempts(organization_id,order_id,operation,outcome,provider_code,provider_result_code) VALUES($1,$2,'VERIFY','SUCCEEDED','ZARINPAL',$3)`,[locked.organization_id,locked.id,result.resultCode]);
      await this.audit(client,locked.organization_id,null,'personal_payment.fulfilled','personal_payment_order',locked.id,{provider:'ZARINPAL',poolCode:locked.pool_code,unitCount:locked.unit_count_snapshot,amountIrt:locked.amount_irt_snapshot,currency:'IRT',allocationId:allocation.id});
      return this.callbackProjection(paid);
    });
  }

  async receipt(actor:TicketActor,orderId:string) {
    await this.personalOwner(actor);
    const row=(await this.database.withOrganization(actor.organizationId,client=>client.query<OrderRow>(
      `SELECT * FROM personal_payment_orders WHERE id=$1 AND owner_user_id=$2`,[orderId,actor.userId],
    ))).rows[0];
    if(!row) throw new NotFoundException('رسید یافت نشد.');
    if(row.status!=='PAID') throw new ConflictException('پرداخت هنوز تأیید نشده است.');
    return {kind:'PAYMENT_RECEIPT',officialInvoice:false,orderId:row.id,packageName:row.package_name_snapshot,poolCode:row.pool_code,unitCount:row.unit_count_snapshot,amountIrt:row.amount_irt_snapshot,currency:'IRT',paidAt:row.paid_at,provider:'ZARINPAL',reference:row.provider_reference};
  }

  async platformSettings(actorId:string) { await this.platform(actorId);const setting=await this.safeSetting();return {...setting,...this.providers.readiness(setting.mode)}; }
  async savePlatformSettings(actorId:string,input:{availability?:string;mode?:string}) {
    await this.platform(actorId);
    if(!['ENABLED','DISABLED'].includes(input.availability??'')||!['LOCAL_TEST','LIVE'].includes(input.mode??'')) throw new BadRequestException('تنظیمات غیرمحرمانه پرداخت معتبر نیست.');
    if(input.mode==='LOCAL_TEST'&&process.env.NODE_ENV==='production') throw new BadRequestException('حالت محلی در production مجاز نیست.');
    return this.database.transaction(async client=>{
      const row=(await client.query<{provider_code:string;availability:'ENABLED'|'DISABLED';mode:PaymentMode}>(`UPDATE personal_payment_settings SET availability=$1,mode=$2,updated_by_user_id=$3,updated_at=now() WHERE provider_code='ZARINPAL' RETURNING provider_code,availability,mode`,[input.availability,input.mode,actorId])).rows[0];
      await this.audit(client,null,actorId,'personal_payment.settings_changed','personal_payment_settings',null,{provider:'ZARINPAL',availability:row.availability,mode:row.mode});
      return {...row,...this.providers.readiness(row.mode)};
    });
  }
  async platformOrders(actorId:string) { await this.platform(actorId);return (await this.database.query(`SELECT id,organization_id,package_name_snapshot,pool_code,unit_count_snapshot,amount_irt_snapshot::text,currency,provider_code,provider_mode,status,provider_reference,expires_at,paid_at,created_at FROM personal_payment_orders ORDER BY created_at DESC LIMIT 200`)).rows; }
  async recordRefund(actorId:string,orderId:string,input:{amountIrt?:number;externalReference?:string;reason?:string}) {
    await this.platform(actorId);const amount=input.amountIrt;const reference=input.externalReference?.trim()??'';const reason=input.reason?.trim()??'';
    if(!Number.isSafeInteger(amount)||amount!<1||reference.length<2||reference.length>200||reason.length<2||reason.length>1000) throw new BadRequestException('اطلاعات بازپرداخت معتبر نیست.');
    return this.database.transaction(async client=>{
      const order=(await client.query<OrderRow>('SELECT * FROM personal_payment_orders WHERE id=$1 FOR UPDATE',[orderId])).rows[0];
      if(!order||order.status!=='PAID') throw new NotFoundException('سفارش پرداخت‌شده یافت نشد.');
      const refunded=Number((await client.query<{total:string}>('SELECT COALESCE(sum(amount_irt),0)::text AS total FROM personal_payment_refunds WHERE order_id=$1',[orderId])).rows[0].total);
      if(refunded+amount!>Number(order.amount_irt_snapshot)) throw new ConflictException('مبلغ بازپرداخت از مبلغ پرداخت بیشتر است.');
      const row=(await client.query<{id:string}>(`INSERT INTO personal_payment_refunds(organization_id,order_id,amount_irt,external_reference,reason,recorded_by_user_id) VALUES($1,$2,$3,$4,$5,$6) RETURNING id`,[order.organization_id,order.id,amount,reference,reason,actorId])).rows[0];
      await this.audit(client,order.organization_id,actorId,'personal_payment.external_refund_recorded','personal_payment_refund',row.id,{orderId:order.id,amountIrt:amount,currency:'IRT',externalReference:reference,reason});
      return row;
    });
  }

  private async claimCreate(orderId:string,organizationId:string) {
    return this.database.transaction(async client=>{
      const current=(await client.query<OrderRow>('SELECT * FROM personal_payment_orders WHERE id=$1 AND organization_id=$2 FOR UPDATE',[orderId,organizationId])).rows[0];
      if(!current) throw new NotFoundException('سفارش یافت نشد.');
      if(current.expires_at<=new Date()) return (await client.query<OrderRow>(`UPDATE personal_payment_orders SET status='EXPIRED',updated_at=now() WHERE id=$1 RETURNING *`,[orderId])).rows[0];
      if(!['CREATED','FAILED'].includes(current.status)) throw new ConflictException('سفارش هم‌اکنون در حال پردازش است.');
      const row=(await client.query<OrderRow>(`UPDATE personal_payment_orders SET status='CREATING',updated_at=now() WHERE id=$1 RETURNING *`,[orderId])).rows[0];
      await client.query(`INSERT INTO personal_payment_attempts(organization_id,order_id,operation,outcome,provider_code) VALUES($1,$2,'CREATE','REQUESTED','ZARINPAL')`,[organizationId,orderId]);
      return row;
    });
  }
  private async claimVerification(orderId:string) {
    return this.database.transaction(async client=>{
      let row=(await client.query<OrderRow>('SELECT * FROM personal_payment_orders WHERE id=$1 FOR UPDATE',[orderId])).rows[0];
      if(row.status==='PAID') return row;
      if(row.expires_at<=new Date()) return (await client.query<OrderRow>(`UPDATE personal_payment_orders SET status='EXPIRED',updated_at=now() WHERE id=$1 RETURNING *`,[orderId])).rows[0];
      if(row.status!=='PENDING'&&!(row.status==='VERIFYING'&&Date.now()-row.updated_at.getTime()>300000)) throw new ConflictException('سفارش قابل تأیید نیست.');
      row=(await client.query<OrderRow>(`UPDATE personal_payment_orders SET status='VERIFYING',updated_at=now() WHERE id=$1 RETURNING *`,[orderId])).rows[0];
      await client.query(`INSERT INTO personal_payment_attempts(organization_id,order_id,operation,outcome,provider_code) VALUES($1,$2,'VERIFY','REQUESTED','ZARINPAL')`,[row.organization_id,row.id]);
      return row;
    });
  }
  private async safeSetting() { return (await this.database.query<{provider_code:string;availability:'ENABLED'|'DISABLED';mode:PaymentMode}>(`SELECT provider_code,availability,mode FROM personal_payment_settings WHERE provider_code='ZARINPAL'`)).rows[0]; }
  private async enabledSetting() { const row=await this.safeSetting();if(!row||row.availability!=='ENABLED') throw new ServiceUnavailableException('پرداخت آنلاین در حال حاضر فعال نیست.');const readiness=this.providers.readiness(row.mode);if(!readiness.ready)throw new ServiceUnavailableException('درگاه پرداخت هنوز آماده نشده است.');return row; }
  private callbackUrl() { return personalPaymentEnvironment().callbackUrl; }
  private ownerOrder(row:OrderRow) { return {id:row.id,packageName:row.package_name_snapshot,poolCode:row.pool_code,unitCount:row.unit_count_snapshot,amountIrt:row.amount_irt_snapshot,currency:row.currency,status:row.status,expiresAt:row.expires_at,paidAt:row.paid_at,createdAt:row.created_at}; }
  private orderWithUrl(row:OrderRow) { const provider=this.providers.provider(row.provider_mode);return {...this.ownerOrder(row),paymentUrl:row.provider_authority?provider.paymentUrl(row.provider_authority):undefined}; }
  private callbackProjection(row:OrderRow) { return {status:row.status,orderId:row.id,paidAt:row.paid_at,reference:row.provider_reference}; }
  private async personalOwner(actor:TicketActor) { const row=(await this.database.query<{personal_owner_user_id:string}>(`SELECT personal_owner_user_id FROM organizations WHERE id=$1 AND workspace_type='PERSONAL' AND status='active'`,[actor.organizationId])).rows[0];if(!row||row.personal_owner_user_id!==actor.userId||!actor.roles.includes('REQUESTER'))throw new ForbiddenException('فضای شخصی معتبر نیست.'); }
  private async platform(userId:string) { const row=(await this.database.query<{is_platform_admin:boolean}>('SELECT is_platform_admin FROM users WHERE id=$1 AND is_active=true',[userId])).rows[0];if(!row?.is_platform_admin)throw new ForbiddenException(); }
  private audit(client:PoolClient,organizationId:string|null,actorId:string|null,action:string,targetType:string,targetId:string|null,metadata:object) { return client.query(`INSERT INTO audit_logs(organization_id,actor_user_id,action,target_type,target_id,metadata) VALUES($1,$2,$3,$4,$5,$6)`,[organizationId,actorId,action,targetType,targetId,metadata]); }
}
