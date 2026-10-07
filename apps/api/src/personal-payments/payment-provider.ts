import { createHash } from 'node:crypto';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { personalPaymentEnvironment } from '../config.js';

export type PaymentMode='LOCAL_TEST'|'LIVE';
export type PaymentCreateInput={orderId:string;amountIrt:number;currency:'IRT';description:string;callbackUrl:string};
export type PaymentCreateResult={authority:string;paymentUrl:string;resultCode:string};
export type PaymentVerifyInput={authority:string;amountIrt:number;currency:'IRT'};
export type PaymentVerifyResult={verified:boolean;alreadyVerified?:boolean;referenceId?:string;verifiedAmountIrt?:number;resultCode:string};

export interface PersonalPaymentProvider {
  readonly code:'ZARINPAL';
  create(input:PaymentCreateInput):Promise<PaymentCreateResult>;
  verify(input:PaymentVerifyInput):Promise<PaymentVerifyResult>;
  paymentUrl(authority:string):string;
}

export class LocalTestPaymentProvider implements PersonalPaymentProvider {
  readonly code='ZARINPAL' as const;
  constructor(private readonly callbackUrl=personalPaymentEnvironment().callbackUrl) {}
  async create(input:PaymentCreateInput) {
    const authority=`LOCAL_${createHash('sha256').update(input.orderId).digest('hex').slice(0,32)}`;
    return {authority,paymentUrl:this.paymentUrl(authority),resultCode:'LOCAL_100'};
  }
  async verify(input:PaymentVerifyInput) {
    return {verified:true,referenceId:`LOCAL-${createHash('sha256').update(`${input.authority}:${input.amountIrt}`).digest('hex').slice(0,16)}`,verifiedAmountIrt:input.amountIrt,resultCode:'LOCAL_100'};
  }
  paymentUrl(authority:string) { const url=new URL(this.callbackUrl);url.searchParams.set('Authority',authority);url.searchParams.set('Status','OK');return url.toString(); }
}

export class ZarinpalPaymentProvider implements PersonalPaymentProvider {
  readonly code='ZARINPAL' as const;
  private readonly environment=personalPaymentEnvironment();
  private credential() { if(!this.environment.merchantId) throw new ServiceUnavailableException('درگاه پرداخت آماده نیست.');return this.environment.merchantId; }
  async create(input:PaymentCreateInput):Promise<PaymentCreateResult> {
    const response=await this.call('https://api.zarinpal.com/pg/v4/payment/request.json',{
      merchant_id:this.credential(),amount:input.amountIrt,currency:input.currency,
      callback_url:input.callbackUrl,description:input.description,
    });
    const data=this.data(response);const code=String(data.code??'');const authority=typeof data.authority==='string'?data.authority:'';
    if(code!=='100'||!authority) throw new ServiceUnavailableException('ایجاد درخواست پرداخت ناموفق بود.');
    return {authority,paymentUrl:this.paymentUrl(authority),resultCode:code};
  }
  async verify(input:PaymentVerifyInput):Promise<PaymentVerifyResult> {
    const response=await this.call('https://api.zarinpal.com/pg/v4/payment/verify.json',{
      merchant_id:this.credential(),amount:input.amountIrt,currency:input.currency,authority:input.authority,
    });
    const data=this.data(response);const code=String(data.code??'');
    if(code==='101') return {verified:false,alreadyVerified:true,resultCode:code};
    if(code!=='100') return {verified:false,resultCode:code||'PROVIDER_REJECTED'};
    const reference=data.ref_id===undefined?undefined:String(data.ref_id);
    const returnedAmount=typeof data.amount==='number'?data.amount:input.amountIrt;
    return {verified:true,referenceId:reference,verifiedAmountIrt:returnedAmount,resultCode:code};
  }
  paymentUrl(authority:string) { return `https://www.zarinpal.com/pg/StartPay/${encodeURIComponent(authority)}`; }
  private data(value:unknown):Record<string,unknown> { if(!value||typeof value!=='object')return {};const data=(value as {data?:unknown}).data;return data&&typeof data==='object'?data as Record<string,unknown>:{}; }
  private async call(url:string,body:object):Promise<unknown> {
    try {
      const response=await fetch(url,{method:'POST',headers:{'content-type':'application/json','user-agent':'Jupiter Payment Core'},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
      if(!response.ok) throw new Error('HTTP');
      return await response.json();
    } catch { throw new ServiceUnavailableException('ارتباط امن با درگاه پرداخت برقرار نشد.'); }
  }
}

@Injectable()
export class PaymentProviderRegistry {
  provider(mode:PaymentMode):PersonalPaymentProvider {
    if(mode==='LOCAL_TEST') {
      if(process.env.NODE_ENV==='production') throw new ServiceUnavailableException('حالت پرداخت محلی در محیط production مجاز نیست.');
      return new LocalTestPaymentProvider();
    }
    return new ZarinpalPaymentProvider();
  }
  readiness(mode:PaymentMode) { const env=personalPaymentEnvironment();return {ready:mode==='LOCAL_TEST'?process.env.NODE_ENV!=='production':env.liveReady,callbackConfigured:Boolean(env.callbackUrl)}; }
}
