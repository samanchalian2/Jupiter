# Unified completed-feature main release

Owner authorized all completed features and default future publication except
explicit individual holds. This supersedes prior070 Preview-only release scope.
Current tracked product source655 files packaged; dirty gateway/training paths
exported from HEAD, secrets/output/tmp excluded. Source archiveSHA256
670020dd3609297a9c6e184f00fbd9cb0efaab517fa84b1fca0fd17590bde489.
Linux build on Preview isolated unified-20261105 PASS TypeScript/API/Vite;
existing fe64140 dependency trees reused. Compiled runtime archiveSHA256
7cf738fea9f8b9db61643309c7ee9af584fd092ed9700d9b56f00fd21037b73f
matches across Preview/main. Existing Preview running candidate not switched.

Main Jupiter-only backup /srv/jupiter/backups/unified-20261105-before.dump
restored in jupiter_unified_20261105_rehearsal; migration074/85 total PASS;
legacy flagsfalse/version0 preserved; rehearsal DB dropped. Initial rehearsal
guard ran before candidate copy finished and safely stopped, then rerun passed.
Main migration applied with lock/statement bounds; API+worker stopped only during
atomic symlink switch to /srv/jupiter/releases/unified-20261105. Health retry
initial connection-refused recovered normally; final readiness/page200, all3
Jupiter/Arandi services active. Arandi start/restart snapshot unchanged.

Full completed070 features now main: global application entry/history, honest
email readiness, atomic SETUP+owner, SLA V2, scoped search, Wizard counters/Owner
translation, tickets/new and first-password flow, plus subsequent approved RLS/
username/registration/password8 repairs. No arbitrary organization activation or
role elevation. Existing users not retroactively forced to reset passwords.

Authenticated actual account API checks: login201/four memberships, setup200,
members200, SLA calendar/policies200. An initial /admin/sla/calendar404 was wrong
test URL, corrected to /sla/calendar. Test sessions revoked. API-only validation;
no Browser visual claim (Work Browser disabled). Prior local regression API201/
2 optional skipped, Web71, migration85/typechecks/builds pass.

Supported runtime Help publication:0 created,17 revised,13 unchanged; history
retained. API/Web/worker product code fully published; no SMTP/provider-secret
change, external service activation, independent staging059 completion or public
Arandi website mutation implied. Old release retained for binary rollback;
additive migration compatible. Temporary server scripts removed; no secrets logged.
