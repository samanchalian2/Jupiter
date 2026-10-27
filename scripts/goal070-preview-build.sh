#!/bin/bash
# Build an isolated Preview candidate; never switch services or touch PostgreSQL.
set -euo pipefail
test "$(hostname -I | tr ' ' '\n' | grep -Fx 172.20.190.16)" = 172.20.190.16
artifact=/opt/jupiter/releases/goal070-source.tar.gz
candidate=/opt/jupiter/releases/goal070-saba-candidate
prior=/opt/jupiter/releases/fe64140
test -f "$artifact"
test -d "$prior/node_modules"
test "$(readlink -f /opt/jupiter/ip-preview)" = "$prior"
test ! -e "$candidate"
test "$(df --output=avail -B1 /opt/jupiter | tail -1)" -gt 1073741824
mkdir "$candidate"
cp -a --reflink=auto "$prior/." "$candidate/"
tar -xzf "$artifact" -C "$candidate"
cd "$candidate"
tsc="$PWD/node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/bin/tsc"
test -f "$tsc"
node "$tsc" -p apps/api/tsconfig.build.json
cd apps/web
node "$tsc" -b
node node_modules/vite/bin/vite.js build
cd ../..
sha256sum "$artifact" | awk '{print $1}' > GOAL070_SOURCE_SHA256
printf '%s\n' GOAL070_PREVIEW_CANDIDATE > RELEASE_COMMIT
test "$(readlink -f /opt/jupiter/ip-preview)" = "$prior"
systemctl is-active jupiter-ip-preview-api jupiter-ip-preview-worker arandi-platform
echo GOAL070_ISOLATED_BUILD_PASS
