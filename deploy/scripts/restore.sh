#!/usr/bin/env bash
# Restore Remora volumes from a backup created by backup.sh.
# WARNING: overwrites existing volume contents. Stop the stack first.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ARCHIVE="${1:?usage: restore.sh ./backups/remora-XXXX.tar.gz}"
PROJ="${COMPOSE_PROJECT_NAME:-remora}"
cd "$ROOT"

if [[ ! -f "$ARCHIVE" ]]; then
  echo "Archive not found: $ARCHIVE" >&2
  exit 1
fi

echo "==> Stopping Remora stack"
docker compose --profile gateway stop || docker compose stop || true

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
tar -C "$TMP" -xzf "$ARCHIVE"

echo "==> Restoring volumes into project ${PROJ}"
for tarfile in "$TMP"/*.tar; do
  [[ -f "$tarfile" ]] || continue
  base="$(basename "$tarfile" .tar)"
  vol="${PROJ}_${base}"
  echo "  $tarfile → $vol"
  docker volume create "$vol" >/dev/null
  docker run --rm -v "$vol":/to -v "$TMP":/from alpine \
    sh -c "rm -rf /to/* /to/.[!.]* 2>/dev/null; tar -C /to -xf /from/$(basename "$tarfile")"
done

echo "==> Start with: docker compose up -d"
echo "OK restored from $ARCHIVE"
