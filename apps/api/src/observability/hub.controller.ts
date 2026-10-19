import { All, Body, Controller, Get, Headers, Post, Req, Res } from '@nestjs/common';
import { ContractError } from '@observability/contracts';
import { HubBindingService } from './hub-binding.service.js';
interface Request {method:string;originalUrl:string;headers:Record<string,string|undefined>;ip?:string;}
interface Response {status(code:number):Response;setHeader(name:string,value:string):void;json(value:unknown):void;send(value:unknown):void;end():void;}
@Controller('observability')
export class HubController {
 constructor(private readonly binding:HubBindingService){}
 @Get('jupiter/config')config(){return this.binding.publicConfiguration();}
 @Post('jupiter/browser-credential')async credential(@Headers('authorization')authorization:string|undefined,@Headers('x-organization-id')organizationId:string|undefined,@Res()response:Response){try{response.status(201).json(await this.binding.browserCredential(authorization,organizationId));}catch(error){const code=error instanceof ContractError?error.reasonCode:'HUB_UNAVAILABLE';response.status(code==='AUTHENTICATION_REQUIRED'?401:code==='TENANT_ACCESS_DENIED'?403:503).json({reasonCode:code});}}
 @All('*path')async handle(@Req()request:Request,@Body()body:unknown,@Res()response:Response){const index=request.originalUrl.indexOf('/observability');const result=await this.binding.dispatch({method:request.method,path:request.originalUrl.slice(index+'/observability'.length),expectedApplicationId:request.headers['x-observability-application-id'],expectedEnvironmentId:request.headers['x-observability-environment-id'],authorization:request.headers.authorization,origin:request.headers.origin,body,clientKey:request.ip??'unknown'});for(const[name,value]of Object.entries(result.headers??{}))response.setHeader(name,value);response.status(result.status);if(result.status===204)response.end();else if(result.headers?.['Content-Type']?.startsWith('text/csv'))response.send(result.body);else response.json(result.body);}
}
