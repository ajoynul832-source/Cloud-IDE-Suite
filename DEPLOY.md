# CloudIDE — Self-Hosting Guide

Deploy CloudIDE on your own server with **full APK build support** for Flutter, Android, HTML/JS/TS (via Capacitor), and React Native.

---

## Requirements

| Component | Minimum | Recommended |
|---|---|---|
| CPU | 4 cores | 8+ cores (builds are CPU-heavy) |
| RAM | 8 GB | 16 GB |
| Disk | 60 GB | 100 GB (SDKs + Gradle cache) |
| OS | Ubuntu 22.04 | Ubuntu 22.04 LTS |
| Docker | 24+ | latest |
| Docker Compose | v2.20+ | latest |

> **Build image size**: ~12-15 GB. First Docker build takes 20-40 min downloading SDKs.

---

## Quick Start (5 steps)

### Step 1 — Clone the repo

```bash
git clone https://github.com/your-org/cloudide
cd cloudide
```

### Step 2 — Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set:
```env
# Required
POSTGRES_PASSWORD=your_strong_password_here
JWT_SECRET=$(openssl rand -hex 32)
SESSION_SECRET=$(openssl rand -hex 32)
FRONTEND_URL=https://your-domain.com

# Optional: GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Optional: Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id

# Optional: AI code assistant
OPENAI_API_KEY=sk-...
```

### Step 3 — Build and start

```bash
# This builds the SDK image (~20-40 min first time, cached after)
docker compose up -d
```

Watch progress:
```bash
docker compose logs -f api
```

### Step 4 — Apply database schema

```bash
# Run migrations (first time only)
docker compose exec api node -e "
  const { drizzle } = require('drizzle-orm/node-postgres');
  console.log('Running migrations...');
" || echo "Run: pnpm --filter @workspace/db run push from your local machine with DATABASE_URL set"
```

Or from your local machine:
```bash
DATABASE_URL=postgresql://ide:your_password@your-server:5432/cloud_ide \
  pnpm --filter @workspace/db run push
```

### Step 5 — Verify

```bash
curl http://localhost:8080/api/healthz
# → {"status":"ok","db":"ok","redis":"ok","uptime":42}
```

Open `http://localhost:3000/ide` in your browser.

---

## Build Capabilities

Once deployed with `Dockerfile.sdk`:

| Language | Build Target | How |
|---|---|---|
| Flutter | ✅ Android APK | `flutter build apk --debug` |
| Kotlin/Java | ✅ Android APK | `Gradle assembleDebug` |
| HTML/JS/TS | ✅ Android APK | Capacitor + Gradle |
| React Native | ✅ Live preview + APK | Expo Snack + Gradle |
| iOS | ❌ Not supported | Requires macOS/Xcode |
| Python/Go/C++ | ❌ Not applicable | Use for server-side code |

---

## Architecture

```
your-server:80  ─→  docker compose
                     ├── web    (nginx, port 3000)  ← React/Vite frontend
                     ├── api    (Node.js, port 8080) ← Express + build workers
                     │    ├── Flutter SDK (/opt/flutter)
                     │    ├── Android SDK (/opt/android-sdk)
                     │    └── Capacitor (/opt/capacitor-template)
                     ├── postgres (port 5432)        ← PostgreSQL 16
                     └── redis    (port 6379)        ← BullMQ job queue
```

---

## Production with Nginx + HTTPS

### 1. Install Certbot
```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

### 2. Create `nginx.conf`
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate     /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://web:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API (including WebSocket for terminal)
    location /api/ {
        proxy_pass http://api:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        # Long timeout for APK builds
        proxy_read_timeout 600s;
        proxy_send_timeout 600s;
    }
}
```

### 3. Update FRONTEND_URL
```bash
# In .env
FRONTEND_URL=https://your-domain.com
docker compose up -d
```

---

## Speeding Up APK Builds

### Pre-warm Gradle cache (recommended)

```bash
# After first deploy, run a dummy build to cache Gradle deps
docker compose exec api bash -c "
  cd /opt/capacitor-template/android
  ANDROID_HOME=/opt/android-sdk ./gradlew dependencies --no-daemon -q
"
```

### Persist Gradle cache across restarts

The `docker-compose.yml` already mounts a `gradle_cache` volume at `/root/.gradle`.
This means after the first build, subsequent builds skip Gradle dependency downloads (~3-5 min savings).

### Build concurrency

Default is 2 simultaneous APK builds. For a powerful server, increase in the API environment:
```env
BUILD_CONCURRENCY=4
```

---

## Scaling

### Multiple API workers
```yaml
# docker-compose.yml
api:
  scale: 2  # 2 API server instances
```

> Note: BullMQ workers coordinate via Redis, so multiple instances share the build queue correctly.

### Separate build server

For very high volume, you can run build workers on a separate machine:
```bash
# On build machine: run only the worker (no HTTP server)
NODE_ENV=production \
REDIS_URL=redis://your-redis:6379 \
DATABASE_URL=postgresql://... \
ANDROID_HOME=/opt/android-sdk \
FLUTTER_ROOT=/opt/flutter \
node --enable-source-maps ./dist/index.mjs --workers-only
```

---

## Monitoring

### Health check
```bash
curl http://localhost:8080/api/healthz
```

### Bull Board (job queue dashboard)
```
http://localhost:8080/api/admin/queues
# Requires ADMIN_TOKEN header
```

### View build logs
```bash
docker compose logs -f api | grep "build worker"
```

### Database
```bash
docker compose exec postgres psql -U ide -d cloud_ide -c "
  SELECT language, status, COUNT(*) FROM builds
  GROUP BY language, status ORDER BY language;
"
```

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `REDIS_URL` | ✅ | — | Redis connection string |
| `JWT_SECRET` | ✅ | — | JWT signing secret (min 32 chars) |
| `SESSION_SECRET` | ✅ | — | Session secret |
| `PORT` | — | `8080` | API server port |
| `NODE_ENV` | — | `production` | Enables secure cookies in production |
| `FRONTEND_URL` | — | `http://localhost` | Frontend base URL (OAuth redirects) |
| `GOOGLE_CLIENT_ID` | — | — | Google OAuth |
| `GITHUB_CLIENT_ID` | — | — | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | — | — | GitHub OAuth client secret |
| `OPENAI_API_KEY` | — | — | AI code assistant |
| `ADMIN_TOKEN` | — | — | Bull Board admin access |
| `ANDROID_HOME` | — | `/opt/android-sdk` | Android SDK path (set in Docker image) |
| `FLUTTER_ROOT` | — | `/opt/flutter` | Flutter SDK path (set in Docker image) |
| `CAPACITOR_TEMPLATE_DIR` | — | `/opt/capacitor-template` | Pre-built Capacitor Android template |
| `LOG_LEVEL` | — | `info` | Logging verbosity |

---

## Troubleshooting

### APK builds fail with "Flutter not found"
```bash
docker compose exec api flutter --version
# If fails: flutter SDK not in image, rebuild with Dockerfile.sdk
docker compose build api
```

### Capacitor builds fail
```bash
docker compose exec api npx cap --version
# If fails: rebuild image, the sdk Dockerfile pre-installs it
docker compose build api --no-cache
```

### Database connection errors
```bash
docker compose exec postgres pg_isready -U ide
# Check DATABASE_URL in .env matches postgres service credentials
```

### Out of disk space
```bash
# APK builds create large temp files
docker system prune -f
docker volume rm cloudide_apk_storage  # clears old APKs (they expire after 30 days anyway)
```

### Build queue stuck
```bash
# Clear the queue
docker compose exec api node -e "
  const { Queue } = require('bullmq');
  const q = new Queue('buildJobs', { connection: { host: 'redis', port: 6379 } });
  q.drain().then(() => console.log('Queue drained'));
"
```

---

## Updating

```bash
git pull
docker compose build api web
docker compose up -d
```

> SDK layers are cached, so rebuilds only recompile the app code (~2-3 min).

---

## Cost Estimates

| Provider | Spec | Est. Monthly | Notes |
|---|---|---|---|
| DigitalOcean | 8 CPU / 16 GB | ~$96/mo | Droplet, add block storage for APKs |
| Hetzner | CCX23 (8 CPU / 16 GB) | ~$35/mo | Best value, EU/US locations |
| AWS EC2 | c6a.2xlarge | ~$220/mo | On-demand, cheaper with reserved |
| Oracle Cloud | A1.Flex (4 CPU / 24 GB) | **Free** | ARM-based free tier (Flutter ARM build) |

> Oracle Cloud Free Tier can run this stack for free. ARM builds work with Flutter.
