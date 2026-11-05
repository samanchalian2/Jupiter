# Authorized main registration/password publication

Owner explicitly requested all pending relevant registration changes on main.
Scoped release includes password minimum8, empty-username email-only warning,
success login identifier and required member/admin fields/role guidance. Prior
organization-approval and membership RLS repairs retained. User-owned AI gateway
and training changes excluded. No full GOAL070 promotion or migration.

Main fe64140 compiled auth/organization/application modules downloaded fresh and
mechanically patched only password lengths/messages. Web built from detached
fe64140+previous scoped UI repairs and these registration changes, not current
unapproved full source. TypeScript/Vite build PASS. Existing-password hashes,
roles, organization lifecycle and customer data untouched; no password reset.

Pre-release gates: full isolated API201 passed/2 optional skipped; Web71 passed;
85 migrations rehearsal, disposable DB cleanup and shared role snapshot PASS;
typecheck/build/diffcheck pass. Actual deployed public password validator:8/9/200
accepted;7/201 denied, zero writes. This narrow runtime test is not a new full
registration/login browser test. Work Browser previously disabled; no visual
acceptance claimed.

Main readiness200 and public JS200. JS index-DS_Ompk2.js SHA256
192857540bebe5bae0a71ea2e8dc1f4be201960100ba28716ac09b4acaa93def matches local.
Jupiter API restarted only; Arandi active/NRestarts0. Disk2.9GiB free; no cleanup.
Rollback archive /srv/jupiter/registration-before-20261105.tar.gz contains previous
three modules and index; old hashed assets retained. Temporary transfer/test
files removed. Secrets never included in evidence or repository.
