import { Injectable, type CallHandler, type ExecutionContext, type NestInterceptor } from '@nestjs/common';
import { ObservabilityInterceptor } from '@observability/nestjs-adapter';
import { HubBindingService } from './hub-binding.service.js';
@Injectable()
export class HubInterceptor implements NestInterceptor {
 constructor(private readonly binding:HubBindingService){}
 intercept(context:ExecutionContext,next:CallHandler){const sdk=this.binding.instrumentation();if(!sdk)return next.handle();return new ObservabilityInterceptor(sdk,{resolve:request=>this.binding.requestContext(request as {headers:Record<string,string|undefined>})}).intercept(context,next);}
}
