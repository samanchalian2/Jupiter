#!/bin/bash
# Jupiter-only backup/restore rehearsal. No application/service switch here.
set -euo pipefail
test "$(hostname -I | tr ' ' '\n' | grep -Fx 172.20.190.16)" = 172.20.190.16
candidate=/opt/jupiter/releases/goal070-saba-candidate
backup=/opt/jupiter/backups/goal070-saba-before.dump
rehearsal=jupiter_goal070_saba_rehearsal
migration=074_first_login_password.sql
test -f "$candidate/GOAL070_SOURCE_SHA256"
test "$(readlink -f /opt/jupiter/ip-preview)" = /opt/jupiter/releases/fe64140
test ! -e "$backup"
test "$(runuser -u postgres -- psql -X -d jupiter -Atc 'SELECT count(*) FROM schema_migrations')" = 84
test "$(runuser -u postgres -- psql -X -d postgres -Atc "SELECT count(*) FROM pg_database WHERE datname='$rehearsal'")" = 0
umask 077
mkdir -p /opt/jupiter/backups
runuser -u postgres -- pg_dump -Fc --dbname=jupiter > "$backup"
test -s "$backup"
runuser -u postgres -- pg_restore -l < "$backup" >/dev/null
cleanup(){ runuser -u postgres -- dropdb --if-exists "$rehearsal"; }
runuser -u postgres -- createdb "$rehearsal"
trap cleanup EXIT
runuser -u postgres -- pg_restore --exit-on-error --dbname="$rehearsal" < "$backup"
{
  printf '%s\n' 'BEGIN;' "SET LOCAL lock_timeout='5s';" "SET LOCAL statement_timeout='30s';"
  cat "$candidate/apps/api/migrations/$migration"
  printf '\nINSERT INTO schema_migrations(name) VALUES('\''%s'\'');\nCOMMIT;\n' "$migration"
} | runuser -u postgres -- psql -X -v ON_ERROR_STOP=1 -d "$rehearsal" >/dev/null
test "$(runuser -u postgres -- psql -X -d "$rehearsal" -Atc 'SELECT count(*) FROM schema_migrations')" = 85
test "$(runuser -u postgres -- psql -X -d "$rehearsal" -Atc 'SELECT count(*) FROM users WHERE must_change_password OR credential_version<>0')" = 0
test "$(runuser -u postgres -- psql -X -d "$rehearsal" -Atc 'SELECT count(*) FROM organizations WHERE legal_name IS NOT NULL')" = 0
test "$(runuser -u postgres -- psql -X -d "$rehearsal" -Atc 'SELECT count(*) FROM tickets WHERE ticket_number IN (5140,5141)')" = 2
test "$(runuser -u postgres -- psql -X -d jupiter -Atc 'SELECT count(*) FROM schema_migrations')" = 84
test "$(readlink -f /opt/jupiter/ip-preview)" = /opt/jupiter/releases/fe64140
systemctl is-active jupiter-ip-preview-api jupiter-ip-preview-worker arandi-platform
echo GOAL070_PREVIEW_BACKUP_RESTORE_MIGRATION_REHEARSAL_PASS
