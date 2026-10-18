import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { DatabaseService } from '../database/database.service.js';

export type TicketNotification = { type: string; ticketId?: string; occurredAt: string };
export type OperationalNotification = { id:string; type:'observability.alert'; title:string; href:'/operations#alerts'; occurredAt:string; read:boolean };

@Injectable()
export class NotificationService {
  private readonly subscribers = new Map<string, Set<(event: TicketNotification) => void>>();
  // Durable storage/authorization belongs to the source. Do not copy operational
  // alerts into tenant ticket notifications or retain account data in this port.
  private readonly operationalSources = new Map<string,(verifiedUserId:string)=>Promise<OperationalNotification[]>>();

  constructor(private readonly database?: DatabaseService) {}

  registerOperationalSource(key:string,source:(verifiedUserId:string)=>Promise<OperationalNotification[]>) {
    if(this.operationalSources.has(key))throw new Error('NOTIFICATION_SOURCE_ALREADY_REGISTERED');
    this.operationalSources.set(key,source);
    return ()=>{if(this.operationalSources.get(key)===source)this.operationalSources.delete(key);};
  }
  async operationalInbox(verifiedUserId:string) {
    const rows=await Promise.all([...this.operationalSources.values()].map(source=>source(verifiedUserId)));
    return rows.flat().sort((a,b)=>Date.parse(b.occurredAt)-Date.parse(a.occurredAt)).slice(0,100);
  }

  stream(organizationId: string, userId: string): Observable<{ data: TicketNotification }> {
    const key = `${organizationId}:${userId}`;
    return new Observable((subscriber) => {
      const listener = (event: TicketNotification) => subscriber.next({ data: event });
      const listeners = this.subscribers.get(key) ?? new Set();
      listeners.add(listener);
      this.subscribers.set(key, listeners);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) this.subscribers.delete(key);
      };
    });
  }

  async inbox(organizationId:string,userId:string) { if(!this.database) return []; return this.database.withOrganization(organizationId,async client=>(await client.query('SELECT id,event_type,ticket_id,occurred_at,read_at FROM user_notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100',[userId])).rows); }
  async markRead(organizationId:string,userId:string,id:string) { if(!this.database) return undefined; return this.database.withOrganization(organizationId,async client=>(await client.query('UPDATE user_notifications SET read_at=now() WHERE id=$1 AND user_id=$2 RETURNING id,read_at',[id,userId])).rows[0]); }
  async publish(organizationId: string, recipientUserIds: string[], event: TicketNotification) {
    for (const userId of new Set(recipientUserIds)) {
      if(this.database) await this.database.withOrganization(organizationId, async client => { await client.query('INSERT INTO user_notifications(organization_id,user_id,event_type,ticket_id,occurred_at) VALUES($1,$2,$3,$4,$5)',[organizationId,userId,event.type,event.ticketId,event.occurredAt]); });
      for (const listener of this.subscribers.get(`${organizationId}:${userId}`) ?? []) listener(event);
    }
  }
}
