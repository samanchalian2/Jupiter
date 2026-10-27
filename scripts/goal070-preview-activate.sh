#!/bin/bash
# Owner-authorized Preview only. Additive migration preserves old binary rollback.
set -euo pipefail
test "$(hostname -I | tr ' ' '\n' | grep -Fx 172.20.190.16)" = 172.20.190.16
candidate=/opt/jupiter/releases/goal070-saba-candidate
prior=/opt/jupiter/releases/fe64140
current=/opt/jupiter/ip-preview
migration=074_first_login_password.sql
test "$(readlink -f "$current")" = "$prior"
test -L "$current"
test -s /opt/jupiter/backups/goal070-saba-before.dump
test -f "$candidate/GOAL070_SOURCE_SHA256"
test -f "$candidate/apps/api/dist/main.js"
test -f "$candidate/apps/web/dist/index.html"
test ! -e /opt/jupiter/ip-preview-goal070-next
test "$(runuser -u postgres -- psql -X -d jupiter -Atc 'SELECT count(*) FROM schema_migrations')" = 84
arandi_before=$(systemctl show arandi-platform -p ExecMainStartTimestamp -p NRestarts)
rollback(){
  systemctl stop jupiter-ip-preview-api jupiter-ip-preview-worker
  ln -s "$prior" /opt/jupiter/ip-preview-goal070-rollback
  mv -Tf /opt/jupiter/ip-preview-goal070-rollback "$current"
  systemctl start jupiter-ip-preview-api jupiter-ip-preview-worker
}
trap rollback ERR
systemctl stop jupiter-ip-preview-worker jupiter-ip-preview-api
{
  printf '%s\n' 'BEGIN;' "SET LOCAL lock_timeout='5s';" "SET LOCAL statement_timeout='30s';"
  cat "$candidate/apps/api/migrations/$migration"
  printf '\nINSERT INTO schema_migrations(name) VALUES('\''%s'\'');\nCOMMIT;\n' "$migration"
} | runuser -u postgres -- psql -X -v ON_ERROR_STOP=1 -d jupiter >/dev/null
ln -s "$candidate" /opt/jupiter/ip-preview-goal070-next
mv -Tf /opt/jupiter/ip-preview-goal070-next "$current"
systemctl start jupiter-ip-preview-api jupiter-ip-preview-worker
ready=0
for i in $(seq 1 30); do
  if curl --max-time 2 -fsS http://127.0.0.1:13000/api/v1/health/ready >/dev/null; then ready=1;break;fi
  sleep 1
done
test "$ready" = 1
test "$(runuser -u postgres -- psql -X -d jupiter -Atc 'SELECT count(*) FROM schema_migrations')" = 85
curl --max-time 5 -fsS http://127.0.0.1:8088/ >/dev/null
curl --max-time 5 -fsS http://127.0.0.1:8088/api/v1/public/accounts/verification/readiness
test "$(systemctl show arandi-platform -p ExecMainStartTimestamp -p NRestarts)" = "$arandi_before"
systemctl is-active jupiter-ip-preview-api jupiter-ip-preview-worker arandi-platform
trap - ERR
echo GOAL070_PREVIEW_ACTIVATED_MAIN_UNCHANGED
