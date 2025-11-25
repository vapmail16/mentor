#!/bin/bash

# Database initialization script for Mentor Platform
# This script creates the database and runs the schema

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
DB_NAME="${DB_NAME:-mentor_platform}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

echo -e "${GREEN}🚀 Initializing Mentor Platform Database${NC}"
echo ""

# Check if PostgreSQL is running
if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: PostgreSQL is not running or not accessible${NC}"
    echo "   Please ensure PostgreSQL is running and accessible at $DB_HOST:$DB_PORT"
    exit 1
fi

echo -e "${GREEN}✅ PostgreSQL is running${NC}"

# Check if database exists
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo -e "${YELLOW}⚠️  Database '$DB_NAME' already exists${NC}"
    read -p "Do you want to drop and recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}🗑️  Dropping existing database...${NC}"
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "DROP DATABASE IF EXISTS $DB_NAME;"
        echo -e "${GREEN}✅ Database dropped${NC}"
    else
        echo -e "${YELLOW}⚠️  Skipping database creation${NC}"
    fi
fi

# Create database if it doesn't exist
if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo -e "${GREEN}📦 Creating database '$DB_NAME'...${NC}"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;"
    echo -e "${GREEN}✅ Database created${NC}"
else
    echo -e "${GREEN}✅ Database already exists${NC}"
fi

# Run schema
echo -e "${GREEN}📋 Running database schema...${NC}"
SCHEMA_FILE="$(dirname "$0")/schema.sql"

if [ ! -f "$SCHEMA_FILE" ]; then
    echo -e "${RED}❌ Error: Schema file not found at $SCHEMA_FILE${NC}"
    exit 1
fi

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SCHEMA_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database schema applied successfully${NC}"
    echo ""
    echo -e "${GREEN}🎉 Database initialization complete!${NC}"
    echo ""
    echo "You can now start the backend server:"
    echo "  cd backend && npm install && npm run dev"
else
    echo -e "${RED}❌ Error: Failed to apply database schema${NC}"
    exit 1
fi

