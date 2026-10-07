import { Body, Controller, Get, Headers, Param, Post, Query, Res, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service.js';
import { TicketActorService } from '../tickets/ticket-actor.service.js';
import { PersonalPaymentService } from './personal-payment.service.js';
import { personalPaymentWebReturnUrl } from '../config.js';

type RedirectResponse={redirect:(status:number,url:string)=>void};

@Controller('personal/payments')
export class PersonalPaymentController {
  constructor(private readonly actors:TicketActorService,private readonly payments:PersonalPaymentService) {}
  @Get() state(@Headers('authorization') authorization?:string,@Headers('x-organization-id') organizationId?:string){return this.actors.fromHeaders(authorization,organizationId).then(actor=>this.payments.ownerState(actor));}
  @Post('orders') create(@Body() body:{packageId?:string},@Headers('idempotency-key') key:string|undefined,@Headers('authorization') authorization?:string,@Headers('x-organization-id') organizationId?:string){return this.actors.fromHeaders(authorization,organizationId).then(actor=>this.payments.createOrder(actor,body.packageId,key));}
  @Post('orders/:id/cancel') cancel(@Param('id') id:string,@Headers('authorization') authorization?:string,@Headers('x-organization-id') organizationId?:string){return this.actors.fromHeaders(authorization,organizationId).then(actor=>this.payments.cancel(actor,id));}
  @Get('orders/:id/receipt') receipt(@Param('id') id:string,@Headers('authorization') authorization?:string,@Headers('x-organization-id') organizationId?:string){return this.actors.fromHeaders(authorization,organizationId).then(actor=>this.payments.receipt(actor,id));}
  @Get('callback') async callback(@Res() response:RedirectResponse,@Query('Authority') authority?:string,@Query('Status') status?:string){
    try {
      const result=await this.payments.callback(authority,status);
      const state=result.status==='PAID'?'paid':result.status==='CANCELLED'?'cancelled':'pending';
      response.redirect(302,personalPaymentWebReturnUrl(state,result.orderId));
    } catch {
      response.redirect(302,personalPaymentWebReturnUrl('failed'));
    }
  }
}

@Controller('platform/personal-payments')
export class PlatformPersonalPaymentController {
  constructor(private readonly auth:AuthService,private readonly payments:PersonalPaymentService) {}
  private async user(authorization?:string){const token=authorization?.replace(/^Bearer\s+/i,'');if(!token)throw new UnauthorizedException();return(await this.auth.verify(token)).sub;}
  @Get('settings') settings(@Headers('authorization') authorization?:string){return this.user(authorization).then(user=>this.payments.platformSettings(user));}
  @Post('settings') save(@Body() body:{availability?:string;mode?:string},@Headers('authorization') authorization?:string){return this.user(authorization).then(user=>this.payments.savePlatformSettings(user,body));}
  @Get('orders') orders(@Headers('authorization') authorization?:string){return this.user(authorization).then(user=>this.payments.platformOrders(user));}
  @Post('orders/:id/refunds') refund(@Param('id') id:string,@Body() body:{amountIrt?:number;externalReference?:string;reason?:string},@Headers('authorization') authorization?:string){return this.user(authorization).then(user=>this.payments.recordRefund(user,id,body));}
}
