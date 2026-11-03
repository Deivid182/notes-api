#!/usr/bin/env bash
# Levanta postgres y mongo efímeros, corre integración + e2e contra cada motor y los baja.
set -uo pipefail
cd "$(dirname "$0")/.."

docker compose -f compose.test.yml up -d --wait || { echo "no se pudo levantar compose.test.yml"; exit 1; }
trap 'docker compose -f compose.test.yml down -v' EXIT

status=0
for engine in postgres mongodb; do
  echo "=== $engine ==="
  TEST_DB_ENGINE=$engine pnpm exec vitest run --project integration --project e2e || status=1
done
exit $status
