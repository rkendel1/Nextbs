#!/bin/bash

# --- Config ---
SERVER_PATH="brandmanager/lib/server.cjs"
PORT=3000
TEST_URL="https://www.shadcndesign.com/templates/mindspace"
DB_NAME="token"
DB_USER="postgres"

# --- Detect schema.sql path relative to script location ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCHEMA_PATH="$SCRIPT_DIR/schema.sql"

# --- Check if database tables exist ---
TABLE_CHECK=$(psql -U $DB_USER -d $DB_NAME -tAc "SELECT to_regclass('public.sites');")
if [ "$TABLE_CHECK" != "" ]; then
  echo "Existing tables found. Dropping for clean test setup..."
  psql -U $DB_USER -d $DB_NAME -c "
    DROP TABLE IF EXISTS brand_voice CASCADE;
    DROP TABLE IF EXISTS products CASCADE;
    DROP TABLE IF EXISTS design_tokens CASCADE;
    DROP TABLE IF EXISTS company_info CASCADE;
    DROP TABLE IF EXISTS sites CASCADE;
  "
fi
echo "Applying schema at $SCHEMA_PATH..."
psql -U $DB_USER -d $DB_NAME -f "$SCHEMA_PATH"

# Set DB for brandmanager
export DATABASE_URL="postgresql://${DB_USER}@localhost:5432/${DB_NAME}"

# --- Start server in background ---
echo "Starting Brand Manager server on port $PORT..."
# Use node or nodemon explicitly
if command -v nodemon >/dev/null 2>&1; then
  nodemon $SERVER_PATH &
else
  node $SERVER_PATH &
fi
SERVER_PID=$!

# --- Wait for server to start ---
echo "Waiting 5 seconds for server to boot..."
sleep 5

# --- Test crawl endpoint ---
echo "Sending test crawl request to $TEST_URL..."
curl -s -X POST http://localhost:$PORT/api/brand-manager/crawl \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"$TEST_URL\"}" | jq

# --- Optional: Kill server after test ---
echo "Stopping server..."
kill $SERVER_PID