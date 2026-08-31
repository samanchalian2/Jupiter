# GOAL-035 Evidence — Manual and CSV user provisioning

Date: 2026-08-30

## Delivered

- Migration `036_csv_user_provisioning.sql` adds the tenant-RLS-protected
  `organization_user_imports` ledger. It stores an import key, a non-secret
  payload hash and the row-level result, with one key per organization.
- `ORG_OWNER` can use the existing organization member controls alongside
  `ORG_ADMIN`; legacy administrator authority is unchanged.
- `POST /admin/members/import/preview` dry-runs up to 500 rows and returns
  explicit row-level errors. `POST /admin/members/import/confirm` is atomic,
  idempotent per tenant/key and returns created/updated row outcomes.
- The Persian RTL members workspace accepts a CSV file, validates it before
  confirmation, shows a compact result table, parses quoted CSV values and
  retains its import key for a safe retry after an uncertain request.

## Security and tenant isolation

- Passwords are required only for the transient creation request; preview,
  confirmed results, hashes and audit metadata do not expose or retain them.
- A repeated key with altered non-secret content is rejected. Internal retry,
  later processing and another tenant cannot use the original tenant's result.
- Directory principals, Active Directory credentials, pairing and connector
  synchronization are not part of this Goal.

## Validation

- Migration 036 applied locally.
- API suite: 24 files / 63 tests passed. New integration coverage proves
  `ORG_OWNER` provisioning, password-free preview, idempotent confirmation,
  invalid-row rejection and tenant isolation.
- Root API/Web typecheck, 63 API tests, 11 Web tests and both production builds
  passed; `git diff --check` passed.
- Authenticated browser acceptance confirmed the member and CSV controls at
  375, 768, 1024 and 1440px with no document-level horizontal overflow.

## Persian Help impact

The product explains the required CSV columns, `|`-separated roles, preview
before confirmation and row-level error correction in Persian. Runtime Product
Help remains deferred to GOAL-046.

## Deferred scope

GOAL-036 owns the connector control plane. Windows service installation,
directory sync and importing directory accounts remain deferred to GOAL-037.
