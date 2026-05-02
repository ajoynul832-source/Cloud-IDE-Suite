# Cloud IDE — Operational Runbook

This document covers startup procedures, health verification, troubleshooting, and scaling guidance for the Cloud IDE platform.

---

## Startup Checklist

Run these checks in order after every deployment or server restart.

### 1. Environment Variables

```bash
# Verify required vars are set
node -e "
  const required = ['PORT', 'DATABASE_URL', 'SESSION_SECRET'];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length) { console.error('MISSING:', missing); process.exit(1); }
  console.log('OK: all required env vars present');
"
```

### 2. PostgreSQL Connection

```bash
# Test DB connectivity (requires psql)
psql "$DATABASE_URL" -c "SELECT 1 AS ok;" 2>&1

# Or via the API health check (the server logs a DB error at startup if it can't connect):
curl http://localhost:${PORT}/api/healthz
```

### 3. Redis

The server auto-starts a local `redis-server` process if `REDIS_URL` is not set.
If using managed Redis:

```bash
redis-cli -u "$REDIS_URL" ping
# → PONG
```

### 4. Disk Space

```bash
df -h /tmp          # APK temp directory
df -h .             # Workspace / log files

# Warn if < 1 GB free
df --output=avail /tmp | awk 'NR==2 && $1 < 1048576 { print "WARNING: /tmp has less than 1 GB free" }'
```

### 5. APK Build SDKs (if enabled)

```bash
# Flutter
flutter doctor --no-color 2>&1 | head -20

# Android / Java
java -version 2>&1
echo "ANDROID_HOME = $ANDROID_HOME"
ls "$ANDROID_HOME/build-tools" 2>/dev/null | tail -3
```

### 6. Schema Migration

Always run after code deployments that include DB schema changes:

```bash
pnpm --filter @workspace/db run push
```

### 7. Server Health

```bash
curl -f http://localhost:${PORT}/api/healthz && echo "✓ healthy"
```

---

## Log Files

| File | Contents | Level |
|------|----------|-------|
| `artifacts/api-server/logs/app.log` | All INFO+ events (JSON) | INFO |
| `artifacts/api-server/logs/errors.log` | ERROR events only (JSON) | ERROR |
| `/tmp/build_errors.jsonl` | Structured build failure records | — |

View live logs:

```bash
# Tail structured logs (pretty-print with jq)
tail -f artifacts/api-server/logs/app.log | jq -r '[.time,.level,.msg] | join(" | ")'

# Filter errors only
tail -f artifacts/api-server/logs/errors.log | jq .

# Build errors
tail -20 /tmp/build_errors.jsonl | jq .
```

---

## Runtime Metrics

```bash
# Get full metrics snapshot (requires ADMIN_TOKEN or SESSION_SECRET)
curl -s http://localhost:${PORT}/api/metrics \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .
```

Key fields to monitor:

| Field | Alert threshold |
|-------|----------------|
| `runs.errorRate` | > 5% |
| `builds.errorRate` | > 20% |
| `queues.runs.waiting` | > 50 |
| `queues.builds.waiting` | > 10 |
| `rateLimitHits` | > 100/hr (potential abuse) |

---

## Troubleshooting

### Build queue stuck (jobs waiting but not processing)

**Symptoms:** `GET /api/status/:id` stays on `queued` for > 2 minutes.

**Checks:**

```bash
# 1. Is the worker process alive?
curl http://localhost:${PORT}/api/metrics -H "Authorization: Bearer $ADMIN_TOKEN" \
  | jq '.queues'

# 2. Is Redis healthy?
redis-cli ping

# 3. Check Bull Board dashboard
open http://localhost:${PORT}/api/admin/queues
```

**Fix:** Restart the API server. Workers re-register automatically on startup.

---

### APK not downloading (404 on /download/:id)

**Checks:**

```bash
# 1. Check build status in DB
psql "$DATABASE_URL" -c "
  SELECT id, status, apk_path, apk_size, error_message
  FROM builds
  WHERE id = '<jobId>';
"

# 2. Verify APK file exists
ls -lh /tmp/apk_builds/<jobId>.apk 2>/dev/null || echo "APK file missing"

# 3. Check disk space
df -h /tmp
```

**Fix:** If `status = complete` but the APK file is gone, the temp directory was
cleared. The user will need to rebuild. Consider configuring persistent APK storage
(see Scaling Guide).

---

### Job timeout ("timed out" in build logs)

**Symptoms:** Build log ends with `killed — exceeded N min timeout`.

**Checks:**
- Check server CPU load (`top`, `htop`)
- Check if Gradle daemon is consuming all memory
- Check `BUILD_TIMEOUT_MS` env var (default: 8 min Flutter, 10 min Android)

**Fix:**
- Restart the server to reclaim resources
- Increase memory on the server
- For Gradle: add `--no-daemon` to the build command (already enabled)

---

### Auth failing / JWT invalid

**Symptoms:** All authenticated endpoints return 401.

**Checks:**

```bash
# Verify SESSION_SECRET is consistent across restarts
echo "SECRET_LEN=${#SESSION_SECRET}"

# Check cookie is being set
curl -c /tmp/cookies.txt -X POST http://localhost:${PORT}/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"yourpass"}' -v 2>&1 | grep 'Set-Cookie'
```

**Fix:** If `SESSION_SECRET` changed (e.g. new deployment), all existing JWT cookies
are invalidated and users must log in again. This is expected behaviour.

---

### Database connection errors at startup

**Symptoms:** Server logs `Error: Connection refused` at startup and exits.

**Checks:**
- Verify `DATABASE_URL` format: `postgresql://user:password@host:5432/dbname`
- Test connectivity: `psql "$DATABASE_URL" -c "SELECT 1;"`
- Check PostgreSQL is accepting connections from the server IP

**Fix:** Correct `DATABASE_URL` or firewall rules. Run `pnpm --filter @workspace/db run push` after connecting successfully.

---

### Redis auto-start fails

**Symptoms:** `redis: failed to start redis-server` in logs.

**Fix:**

```bash
# Option 1: Install Redis
apt-get install redis-server  # Debian/Ubuntu
brew install redis             # macOS

# Option 2: Use managed Redis and set the env var
REDIS_URL=redis://your-managed-redis:6379
```

---

### Rate limit blocking legitimate users

**Symptoms:** Users getting 429 responses unexpectedly.

**Check the metrics:**
```bash
curl -s http://localhost:${PORT}/api/metrics \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.rateLimitHits'
```

**Check logs for rate-limit WARN entries:**
```bash
grep '"limiter"' artifacts/api-server/logs/app.log | jq -s 'group_by(.limiter) | map({ limiter: .[0].limiter, count: length })'
```

**Fix:** Adjust limits via env vars or identify abusive IPs from the WARN logs.

---

## Scaling Guide

### Multiple API server instances

The API is stateless (JWT cookies, PostgreSQL, Redis). You can run multiple instances behind a load balancer:

1. All instances must share the same `DATABASE_URL` and `REDIS_URL`
2. All instances must share the same `SESSION_SECRET` (JWT validation)
3. Use sticky sessions OR ensure the JWT cookie is accepted by all instances (it is, if `SESSION_SECRET` matches)

```
                  ┌─────────────────┐
Browser ──────────► Load Balancer   │
                  └────────┬────────┘
                           │  round-robin
              ┌────────────┼────────────┐
              ▼            ▼            ▼
          API-1:8080   API-2:8080   API-3:8080
              │            │            │
              └────────────┼────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
          PostgreSQL     Redis      APK Storage
```

### Separate build workers

Run one or more dedicated worker processes (no HTTP server) to handle APK builds:

```bash
# Not yet implemented as a separate entrypoint — coming in Phase 9.
# Currently: build workers run inside the API server process.
```

### Database scaling

- Use **connection pooling** (PgBouncer or Neon's built-in pooler)
- Enable **read replicas** for the project list / explore endpoints
- Recommended managed services: **Neon**, **Supabase**, **AWS RDS**, **Railway**

### Redis scaling

- For production, use a managed Redis with persistence enabled
- Recommended: **Upstash** (serverless), **AWS ElastiCache**, **Railway Redis**
- Enable AOF persistence to survive restarts without losing BullMQ job data

### APK storage

Default storage is `$TMPDIR/apk_builds/` — ephemeral! Files are lost on server restart.

For persistent storage, implement an S3-compatible backend (Phase 9 roadmap):
- Upload the APK to S3 after build completes
- Store the S3 URL in `builds.apk_path`
- Update `/download/:id` to redirect to the signed S3 URL

### CDN

Add a CDN (Cloudflare, CloudFront) in front of the load balancer for:
- Static assets (cloud-ide Vite bundle)
- APK downloads (once S3 storage is enabled)

---

## Backup & Recovery

### Database backup

```bash
pg_dump "$DATABASE_URL" | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Database restore

```bash
gunzip -c backup_YYYYMMDD_HHMMSS.sql.gz | psql "$DATABASE_URL"
```

### Redis backup

Redis AOF / RDB files — managed by your Redis provider, or:

```bash
redis-cli save
cp /var/lib/redis/dump.rdb /backups/
```

---

## Security Checklist

- [ ] `SESSION_SECRET` is ≥ 32 random bytes (`openssl rand -hex 32`)
- [ ] `ADMIN_TOKEN` is set separately from `SESSION_SECRET`
- [ ] `GOOGLE_CLIENT_ID` is set if Google auth is enabled
- [ ] PostgreSQL is not exposed to the public internet
- [ ] Redis is not exposed to the public internet (or has AUTH enabled)
- [ ] `/api/admin/queues` and `/api/metrics` are not accessible without a token
- [ ] HTTPS / TLS terminates at the load balancer or reverse proxy
- [ ] `logs/errors.log` is rotated (logrotate or managed logging service)
