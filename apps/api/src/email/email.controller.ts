import { Body, Controller, Headers, Post } from '@nestjs/common';
import { EmailIngressService } from './email-ingress.service.js';

@Controller('email')
export class EmailController {
  constructor(private readonly ingress: EmailIngressService) {}
  @Post('inbound') receive(@Headers('x-jupiter-email-secret') secret: string | undefined,@Body() body:{to?:string;from?:string;subject?:string;text?:string}) { return this.ingress.receive(secret,body); }
}
