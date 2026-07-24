#!/usr/bin/env bash
set -euo pipefail
STAMP=$(date -u +"%Y-%m-%dT%H-%M-%SZ")
OUT_DIR="$(dirname "$0")/../server/data/backups"
mkdir -p "$OUT_DIR"
if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL not set — use npm run backup for SQLite JSON export"
  exit 0
fi
pg_dump "$DATABASE_URL" > "$OUT_DIR/pg-$STAMP.sql"
echo "Wrote $OUT_DIR/pg-$STAMP.sql"
