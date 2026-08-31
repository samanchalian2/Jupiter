import { Injectable } from '@nestjs/common';
import { publicAccountVerificationUrl, publicAccountVerificationWebhookUrl } from '../config.js';

export const VERIFICATION_NOTIFICATION_DELIVERY = 'VerificationNotificationDelivery';

export type VerificationNotification = {
  email: string;
  token: string;
  expiresAt: string;
};

export type VerificationNotificationOutcome = {
  status: 'DELIVERED' | 'PENDING_CONFIGURATION';
};

export interface VerificationNotificationDelivery {
  deliver(notification: VerificationNotification): Promise<VerificationNotificationOutcome>;
}

@Injectable()
export class DeferredVerificationNotificationDelivery implements VerificationNotificationDelivery {
  async deliver(): Promise<VerificationNotificationOutcome> {
    // Production delivery is intentionally not guessed here. A later deployment
    // adapter consumes the persisted delivery record; this safe default never
    // logs, returns, or stores the raw verification token.
    return { status: 'PENDING_CONFIGURATION' };
  }
}

@Injectable()
export class LocalVerificationNotificationDelivery implements VerificationNotificationDelivery {
  private readonly deliveries = new Map<string, VerificationNotification>();
  async deliver(notification: VerificationNotification): Promise<VerificationNotificationOutcome> {
    this.deliveries.set(notification.email, { ...notification });
    return { status: 'DELIVERED' };
  }
  latest(email: string) {
    const notification = this.deliveries.get(email.trim().toLowerCase());
    return notification ? { email: notification.email, token: notification.token, expiresAt: notification.expiresAt } : null;
  }
}

@Injectable()
export class WebhookVerificationNotificationDelivery implements VerificationNotificationDelivery {
  async deliver(notification: VerificationNotification): Promise<VerificationNotificationOutcome> {
    const endpoint = publicAccountVerificationWebhookUrl();
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        type: 'jupiter.public_account_verification',
        recipient: notification.email,
        verificationUrl: publicAccountVerificationUrl(notification.token),
        expiresAt: notification.expiresAt,
      }),
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) throw new Error('Verification delivery webhook rejected the request.');
    return { status: 'DELIVERED' };
  }
}
