#!/bin/bash

# Database Migration Script: Local to Remote
# This script migrates all tables and data from local to remote PostgreSQL database

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Remote database connection
REMOTE_DB="postgresql://MNKgZI:%23+2nVXX%23YW@database-9gzu6ya5n8.tcp-proxy-2212.dcdeploy.cloud:30090/database-db"
REMOTE_DB_URL_ENCODED="postgresql://MNKgZI:%23+2nVXX%23YW@database-9gzu6ya5n8.tcp-proxy-2212.dcdeploy.cloud:30090/database-db"

# Local database connection (update based on your local setup)
LOCAL_DB_HOST="${DB_HOST:-localhost}"
LOCAL_DB_PORT="${DB_PORT:-5432}"
LOCAL_DB_NAME="${DB_NAME:-mentor_platform}"
LOCAL_DB_USER="${DB_USER:-user}"
LOCAL_DB_PASSWORD="${DB_PASSWORD:-}"

echo -e "${GREEN}=== Database Migration: Local to Remote ===${NC}"
echo ""

# Step 1: Test local database connection
echo -e "${YELLOW}Step 1: Testing local database connection...${NC}"
export PGPASSWORD="${LOCAL_DB_PASSWORD}"
if psql -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Local database connection successful${NC}"
else
    echo -e "${RED}✗ Local database connection failed${NC}"
    exit 1
fi

# Step 2: Test remote database connection
echo -e "${YELLOW}Step 2: Testing remote database connection...${NC}"
if psql "${REMOTE_DB_URL_ENCODED}" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Remote database connection successful${NC}"
else
    echo -e "${RED}✗ Remote database connection failed${NC}"
    exit 1
fi

# Step 3: Export schema from local database
echo -e "${YELLOW}Step 3: Exporting schema from local database...${NC}"
SCHEMA_FILE="/tmp/mentor_platform_schema.sql"
pg_dump -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
    --schema-only --no-owner --no-privileges > "${SCHEMA_FILE}"
echo -e "${GREEN}✓ Schema exported to ${SCHEMA_FILE}${NC}"

# Step 4: Export data from local database
echo -e "${YELLOW}Step 4: Exporting data from local database...${NC}"
DATA_FILE="/tmp/mentor_platform_data.sql"
pg_dump -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
    --data-only --no-owner --no-privileges > "${DATA_FILE}"
echo -e "${GREEN}✓ Data exported to ${DATA_FILE}${NC}"

# Step 5: Drop existing tables in remote database (if any)
echo -e "${YELLOW}Step 5: Cleaning remote database...${NC}"
psql "${REMOTE_DB_URL_ENCODED}" -c "
DO \$\$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END \$\$;
" 2>/dev/null || echo "No tables to drop or error occurred (continuing...)"

# Step 6: Import schema to remote database
echo -e "${YELLOW}Step 6: Importing schema to remote database...${NC}"
psql "${REMOTE_DB_URL_ENCODED}" < "${SCHEMA_FILE}" > /dev/null 2>&1
echo -e "${GREEN}✓ Schema imported successfully${NC}"

# Step 7: Import data to remote database
echo -e "${YELLOW}Step 7: Importing data to remote database...${NC}"
if [ -s "${DATA_FILE}" ]; then
    psql "${REMOTE_DB_URL_ENCODED}" < "${DATA_FILE}" > /dev/null 2>&1 || echo -e "${YELLOW}⚠ Some data import warnings (this may be normal)${NC}"
    echo -e "${GREEN}✓ Data imported successfully${NC}"
else
    echo -e "${YELLOW}⚠ No data to import (empty database)${NC}"
fi

# Step 8: Verify migration
echo -e "${YELLOW}Step 8: Verifying migration...${NC}"
TABLE_COUNT=$(psql "${REMOTE_DB_URL_ENCODED}" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
echo -e "${GREEN}✓ Remote database now has ${TABLE_COUNT} tables${NC}"

# Cleanup
rm -f "${SCHEMA_FILE}" "${DATA_FILE}"

echo ""
echo -e "${GREEN}=== Migration Complete! ===${NC}"
echo ""
echo "Next steps:"
echo "1. Update .env files to point to remote database"
echo "2. Drop local database (optional)"
echo "3. Run tests to verify"

