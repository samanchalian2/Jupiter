# Next Task

## GOAL-006 — Secure attachments and media

**Status:** READY

Implement the S3-compatible storage adapter, attachment metadata, signed
upload/download URLs, media validation, and limits. Do not implement AI,
voice transcription, or role portals.

Preserve tenant isolation and enforce authorization, allowlisted media types,
size limits, and short-lived access URLs. Never expose storage credentials to
clients or commit them.
