import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { publicAccountVerificationDeliveryMode } from '../config.js';
import { OrganizationApplicationController, PlatformOrganizationApplicationController, PublicAccountController } from './organization-application.controller.js';
import { OrganizationApplicationService } from './organization-application.service.js';
import { DeferredVerificationNotificationDelivery, LocalVerificationNotificationDelivery, SmtpVerificationNotificationDelivery, VERIFICATION_NOTIFICATION_DELIVERY, WebhookVerificationNotificationDelivery } from './verification-notification.service.js';
import { PersonalWorkspaceModule } from '../personal-workspaces/personal-workspace.module.js';

@Module({
  imports: [AuthModule, PersonalWorkspaceModule],
  controllers: [PublicAccountController, OrganizationApplicationController, PlatformOrganizationApplicationController],
  providers: [
    OrganizationApplicationService,
    DeferredVerificationNotificationDelivery,
    LocalVerificationNotificationDelivery,
    WebhookVerificationNotificationDelivery,
    SmtpVerificationNotificationDelivery,
    {
      provide: VERIFICATION_NOTIFICATION_DELIVERY,
      useFactory: (local: LocalVerificationNotificationDelivery, webhook: WebhookVerificationNotificationDelivery, smtp: SmtpVerificationNotificationDelivery, deferred: DeferredVerificationNotificationDelivery) => {
        const mode = publicAccountVerificationDeliveryMode();
        return mode === 'LOCAL_TEST' ? local : mode === 'WEBHOOK' ? webhook : mode === 'SMTP' ? smtp : deferred;
      },
      inject: [LocalVerificationNotificationDelivery, WebhookVerificationNotificationDelivery, SmtpVerificationNotificationDelivery, DeferredVerificationNotificationDelivery],
    },
  ],
  exports: [OrganizationApplicationService],
})
export class OrganizationApplicationModule {}
