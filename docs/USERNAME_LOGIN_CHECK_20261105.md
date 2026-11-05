# Username login check — 2026-11-05

Owner-reported member could not log in using their display name. Read-only
tenant-scoped inspection initially found a null username with that display name.
A guarded repair attempt was rejected before mutation because the username had
meanwhile been assigned by another operation. Follow-up readback confirmed a
nonempty, different login username. Concurrent user edits were preserved; no
password, role or account changes were performed by this investigation.

Deployed login already trims/lowercases the supplied identifier before querying
normalized stored usernames/email. Regression parameterization now covers lower,
upper and mixed-case input; five auth-identifier tests PASS. No password provided
for the affected member: full password login cannot be claimed or guessed. Login
requires the actual username or email, not the display name. Temporary server
diagnostic scripts removed; no credentials stored in this report.
