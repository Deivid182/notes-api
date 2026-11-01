#!/bin/sh
set -e

if [ "$RUN_MIGRATIONS" = "true" ] || [ "$RUN_MIGRATIONS" = "1" ]; then
  echo "→ running ${DATABASE_ENGINE:-sqlite} migrations"
  node dist/migrate.js
fi

# Las migraciones ya se aplicaron arriba: la app no las repite al arrancar.
RUN_MIGRATIONS=false exec node dist/main.js
