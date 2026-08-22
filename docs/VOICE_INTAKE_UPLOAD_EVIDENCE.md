# Voice Intake Upload Recovery Evidence

**Date:** 2026-08-22  
**Scope:** recorded-voice upload in the smart ticket composer.

## Finding

Browser recording itself completed successfully, but the object store rejected
the subsequent presigned PUT for `audio/webm`. The ticket-intake session stayed
in `UPLOADING`, so the UI correctly retained the manual form but could only
show the generic smart-completion failure state.

The PUT included the required `x-amz-meta-duration-seconds` header. The S3
presigner had placed the metadata in the query string rather than requiring
that header to be signed. MinIO rejects that duplicated unsigned header.

## Repair

`S3AttachmentStorageService.createUploadUrl` now keeps every supplied
`x-amz-meta-*` header in the signed headers set. The ticket-intake endpoint can
therefore require duration metadata and the browser can submit the identical
header without an S3 signature error. Uploads without metadata, including
organization-logo uploads, retain their existing behavior.

## Verification

- A WebM-style presigned PUT carrying `Content-Type: audio/webm` and
  `x-amz-meta-duration-seconds` returned success.
- S3 HEAD returned the expected media type, byte count and duration metadata;
  the isolated probe object was then deleted.
- The stored organization configuration successfully transcribed a synthetic
  one-second silent WAV sample. No user audio or ticket content was sent.
- API typecheck, all 51 API tests, Web typecheck and production Web build pass.

The API was rebuilt and restarted after the fix. A newly recorded voice can now
be uploaded, verified and passed into the normal transcription/analysis worker.

## Provider media compatibility repair (2026-08-22)

After upload recovery, a real browser-recorded WebM/Opus object completed
metadata verification but the configured provider rejected it at the
transcription stage with its safe `invalid_request` category. The same saved
organization configuration successfully transcribed a synthetic WAV sample,
so storage, credentials and the worker were not the cause. The application now
converts the local recording to a compact 16 kHz mono PCM WAV before any upload.
This preserves the one-minute/10 MB limits and uses an already supported voice
media type. The recorded user object was inspected only for safe headers and
was not replayed to a third party for diagnosis.

## Full synthetic voice-path verification (2026-08-22)

The complete local intake path was then exercised with a generated one-second
16 kHz mono WAV and a non-personal description: temporary session creation,
presigned upload, S3 metadata verification, worker transcription, structured
analysis and suggestion validation all reached `SUCCEEDED`. The temporary
voice object was discarded after the test. This confirms the configured
provider accepts the same WAV media type now produced by the composer.

The generic per-IP request limiter also shared its budget with the 90-second
intake-status polling loop. Status polling now has its own bounded allowance
(default 240/minute), and authenticated callers are keyed by a one-way token
hash instead of sharing an IP bucket. Anonymous and login abuse protection
remain rate-limited.
