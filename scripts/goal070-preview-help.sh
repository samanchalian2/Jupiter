#!/bin/bash
set -euo pipefail
test "$(hostname -I | tr ' ' '\n' | grep -Fx 172.20.190.16)" = 172.20.190.16
cd /opt/jupiter/ip-preview
actor=$(runuser -u postgres -- psql -X -d jupiter -Atc "SELECT id FROM users WHERE email='admin@jupiter.local' AND is_platform_admin AND is_active")
test -n "$actor"
set -a
. <(tr -d '\r' < /opt/jupiter/secrets/ip-preview.env)
set +a
cd apps/api
node --import tsx scripts/publish-help-catalog.ts --actor-id="$actor" --slug=getting-started --slug=organization-members-csv --slug=organization-setup-wizard --slug=platform-organization-applications --slug=sla-business-calendar --slug=ticket-lifecycle
