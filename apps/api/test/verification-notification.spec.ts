import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import nodemailer from 'nodemailer';
import { SmtpVerificationNotificationDelivery } from '../src/organization-applications/verification-notification.service.js';

vi.mock('nodemailer', () => ({ default: { createTransport: vi.fn() } }));

const originalEnvironment = { ...process.env };

describe('SMTP public-account verification delivery', () => {
  beforeEach(() => {
    process.env = {
      ...originalEnvironment,
      NODE_ENV: 'production',
      WEB_ORIGIN: 'https://jupiter.arandi.io',
      PUBLIC_ACCOUNT_VERIFICATION_SMTP_HOST: '127.0.0.1',
      PUBLIC_ACCOUNT_VERIFICATION_SMTP_PORT: '25',
      PUBLIC_ACCOUNT_VERIFICATION_FROM_EMAIL: 'no-reply@jupiter.arandi.io',
      PUBLIC_ACCOUNT_VERIFICATION_FROM_NAME: 'Jupiter',
    };
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnvironment };
  });

  it('sends a Persian verification message through the configured SMTP boundary', async () => {
    const sendMail = vi.fn().mockResolvedValue({ accepted: ['person@example.com'], rejected: [] });
    vi.mocked(nodemailer.createTransport).mockReturnValue({ sendMail } as never);
    const delivery = new SmtpVerificationNotificationDelivery();

    await expect(delivery.deliver({
      email: 'person@example.com',
      token: 'safe-token-value',
      expiresAt: '2026-10-13T10:00:00.000Z',
    })).resolves.toEqual({ status: 'DELIVERED' });

    expect(nodemailer.createTransport).toHaveBeenCalledWith(expect.objectContaining({
      host: '127.0.0.1',
      port: 25,
      secure: false,
      disableFileAccess: true,
      disableUrlAccess: true,
    }));
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'person@example.com',
      subject: 'تأیید حساب ژوپیتر',
      text: expect.stringContaining('https://jupiter.arandi.io/?verify=safe-token-value'),
      html: expect.stringContaining('تأیید ایمیل'),
    }));
  });

  it('does not report delivery when SMTP rejects the recipient', async () => {
    const sendMail = vi.fn().mockResolvedValue({ accepted: [], rejected: ['person@example.com'] });
    vi.mocked(nodemailer.createTransport).mockReturnValue({ sendMail } as never);
    const delivery = new SmtpVerificationNotificationDelivery();
    await expect(delivery.deliver({
      email: 'person@example.com',
      token: 'safe-token-value',
      expiresAt: '2026-10-13T10:00:00.000Z',
    })).rejects.toThrow('did not accept');
  });
});
