#!/usr/bin/env bash
# =============================================================================
#  Cloud IDE — Manual End-to-End Smoke Test
#  Usage: bash tests/manual-test.sh [BASE_URL]
#  Example: bash tests/manual-test.sh http://localhost:8080
# =============================================================================

set -euo pipefail

BASE="${1:-http://localhost:8080}"
API="$BASE/api"
PASS=0
FAIL=0
COOKIE_JAR="$(mktemp /tmp/cloud-ide-test-cookies.XXXXXX)"
SHARE_ID=""
PROJECT_ID=""

# ── Colours ──────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ok()   { echo -e "${GREEN}  ✓${NC}  $1"; ((PASS++)) || true; }
fail() { echo -e "${RED}  ✗${NC}  $1"; ((FAIL++)) || true; }
info() { echo -e "${YELLOW}  ·${NC}  $1"; }
section() { echo ""; echo -e "  ${YELLOW}══ $1 ══${NC}"; }

check_status() {
  local label="$1" expected="$2" actual="$3"
  if [[ "$actual" == "$expected" ]]; then ok "$label (HTTP $actual)";
  else fail "$label — expected HTTP $expected, got HTTP $actual"; fi
}

json_get() { echo "$1" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d$2)" 2>/dev/null || echo ""; }

# ── 0. Health ────────────────────────────────────────────────────────────────
section "Health Check"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API/healthz")
check_status "GET /healthz" "200" "$STATUS"

BODY=$(curl -s "$API/healthz")
STATUS_FIELD=$(json_get "$BODY" "['status']")
[[ "$STATUS_FIELD" == "ok" ]] && ok "  status field = ok" || fail "  status field != ok (got: $STATUS_FIELD)"

# ── 1. Auth ──────────────────────────────────────────────────────────────────
section "Authentication"

TEST_EMAIL="smoketest_$(date +%s)@example.com"
TEST_PASS="testpassword123"

# Register
BODY=$(curl -s -c "$COOKIE_JAR" -X POST "$API/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASS\"}")
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -c "$COOKIE_JAR" -X POST "$API/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${TEST_EMAIL}2\",\"password\":\"$TEST_PASS\"}")
check_status "POST /auth/register" "201" "$STATUS"

# Login
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -c "$COOKIE_JAR" -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASS\"}")
check_status "POST /auth/login (valid credentials)" "200" "$STATUS"

# Wrong password
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"wrongpassword\"}")
check_status "POST /auth/login (wrong password → 401)" "401" "$STATUS"

# /auth/me
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_JAR" "$API/auth/me")
check_status "GET /auth/me (with cookie)" "200" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API/auth/me")
check_status "GET /auth/me (no cookie → 401)" "401" "$STATUS"

# ── 2. Usage ─────────────────────────────────────────────────────────────────
section "Usage"

BODY=$(curl -s -b "$COOKIE_JAR" "$API/usage")
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_JAR" "$API/usage")
check_status "GET /usage" "200" "$STATUS"
RUNS_REMAINING=$(json_get "$BODY" "['runsRemaining']")
info "  runsRemaining = $RUNS_REMAINING"

# ── 3. Code Execution ─────────────────────────────────────────────────────────
section "Code Execution"

# JavaScript
BODY=$(curl -s -b "$COOKIE_JAR" -X POST "$API/run" \
  -H "Content-Type: application/json" \
  -d '{"language":"javascript","code":"console.log(\"hello from test\"); console.log(2+2)"}')
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_JAR" -X POST "$API/run" \
  -H "Content-Type: application/json" \
  -d '{"language":"javascript","code":"console.log(\"hello\")" }')
check_status "POST /run (javascript)" "200" "$STATUS"
EXIT_CODE=$(json_get "$BODY" "['exitCode']")
[[ "$EXIT_CODE" == "0" ]] && ok "  exitCode = 0" || fail "  exitCode != 0 (got: $EXIT_CODE)"

# TypeScript
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_JAR" -X POST "$API/run" \
  -H "Content-Type: application/json" \
  -d '{"language":"typescript","code":"const x: number = 42; console.log(x)"}')
check_status "POST /run (typescript)" "200" "$STATUS"

# Python
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_JAR" -X POST "$API/run" \
  -H "Content-Type: application/json" \
  -d '{"language":"python","code":"print(\"hello from python\")"}')
check_status "POST /run (python)" "200" "$STATUS"

# HTML
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_JAR" -X POST "$API/run" \
  -H "Content-Type: application/json" \
  -d '{"language":"html","code":"<h1>Hello</h1>"}')
check_status "POST /run (html)" "200" "$STATUS"

# Security: blocked module
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/run" \
  -H "Content-Type: application/json" \
  -d '{"language":"javascript","code":"require(\"fs\")"}')
check_status "POST /run (require fs → 403)" "403" "$STATUS"

# Security: process.env
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/run" \
  -H "Content-Type: application/json" \
  -d '{"language":"javascript","code":"console.log(process.env.DATABASE_URL)"}')
check_status "POST /run (process.env → 403)" "403" "$STATUS"

# Security: oversized code → 413
BIG_TMP=$(mktemp /tmp/big_payload.XXXXXX)
python3 -c "
import json, sys
payload = json.dumps({'language':'javascript','code':'x' * 600000})
sys.stdout.write(payload)
" > "$BIG_TMP"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/run" \
  -H "Content-Type: application/json" \
  --data @"$BIG_TMP" 2>/dev/null || echo "000")
rm -f "$BIG_TMP"
check_status "POST /run (600 KB code → 413)" "413" "$STATUS"

# Unsupported language
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/run" \
  -H "Content-Type: application/json" \
  -d '{"language":"cobol","code":"DISPLAY HELLO"}')
check_status "POST /run (unsupported language → 400)" "400" "$STATUS"

# ── 4. Projects ────────────────────────────────────────────────────────────────
section "Projects"

# Create
BODY=$(curl -s -b "$COOKIE_JAR" -X POST "$API/projects" \
  -H "Content-Type: application/json" \
  -d '{"name":"Smoke Test Project","projectType":"javascript","files":{"main.js":"console.log(42)"}}')
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_JAR" -X POST "$API/projects" \
  -H "Content-Type: application/json" \
  -d '{"name":"Smoke Test 2","projectType":"javascript","files":{"main.js":"console.log(1)"}}')
check_status "POST /projects (create)" "201" "$STATUS"
PROJECT_ID=$(json_get "$BODY" "['project']['id']")
info "  created project id = $PROJECT_ID"

# List
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_JAR" "$API/projects")
check_status "GET /projects" "200" "$STATUS"

# Get
if [[ -n "$PROJECT_ID" ]]; then
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_JAR" "$API/projects/$PROJECT_ID")
  check_status "GET /projects/:id" "200" "$STATUS"

  # Update
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_JAR" -X PUT "$API/projects/$PROJECT_ID" \
    -H "Content-Type: application/json" \
    -d '{"name":"Updated Name","files":{"main.js":"console.log(99)"}}')
  check_status "PUT /projects/:id" "200" "$STATUS"

  # Versions
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_JAR" -X POST "$API/projects/$PROJECT_ID/versions" \
    -H "Content-Type: application/json" \
    -d '{"label":"v1.0 test snapshot"}')
  check_status "POST /projects/:id/versions (create snapshot)" "201" "$STATUS"

  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_JAR" "$API/projects/$PROJECT_ID/versions")
  check_status "GET /projects/:id/versions (list)" "200" "$STATUS"

  # Share
  SHARE_BODY=$(curl -s -b "$COOKIE_JAR" -X POST "$API/projects/$PROJECT_ID/share")
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_JAR" -X POST "$API/projects/$PROJECT_ID/share")
  check_status "POST /projects/:id/share" "200" "$STATUS"
  SHARE_ID=$(json_get "$SHARE_BODY" "['shareId']")
  info "  shareId = $SHARE_ID"

  # Duplicate
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_JAR" -X POST "$API/projects/$PROJECT_ID/duplicate")
  check_status "POST /projects/:id/duplicate" "201" "$STATUS"
fi

# Unauthenticated project access → 401
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API/projects")
check_status "GET /projects (no auth → 401)" "401" "$STATUS"

# ── 5. Sharing & Explore ──────────────────────────────────────────────────────
section "Sharing & Explore"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API/explore")
check_status "GET /explore (public)" "200" "$STATUS"

if [[ -n "$SHARE_ID" ]]; then
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API/share/$SHARE_ID")
  check_status "GET /share/:shareId" "200" "$STATUS"

  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API/share/$SHARE_ID/stats")
  check_status "GET /share/:shareId/stats" "200" "$STATUS"

  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/share/$SHARE_ID/event" \
    -H "Content-Type: application/json" \
    -d '{"event":"run"}')
  check_status "POST /share/:shareId/event (run)" "200" "$STATUS"

  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/share/$SHARE_ID/event" \
    -H "Content-Type: application/json" \
    -d '{"event":"fork"}')
  check_status "POST /share/:shareId/event (fork)" "200" "$STATUS"
fi

# ── 6. Build Status Endpoint (UUID validation) ─────────────────────────────────
section "Build API (structure only)"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API/status/not-a-uuid")
check_status "GET /status/bad-id → 400" "400" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API/status/00000000-0000-0000-0000-000000000000")
check_status "GET /status/unknown-uuid → 404" "404" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API/download/00000000-0000-0000-0000-000000000000")
check_status "GET /download/unknown-uuid → 404" "404" "$STATUS"

# ── 7. API Docs ───────────────────────────────────────────────────────────────
section "API Documentation"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -L "$API/docs")
check_status "GET /api/docs (Swagger UI)" "200" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API/docs/spec.json")
check_status "GET /api/docs/spec.json (raw OpenAPI)" "200" "$STATUS"

SPEC=$(curl -s "$API/docs/spec.json")
VERSION=$(json_get "$SPEC" "['openapi']")
[[ "$VERSION" == "3.1.0" ]] && ok "  spec version = 3.1.0" || fail "  unexpected spec version: $VERSION"

# ── 8. Logout ─────────────────────────────────────────────────────────────────
section "Logout"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_JAR" -c "$COOKIE_JAR" -X POST "$API/auth/logout")
check_status "POST /auth/logout" "200" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_JAR" "$API/auth/me")
check_status "GET /auth/me after logout → 401" "401" "$STATUS"

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════"
TOTAL=$((PASS + FAIL))
echo -e "  Results: ${GREEN}${PASS} passed${NC}, ${RED}${FAIL} failed${NC} / ${TOTAL} total"
echo "═══════════════════════════════════════"
echo ""

rm -f "$COOKIE_JAR"

if [[ "$FAIL" -gt 0 ]]; then exit 1; fi
exit 0
