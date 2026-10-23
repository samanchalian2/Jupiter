# Contract and SDK compatibility policy

This documents the existing private, unreleased GOAL-069 components; it does not
publish a package or change a deployed consumer. These versions are different:

| Surface | Current source of truth | Version |
| --- | --- | --- |
| JSON Event schema | contracts SCHEMA_VERSION / COMPATIBLE_SCHEMA_VERSIONS | emits1.1; accepts1.0 and1.1 |
| Public HTTP mount | host base path / OpenAPI servers | /api/v1/observability |
| OpenAPI document | server/src/openapi.ts info.version | 1.1.0 |
| Private SDK/core/adapters/server/Console | each package.json | 0.1.0 |

The Browser SDK currently reports sdkVersion0.1.0; package manifests identify
the Node SDK/adapters too. An Event's schemaVersion is not its SDK
package version. A host release/commit identifies its compiled integration;
releaseVersion is the observed consumer release, not the Hub or SDK version.

## Compatible evolution

The server validates both listed Event versions with the documented fields and
bounds; unsupported versions are rejected with UNSUPPORTED_SCHEMA, not accepted
as an arbitrary JSON body. Current/previous and unsupported-version cases execute
in contracts/test/contract.test.ts and actual HTTP/OpenAPI parity tests. Existing
identity, authorization, secret, size and ACK rules apply to both versions.

Optional response projections are additive; older consumers may ignore fields
they do not use. New callers must handle missing legacy Incident snapshot facts
as unknown, not zero. Strict REQUEST allowlists do not imply acceptance of future
unknown request fields. A new request field must first be specified, validated,
sanitized, documented and tested before a client sends it. New enum values need
an explicit compatibility review; they are not automatically harmless additions.

## Semantic versions and breaking changes

Use SemVer for private package releases: patch for compatible corrections, minor
for compatible capabilities, major for incompatible stable contracts. During0.x
development an incompatible SDK API requires at least a minor version bump,
explicit migration notes and consumer rebuild/testing; do not disguise it as a
patch. Published compatibility is stricter than the0.x label: no silent break of
the current Event1.x or /api/v1 ingestion/ACK/authentication contract is allowed.

A breaking wire change requires an ADR, an explicit new schema/API version,
defined overlap/deprecation and consumer migration tests. Do not retire the
currently supported previous version without that decision. No new version,
deprecation deadline or package publication is introduced by this document.

## Data and deployment migration

Use the existing forward-only migration runner; never roll back a shared schema
by deleting data. Rehearse the full chain and preservation of legacy rows, then
build packages topologically before API/Web consumers. Code that needs a new
column must not start before its migration is applied to the authorized target.
The current local chain has84 files through073; this is a checkpoint, not a
replacement for reading the actual migration ledger on a future release.

Release QC must execute API/Web/package tests, explicit optional Browser and
external-client scenarios, typechecks/builds, migration/RLS/compatibility tests
and the current published Help projections. A green test with an optional branch
disabled is not evidence that the branch executed. Record flags, exact commit,
actual exit/result and limitations; do not double-count a focused rerun. Local
acceptance never authorizes or proves preview/production deployment or GOAL-059.
