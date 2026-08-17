import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';

@Injectable()
export class EmailIngressService {
  constructor(private readonly database: DatabaseService) {}

  async receive(secret: string | undefined, input: { to?: string; from?: string; subject?: string; text?: string }) {
    if (!process.env.EMAIL_INGEST_SECRET || secret !== process.env.EMAIL_INGEST_SECRET) throw new ForbiddenException();
    const to = input.to?.trim().toLowerCase(); const from = input.from?.trim().toLowerCase(); const subject = input.subject?.trim(); const text = input.text?.trim();
    if (!to || !from || !subject || !text || subject.length < 3 || subject.length > 200 || text.length > 10_000) throw new BadRequestException('Email payload is invalid');
    const integration = (await this.database.query<{ organization_id: string }>('SELECT organization_id FROM email_integration_settings WHERE inbound_address=$1 AND enabled=true', [to])).rows[0];
    if (!integration) throw new NotFoundException('Inbound address is not configured');
    return this.database.withOrganization(integration.organization_id, async client => {
      const requester = (await client.query<{ user_id: string }>('SELECT user_id FROM memberships m JOIN users u ON u.id=m.user_id WHERE m.organization_id=$1 AND m.status=\'active\' AND u.is_active=true AND u.email=$2', [integration.organization_id, from])).rows[0];
      if (!requester) throw new ForbiddenException('Sender is not an active organization member');
      const ticket = (await client.query<{ id:string;ticket_number:number;status:string }>('INSERT INTO tickets(organization_id,requester_user_id,title,description,status) VALUES($1,$2,$3,$4,\'OPEN\') RETURNING id,ticket_number,status',[integration.organization_id,requester.user_id,subject,text])).rows[0];
      await client.query('INSERT INTO ticket_status_transitions(organization_id,ticket_id,from_status,to_status,changed_by_user_id,reason) VALUES($1,$2,\'DRAFT\',\'OPEN\',$3,\'email ingress\')',[integration.organization_id,ticket.id,requester.user_id]);
      await client.query('INSERT INTO ticket_activities(organization_id,ticket_id,actor_user_id,activity_type,visibility,metadata) VALUES($1,$2,$3,\'ticket.email_received\',\'REQUESTER\',$4)',[integration.organization_id,ticket.id,requester.user_id,{from,to}]);
      await client.query('INSERT INTO audit_logs(organization_id,actor_user_id,action,target_type,target_id,metadata) VALUES($1,$2,\'email.ticket_received\',\'ticket\',$3,$4)',[integration.organization_id,requester.user_id,ticket.id,{from,to}]);
      return ticket;
    });
  }
}
