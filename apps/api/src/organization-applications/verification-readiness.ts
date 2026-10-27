import { publicAccountVerificationDeliveryMode, publicAccountVerificationSmtpConfig, publicAccountVerificationUrl, publicAccountVerificationWebhookUrl } from '../config.js';

/** Configuration validation only: never a transport probe or inbox-delivery claim. */
export function verificationDeliveryReadiness() {
  try {
    const mode = publicAccountVerificationDeliveryMode();
    if (mode === 'DISABLED') return { configured: false, reasonCode: 'DELIVERY_DISABLED' as const, transportVerified: false };
    publicAccountVerificationUrl('configuration-check');
    if (mode === 'SMTP') publicAccountVerificationSmtpConfig();
    if (mode === 'WEBHOOK') publicAccountVerificationWebhookUrl();
    return { configured: true, reasonCode: mode === 'LOCAL_TEST' ? 'LOCAL_TEST_ONLY' as const : 'CONFIGURATION_VALID' as const, transportVerified: false };
  } catch {
    // Never expose environment values, provider addresses or exception text.
    return { configured: false, reasonCode: 'DELIVERY_CONFIGURATION_INVALID' as const, transportVerified: false };
  }
}
