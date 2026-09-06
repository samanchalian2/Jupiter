# GOAL-057 — Appearance Theme Migration & Custom Primary Validation

## Existing Appearance Inventory and Gap Analysis

Before this Goal, `PlatformAppearanceSettings` held only a global brand preset,
density, radius and managed logo path. `OrganizationSettings` held only a
tenant logo. The runtime palette was duplicated between CSS and the platform
token helper, used Jupiter purple `#6D5587`, and exposed no stored/effective
primary distinction, organization inheritance or hex validator.

## Canonical primary and token migration

The built-in Light Theme primary is now `#315399`. Its deterministic family is
`#2A4782` hover, `#233C6E` active, `#EFF1F7` subtle and `#C5CFE2` border.
The primary foreground is deterministically white or the approved dark
foreground (`#172033`) according to WCAG contrast. Legacy purple fallbacks in active CSS/runtime theme
paths were migrated to the central tokens. Success, warning, danger and info
tokens were retained independently.

## Persistence, precedence and reset

Migration `056_appearance_custom_primary.sql` adds nullable, uppercase-hex
primary overrides to the global Platform record and tenant-RLS
`OrganizationSettings`. Effective precedence is System → Platform →
Organization; inherited values are never copied into tenant storage. Platform
reset restores preset `JUPITER` and no custom primary while preserving density,
radius and logo. Organization reset clears only its override and resumes
inheritance.

## Validator, contrast and security

The server canonicalizes only `#RRGGBB` values to uppercase. It rejects CSS,
HTML and malformed input. Button foreground is selected deterministically:
white when it has 4.5:1 contrast, otherwise the approved dark foreground when
it has 4.5:1; colors for which neither is safe are rejected. The separately
derived primary-text token ensures interactive text on light surfaces remains
at least 4.5:1 without changing the persisted primary. No raw CSS, URL,
variable, gradient or script is stored, returned or audited.

## Authorization and isolation

Platform writes require an active Platform Admin. Organization writes reuse the
existing Organization operator policy (`ORG_ADMIN` or `ORG_OWNER`) and execute
inside the tenant RLS context. Tenant projections require an active
membership. Integration tests prove denied requester access, organization
override isolation, Platform propagation to inherited organizations and reset
behavior.

## Runtime Help and authenticated browser acceptance

The runtime `platform-appearance` article was revised and published with the
new primary, format, preview, contrast, inheritance, reset and semantic-color
rules. It was opened through the compact «راهنمای ظاهر» trigger in the
authenticated Platform Appearance console and rendered as readable Persian RTL
content without exposing any unrelated Help content.

On the local authenticated browser surface, Platform Admin validation rejected
`red` before submission; `#FFFFE0` was persisted successfully through the
dark-foreground path; and Platform reset restored `#315399` with the System
source. In the Organization Administration appearance panel, `#18A05E` became
an Organization override and the reset button cleared it so the organization
again inherited the System primary. The retained Platform and organization
state after this check is `JUPITER` with no Platform custom primary and no
organization override. The responsive sweep used a generated, temporary local
Platform Admin / `ORG_ADMIN` membership with a random one-time password. It
logged in through the normal endpoint and every temporary user, membership,
refresh session and Chrome profile was removed after the run; no secret was
written to the repository, evidence or audit metadata.

An authenticated headless-browser sweep then verified Platform Appearance and
Organization Appearance at **375, 768, 1024 and 1440 px**. At every width the
RTL controls, primary preview and actual tenant routes rendered without
document-level horizontal overflow. At 375 px, the compact Appearance Help
trigger opened the published `platform-appearance` article successfully.

## Quality gates

- Migration rehearsal: `pnpm --filter @jupiter/api migrate` passed; migration
  056 is already applied locally and an immediate rerun was idempotent.
- API tests: 27 files / 116 tests passed.
- Web tests: 3 files / 13 tests passed.
- API and Web typechecks passed.
- API and Web production builds passed. Vite reported only its existing
  advisory about a JavaScript chunk above 500 kB.
- `git diff --check` passed after the final stylesheet cleanup.

## Known limitations

Only the existing Light Theme is in scope. There is no arbitrary CSS editor,
font/spacing editor, Dark Mode, logo processing, palette generator or
white-label domain system.
