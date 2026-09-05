/**
 * Canonical Product Help metadata.  This deliberately stays small: Help is
 * global platform content, but article metadata must not silently point to a
 * feature or route that the product no longer exposes.
 */
export const HELP_CONTEXT_FEATURES = [
  'ACCOUNT_HELP_CENTER',
  'TICKET_LIFECYCLE',
  'AI_TICKET_REVIEW',
  'ORGANIZATION_MEMBERSHIP',
  'TICKET_CONFIGURATION',
  'SLA_ADMINISTRATION',
  'DIRECTORY_CONNECTOR',
  'COMMERCIAL_DASHBOARD',
  'JUPITER_ASSIST',
  'ORGANIZATION_SETUP_WIZARD',
  'NOTIFICATION_CENTER',
  'PLATFORM_ORGANIZATION_APPLICATIONS',
  'PLATFORM_COMMERCIAL',
  'PLATFORM_HELP_AUTHORING',
  'PLATFORM_APPEARANCE',
] as const;

export type HelpContextFeature = (typeof HELP_CONTEXT_FEATURES)[number];

export const HELP_RELATED_ROUTES = [
  '/', '/help', '/tickets', '/tickets/new',
  '/admin/members', '/admin/catalog', '/admin/teams', '/admin/automation',
  '/admin/directory', '/admin/settings', '/admin/commercial', '/admin/setup-wizard',
  '/platform', '/platform/applications', '/platform/commercial', '/platform/appearance', '/platform/help',
] as const;

export function isHelpContextFeature(value: string) : value is HelpContextFeature {
  return (HELP_CONTEXT_FEATURES as readonly string[]).includes(value);
}

export function isHelpRelatedRoute(value: string) {
  return (HELP_RELATED_ROUTES as readonly string[]).includes(value);
}
