import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';

export type TicketNotification = { type: string; ticketId: string; occurredAt: string };

@Injectable()
export class NotificationService {
  private readonly subscribers = new Map<string, Set<(event: TicketNotification) => void>>();

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

  publish(organizationId: string, recipientUserIds: string[], event: TicketNotification) {
    for (const userId of new Set(recipientUserIds)) {
      for (const listener of this.subscribers.get(`${organizationId}:${userId}`) ?? []) listener(event);
    }
  }
}
