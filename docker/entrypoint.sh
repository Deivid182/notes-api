#!/bin/sh
set -e

if [ "$RUN_MIGRATIONS" = "true" ]; then
  case "$DATABASE_ENGINE" in
    postgres) echo "→ running postgres migrations"; node dist/infrastructure/persistence/postgres/migrate.js ;;
    sqlite)   echo "→ running sqlite migrations";   node dist/infrastructure/persistence/sqlite/migrate.js ;;
    mongodb)  echo "→ running mongo indexes";       node dist/infrastructure/persistence/mongodb/migrate.js ;;
  esac
fi

exec node dist/main.js