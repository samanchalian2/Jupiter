import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { publicAccountVerificationDeliveryMode } from '../config.js';
import { OrganizationApplicationController, PlatformOrganizationApplicationController, PublicAccountController } from './organization-application.controller.js';
import { OrganizationApplicationService } from './organization-application.service.js';
import { DeferredVerificationNotificationDelivery, LocalVerificationNotificationDelivery, VERIFICATION_NOTIFICATION_DELIVERY, WebhookVerificationNotificationDelivery } from './verification-notification.service.js';

@Module({
  imports: [AuthModule],
  controllers: [PublicAccountController, OrganizationApplicationController, PlatformOrganizationApplicationController],
  providers: [
    OrganizationApplicationService,
    DeferredVerificationNotificationDelivery,
    LocalVerificationNotificationDelivery,
    WebhookVerificationNotificationDelivery,
    {
      provide: VERIFICATION_NOTIFICATION_DELIVERY,
      useFactory: (local: LocalVerificationNotificationDelivery, webhook: WebhookVerificationNotificationDelivery, deferred: DeferredVerificationNotificationDelivery) => {
        const mode = publicAccountVerificationDeliveryMode();
        return mode === 'LOCAL_TEST' ? local : mode === 'WEBHOOK' ? webhook : deferred;
      },
      inject: [LocalVerificationNotificationDelivery, WebhookVerificationNotificationDelivery, DeferredVerificationNotificationDelivery],
    },
  ],
  exports: [OrganizationApplicationService],
})
export class OrganizationApplicationModule {}
