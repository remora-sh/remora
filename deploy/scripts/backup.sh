#!/usr/bin/env bash
# Backup Remora compose volumes (SQLite data + Caddy state).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT_DIR="${1:-$ROOT/backups}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
ARCHIVE="$OUT_DIR/remora-$STAMP.tar.gz"
mkdir -p "$OUT_DIR"
cd "$ROOT"

echo "==> Remora backup → $ARCHIVE"
docker compose ps >/dev/null

# Named volumes from compose project "remora"
PROJ="${COMPOSE_PROJECT_NAME:-remora}"
VOLS=$(docker volume ls -q --filter "name=${PROJ}_" || true)
if [[ -z "${VOLS}" ]]; then
  echo "No volumes found for project ${PROJ}. Is the stack running / created?"
  exit 1
fi

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
for v in $VOLS; do
  name="${v#${PROJ}_}"
  echo "  packing $v → $name"
  docker run --rm -v "$v":/from:ro -v "$TMP":/to alpine \
    tar -C /from -cf "/to/${name}.tar" .
done
tar -C "$TMP" -czf "$ARCHIVE" .
echo "OK $ARCHIVE"
ls -lh "$ARCHIVE"
