#!/usr/bin/env bash
#
# Applies the migrations to a throwaway Postgres database and runs the security
# assertions against them. Intended for CI and for a quick local check before pushing a
# migration.
#
#   ./supabase/tests/run.sh                      # spins up a local cluster
#   DATABASE_URL=postgres://... ./run.sh         # runs against an existing database
#
# The assertions in rls.test.sql are mutation-tested: each one has been verified to fail
# when the protection it covers is removed. If you add an assertion, confirm the same —
# a security test that cannot fail is worse than no test at all.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MIGRATIONS="$REPO_ROOT/supabase/migrations"
TESTS="$REPO_ROOT/supabase/tests"

if [[ -n "${DATABASE_URL:-}" ]]; then
  PSQL=(psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q)
  echo "Running against \$DATABASE_URL"
else
  export PATH="/usr/lib/postgresql/16/bin:$PATH"
  PGDIR="${PGDIR:-/var/tmp/xoholy-pg}"
  PORT="${PGPORT:-55432}"

  if ! pg_isready -h "$PGDIR" -p "$PORT" >/dev/null 2>&1; then
    echo "Starting a throwaway Postgres cluster in $PGDIR"
    rm -rf "$PGDIR"
    mkdir -p "$PGDIR"
    # initdb refuses to run as root, so hand the directory to the postgres user.
    chown postgres:postgres "$PGDIR" 2>/dev/null || true
    su postgres -s /bin/bash -c \
      "export PATH=/usr/lib/postgresql/16/bin:\$PATH; initdb -D $PGDIR/data -U postgres --auth=trust" >/dev/null
    su postgres -s /bin/bash -c \
      "export PATH=/usr/lib/postgresql/16/bin:\$PATH; pg_ctl -D $PGDIR/data -o '-p $PORT -k $PGDIR' -l $PGDIR/pg.log start -w" >/dev/null
  fi

  psql -h "$PGDIR" -p "$PORT" -U postgres -q \
    -c "drop database if exists xoholy_test;" -c "create database xoholy_test;" >/dev/null
  PSQL=(psql -h "$PGDIR" -p "$PORT" -U postgres -d xoholy_test -v ON_ERROR_STOP=1 -q)
fi

echo "Applying harness"
"${PSQL[@]}" -f "$TESTS/harness.sql" >/dev/null

echo "Applying migrations"
for migration in "$MIGRATIONS"/*.sql; do
  echo "  $(basename "$migration")"
  if command -v psql >/dev/null && ! "${PSQL[@]}" -tAc \
       "select 1 from pg_available_extensions where name='vector' and installed_version is not null" \
       | grep -q 1; then
    # pgvector ships with Supabase but is often absent from a bare local Postgres.
    # Shim only the one column that needs it; everything else is validated for real.
    sed -e 's/^create extension if not exists "vector";/-- [local] pgvector unavailable, shimmed/' \
        -e 's/embedding    vector(256),/embedding    text,/' \
        "$migration" | "${PSQL[@]}" -f - >/dev/null
  else
    "${PSQL[@]}" -f "$migration" >/dev/null
  fi
done

echo "Running security assertions"
"${PSQL[@]}" -f "$TESTS/rls.test.sql"
