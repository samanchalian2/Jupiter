# GOAL-015 — Smart ticket composer acceptance evidence

Date: 2026-08-19

## Delivered behavior

- The description is the first, full-width, initially focused form control.
- A dedicated toolbar directly below it exposes `تکمیل هوشمند` and `ضبط صدا`.
- Text and voice share the tenant-owned `ticket_intake_session` lifecycle; the
  final ticket is still created only by the explicit submit button.
- MediaRecorder chooses WebM, OGG or MP4, displays a permission/recording state,
  counts to `01:00`, stops automatically, and exposes playback, delete and
  re-record controls. Upload uses every signed required header returned by the
  API.
- Accepted suggestions overwrite only their target fields, receive an AI badge,
  remain manually editable, and lose that badge after a manual edit. Rejected or
  low-confidence fields stay unchanged and appear in Persian guidance.
- Category, subcategory, department, location, discipline, priority, active
  custom fields and the ordinary attachment remain available under details.
- A provider delay or failure never clears form values. Text-only manual submit
  remains enabled while AI is processing; a recorded voice waits for its secure
  intake handoff so the attachment cannot be silently lost.

## Automated verification

`pnpm verify:release` passed:

- API: 21 test files / 41 tests.
- Web: 2 test files / 9 tests.
- API and Web lint/typecheck.
- API compilation and Web production build.

Web tests cover accepted suggestion application, typed-description retention,
transcript append, polling, organization-AI fallback text, low-risk manual
submission during processing, permission denial, exact one-minute auto-stop and
creation of a non-empty playable recording blob. Existing API integration tests
cover voice metadata, tenant/owner isolation, transcription ordering,
confidence/taxonomy rejection, retry, manual fallback, atomic attachment
conversion and expiry cleanup.

## Authenticated browser acceptance

The local API, Web and Worker were started together. A dedicated REQUESTER test
member was used against the Jupiter Demo Organization.

| Check | Evidence |
| --- | --- |
| Initial focus and order | DOM reported description active and form child order `description=0`, `toolbar=1`. |
| 375 px | No document overflow; description and toolbar 297 px; AI/voice buttons stacked and both 270 px. |
| 768 px | No document overflow; description and toolbar 676 px; toolbar buttons side by side. |
| 1440 px | No document overflow; description and toolbar 1056 px; toolbar buttons side by side. |
| Successful AI | Deterministic loopback provider produced a title and HIGH priority; valid values were directly applied and badged. |
| Low confidence | An invalid location at confidence `0.42` stayed empty and rendered `برای اطمینان بیشتر ... مکان`. |
| Manual edit | Editing the AI title immediately removed only its AI badge. |
| Provider/manual fallback | Original description remained intact; text-only submit stays available while analysis is pending. |
| Microphone permission | Browser displayed the permission-waiting state without disabling the description or manual submit. |

Screenshots:

- `docs/evidence/goal-015-375.png`
- `docs/evidence/goal-015-1440.png`

The loopback provider was stopped and organization settings were restored to
the original OpenAI-compatible URL and model names after acceptance. The real
provider still needs billing activation for live inference.
