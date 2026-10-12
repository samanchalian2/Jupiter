import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { publicAccountVerificationSmtpConfig, publicAccountVerificationUrl, publicAccountVerificationWebhookUrl } from '../config.js';

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

@Injectable()
export class SmtpVerificationNotificationDelivery implements VerificationNotificationDelivery {
  async deliver(notification: VerificationNotification): Promise<VerificationNotificationOutcome> {
    const config = publicAccountVerificationSmtpConfig();
    const verificationUrl = publicAccountVerificationUrl(notification.token);
    const transport = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      ignoreTLS: config.ignoreTls,
      requireTLS: config.requireTls,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
      auth: config.user ? { user: config.user, pass: config.password } : undefined,
      disableFileAccess: true,
      disableUrlAccess: true,
    });
    const result = await transport.sendMail({
      from: { name: config.fromName, address: config.from },
      to: notification.email,
      subject: 'تأیید حساب ژوپیتر',
      text: [
        'برای فعال‌سازی حساب ژوپیتر، نشانی زیر را باز کنید:',
        verificationUrl,
        '',
        `این پیوند تا ${new Date(notification.expiresAt).toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' })} معتبر است.`,
        'اگر این حساب را شما نساخته‌اید، این پیام را نادیده بگیرید.',
      ].join('\n'),
      html: `<div dir="rtl" lang="fa" style="font-family:Tahoma,Arial,sans-serif;line-height:1.9;color:#241f2a"><h1 style="font-size:22px">تأیید حساب ژوپیتر</h1><p>برای فعال‌سازی حساب و فضای شخصی خود، دکمهٔ زیر را انتخاب کنید.</p><p><a href="${verificationUrl}" style="display:inline-block;background:#6d627d;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px">تأیید ایمیل</a></p><p style="font-size:13px;color:#625a6b">این پیوند تا ${new Date(notification.expiresAt).toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' })} معتبر است. اگر این حساب را شما نساخته‌اید، پیام را نادیده بگیرید.</p></div>`,
      headers: {
        'Auto-Submitted': 'auto-generated',
        'X-Auto-Response-Suppress': 'All',
      },
    });
    const accepted = (result.accepted ?? []).map(String).some((value) => value.toLowerCase() === notification.email.toLowerCase());
    if (!accepted) throw new Error('SMTP provider did not accept the verification recipient.');
    return { status: 'DELIVERED' };
  }
}
