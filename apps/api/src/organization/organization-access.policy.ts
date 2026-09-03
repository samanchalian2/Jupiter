import { ForbiddenException, Injectable } from '@nestjs/common';

type Actor = { roles:string[] };

@Injectable()
export class OrganizationAccessPolicy {
  operator(actor:Actor) {
    if (!actor.roles.some(role=>role==='ORG_ADMIN'||role==='ORG_OWNER')) throw new ForbiddenException('مدیر یا مالک سازمان لازم است.');
  }
  owner(actor:Actor) {
    if (!actor.roles.includes('ORG_OWNER')) throw new ForbiddenException('مالک سازمان لازم است.');
  }
}
