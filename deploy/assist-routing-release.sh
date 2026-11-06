#!/usr/bin/env bash
# Narrow, additive Assist release. Never restarts PostgreSQL or co-hosted Arandi.
set -euo pipefail
umask 077
environment=${1:?preview or main}
mode=${2:?prepare or activate}
case "$environment" in
  preview) root=/opt/jupiter; current=$root/ip-preview; dependency=$root/releases/unified-20261105; api=jupiter-ip-preview-api; worker=jupiter-ip-preview-worker; port=13000; envfile=$root/secrets/ip-preview.env ;;
  main) root=/srv/jupiter; current=$root/current; dependency=$(readlink -f "$current"); api=jupiter-main-api; worker=jupiter-main-worker; port=3100; envfile=/etc/jupiter/main.env ;;
  *) exit 2 ;;
esac
candidate=$root/releases/assist-routing-20261107
stamp=$(date -u +%Y%m%dT%H%M%SZ)
backup=$root/backups/assist-routing-$stamp
if [[ "$mode" == prepare ]]; then
  test ! -e "$candidate"
  mkdir -p "$candidate"
  tar -xf /tmp/jupiter-assist-source.tar -C "$candidate"
  ln -s "$dependency/node_modules" "$candidate/node_modules"
  ln -s "$dependency/apps/api/node_modules" "$candidate/apps/api/node_modules"
  # Reuse installed dependencies, not an external package install or server rebuild.
  compiler=$(find "$dependency/node_modules/.pnpm" -path '*/typescript/bin/tsc' -type f -print -quit)
  test -n "$compiler"
  (cd "$candidate/apps/api"; node "$compiler" -p tsconfig.build.json)
  mkdir -p "$candidate/apps/web/dist"
  tar -xf /tmp/jupiter-assist-web.tar -C "$candidate/apps/web/dist"
  ln -s apps/api "$candidate/api"
  ln -s apps/web/dist "$candidate/web"
  chown -R jupiter:jupiter "$candidate"
  chmod 755 "$candidate"
  chmod -R u=rwX,go=rX "$candidate/apps" "$candidate/docs"
  echo 'Assist candidate compiled; services and database unchanged.'
  exit 0
fi
test "$mode" == activate
test -s "$candidate/apps/api/dist/assist/assist-routing.service.js"
test -s "$candidate/apps/web/dist/index.html"
test "$(runuser -u postgres -- psql -X -d jupiter -Atc 'SELECT count(*) FROM schema_migrations')" == 85
mkdir -p "$backup"
old=$(readlink -f "$current")
printf '%s\n' "$old" > "$backup/previous-release"
systemctl show arandi-platform -p ActiveEnterTimestampMonotonic -p NRestarts > "$backup/arandi-before"
runuser -u postgres -- pg_dump -Fc jupiter > "$backup/jupiter-before.dump"
scratch=jupiter_assist_rehearsal_$(date -u +%s)
[[ "$scratch" =~ ^jupiter_assist_rehearsal_[0-9]+$ ]]
runuser -u postgres -- createdb "$scratch"
cleanup() { runuser -u postgres -- dropdb --if-exists "$scratch"; }
trap cleanup EXIT
runuser -u postgres -- pg_restore --no-owner -d "$scratch" < "$backup/jupiter-before.dump"
apply_migration() {
  runuser -u postgres -- psql -X -v ON_ERROR_STOP=1 -1 -d "$1" \
    -c "SET LOCAL lock_timeout='5s'; SET LOCAL statement_timeout='60s';" \
    -f "$candidate/apps/api/migrations/075_assist_request_routing.sql" \
    -c "INSERT INTO schema_migrations(name) VALUES('075_assist_request_routing.sql');"
}
apply_migration "$scratch" > "$backup/restore-rehearsal.log"
test "$(runuser -u postgres -- psql -X -d "$scratch" -Atc 'SELECT count(*) FROM schema_migrations')" == 86
cleanup
trap - EXIT
apply_migration jupiter > "$backup/migration.log"
# Additive migration remains safe for the previous release if rollback is needed.
systemctl stop "$api" "$worker"
ln -s "$candidate" "$root/assist-next-$stamp"
mv -Tf "$root/assist-next-$stamp" "$current"
systemctl start "$api" "$worker"
healthy=false
for attempt in {1..30}; do
  if curl --fail --silent "http://127.0.0.1:$port/api/v1/health/ready" > "$backup/readiness.json"; then healthy=true; break; fi
  sleep 1
done
if [[ "$healthy" != true ]]; then
  systemctl stop "$api" "$worker"
  ln -s "$old" "$root/assist-rollback-$stamp"
  mv -Tf "$root/assist-rollback-$stamp" "$current"
  systemctl start "$api" "$worker"
  echo 'Readiness failed; previous release restored. Additive schema retained.' >&2
  exit 1
fi
systemctl show arandi-platform -p ActiveEnterTimestampMonotonic -p NRestarts > "$backup/arandi-after"
cmp "$backup/arandi-before" "$backup/arandi-after"
systemctl is-active "$api" "$worker" arandi-platform
echo "Assist deployed. Backup: $backup"
