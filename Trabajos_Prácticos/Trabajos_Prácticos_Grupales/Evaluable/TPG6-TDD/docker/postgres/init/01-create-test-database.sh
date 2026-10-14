#!/bin/sh
# Creates the isolated database used by integration tests (ADR-16).
# Runs only on the first start of an empty data volume.
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<EOSQL
CREATE DATABASE "${POSTGRES_TEST_DB}";
EOSQL
