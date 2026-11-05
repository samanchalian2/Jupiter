# Password minimum8

Owner approved8-character minimum. API: public accounts, members/platform users,
CSV, resets, profile and first-password change. Web: matching forms/disabled save
controls including account settings. Maximum bounds retained; no password reset,
hashing/session/authentication change, migration or tenant data mutation.
DEC-068 records security policy change. Boundary unit2 pass (7 rejected,8/9
accepted at length gate,201 rejected); Web64 pass. API/Web typecheck and builds
checked in handoff. No runtime deployment claimed: main currently remains10
until scoped runtime artifact release. GitHub push unavailable previously.

Final full isolated API gate:47 files,201 passed,2 optional skipped;85 migrations
rehearsed; temporary database removed and shared roles unchanged. No live deployment.
