# Jupiter operator runbook

## Before a release

1. Run `pnpm verify:release` from a clean checkout.
2. Build immutable API and web images from the tagged commit. Supply all
   secrets through the deployment platform; never put them in an image, log,
   browser fixture, or repository.
3. Apply migrations once, using the release image and a least-privilege
   migration identity. Migrations must be forward-only and recorded in
   `schema_migrations`.
4. Verify `/api/v1/health` and `/api/v1/health/ready` through the staging
   ingress. The latter must return HTTP 200 with `status: ready`.
5. Run `pnpm load:smoke` against the staging API and complete the checklist in
   `STAGING_RELEASE_CHECKLIST.md`.

## Master Upgrade control-plane checks

Before enabling the public onboarding, connector, commercial AI, Assist,
appearance or Product Help capabilities in a release, complete the matching
staging checklist evidence. Do not infer authority from a user-supplied route:
the server resolves platform authority and organization membership for every
request.

For directory synchronization, deploy only the approved Windows service
candidate with outbound HTTPS. Pair from the organization administration
workspace, record its revocable device identity, and never copy an Active
Directory password into cloud configuration, logs, tickets or support notes.

For AI/commercial incidents, distinguish provider activity from customer
settlement. A retry, connection test, diagnostic or infrastructure call is not
billable. Investigate a consumption discrepancy using the immutable usage
ledger and delivery/confirmation audit events; do not repair it by editing a
ledger record.

For Jupiter Assist, confirm the case scope, time-bound support grant and
restricted-ticket rule before an agent opens organization data. Capacity is
settled only when a permitted agent accepts the Assist case.

Product Help exports contain only currently published, audience-authorized
content. Generate them from Platform Admin and retain the audit reference;
never use a database dump or an unpublished revision as a support export.

## Public-account verification delivery

Production must explicitly select `PUBLIC_ACCOUNT_VERIFICATION_DELIVERY=webhook`
and configure an HTTPS `PUBLIC_ACCOUNT_VERIFICATION_WEBHOOK_URL` owned by the
approved mail-delivery integration. The adapter sends the verification URL and
expiry; it must never log or persist the raw verification token. Set
`PUBLIC_ACCOUNT_VERIFICATION_WEB_URL` to the public web origin used in the
message.

If a delivery integration is not ready, use `DISABLED`. This safely reports
pending configuration and blocks application submission until verification; do
not substitute a debug inbox, console log or manual token sharing in production.
`LOCAL_TEST` and its retrieval endpoint are development-only and must not be
enabled in production.

## Monitoring and incidents

Every API response carries `X-Request-Id`; request logs are structured JSON
with that ID, method, path, status code and duration. Search that ID across edge and API
logs when investigating a request. Do not add tokens, passwords, attachment
contents, redacted AI input, or transcript content to incident notes.

Alert when readiness fails, HTTP 5xx grows unexpectedly, rate-limit responses
grow unexpectedly, or request latency
changes materially from the deployment baseline. Treat tenant-isolation,
authorization, attachment-access, and AI data disclosure reports as security
incidents: preserve request IDs, restrict access, and rotate affected secrets
through the secret manager where applicable.

## Rollback

Only roll back an application image after verifying that migrations are
backward-compatible. Never delete migration records or production data as a
rollback step. If a data repair is necessary, create and review a forward
migration. After rollback, check readiness and execute a small authenticated
ticket flow in staging.

## Backup and restore

Use the dated steps in `RESTORE_DRILL.md`. A production backup must be
encrypted, access-controlled, and stored outside the application host. Record
the restore duration, result, schema version and two-tenant RLS check.
