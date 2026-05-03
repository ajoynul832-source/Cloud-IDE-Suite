# CloudIDE — Deployment & Setup Guide

Complete guide to running CloudIDE locally or deploying to production with free services.

---

## Local Development (Your Machine)

### Prerequisites
```bash
Node.js 20+
pnpm 9+
PostgreSQL (or use docker)
Redis (or use docker)
```

### Quick Start

```bash
# 1. Clone and install
git clone <your-repo>
cd cloudide
pnpm install

# 2. Start PostgreSQL + Redis (using Docker)
docker run -d --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16
docker run -d --name redis -p 6379:6379 redis:7-alpine

# 3. Set environment variables
cp artifacts/api-server/.env.example artifacts/api-server/.env
# Edit .env with:
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cloudide
REDIS_URL=redis://localhost:6379
JWT_SECRET=$(openssl rand -hex 32)

# 4. Run migrations
pnpm --filter @workspace/api-server run db:push

# 5. Start both servers
# Terminal 1:
pnpm --filter @workspace/api-server run dev

# Terminal 2:
pnpm --filter @workspace/cloud-ide run dev
```

Access at: `http://localhost:5173/ide/`

---

## Production Deployment

### Architecture Overview

```
Your Domain (e.g., cloudide.yoursite.com)
    ↓
Reverse Proxy (Nginx / Cloudflare / Vercel)
    ├── /api/* → Node.js API Server (8080)
    └── /*    → React Static Files (dist/)
```

---

## Option 1: FREE — Vercel + Railway (Recommended for Beginners)

**Cost: $0 (with limits)**

### Frontend on Vercel (Free)
1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com), click "New Project"
3. Import your repo
4. Set build command: `pnpm --filter @workspace/cloud-ide run build`
5. Set output dir: `artifacts/cloud-ide/dist`
6. Add env var: `VITE_API_BASE=https://your-api.railway.app`
7. Deploy ✅

### Backend on Railway (Free $5/month credit)
1. Go to [railway.app](https://railway.app)
2. Create new project → PostgreSQL (free tier: 5GB)
3. Create new project → Redis (free tier: 100MB)
4. Connect your GitHub repo
5. Add build: `pnpm --filter @workspace/api-server run build`
6. Add start command: `node artifacts/api-server/dist/index.mjs`
7. Set environment variables:
   ```
   DATABASE_URL=<auto-populated by Railway>
   REDIS_URL=<auto-populated by Railway>
   JWT_SECRET=<generate: openssl rand -hex 32>
   PORT=8080
   NODE_ENV=production
   ```
8. Deploy ✅

**Free tier limits:**
- Vercel: unlimited deployments, 100GB/month bandwidth
- Railway: $5/month free credit (usually covers small app)
- PostgreSQL: 5GB storage
- Redis: 100MB storage

---

## Option 2: FREE — Firebase / Supabase + Fly.io

**Cost: $0 (if under free tier)**

### Frontend on Firebase Hosting (Free)
1. `npm install -g firebase-tools`
2. `firebase init hosting`
3. Build: `pnpm --filter @workspace/cloud-ide run build`
4. `firebase deploy`

### Backend on Fly.io (Free tier: 3 shared-cpu instances)
1. Install Fly CLI: `curl https://fly.io/install.sh | sh`
2. Create account: `flyctl auth signup`
3. In `artifacts/api-server/`, create `fly.toml`:
   ```toml
   app = "cloudide-api"
   [build]
   builder = "heroku"
   [env]
   NODE_ENV = "production"
   PORT = "8080"
   [[services]]
   internal_port = 8080
   protocol = "tcp"
   ```
4. `flyctl deploy`
5. Provision PostgreSQL:
   ```bash
   flyctl postgres create --name cloudide-db
   flyctl postgres attach cloudide-db
   ```
6. Provision Redis:
   ```bash
   flyctl redis create
   flyctl redis attach
   ```

**Free tier limits:**
- 3 shared-cpu VMs per organization
- PostgreSQL: ~1GB (Fly Postgres)
- Redis: ~1GB

---

## Option 3: CHEAP (Recommended for Production) — DigitalOcean / Render

**Cost: ~$15-20/month**

### Full Stack on Render.com ($12-20/month)

1. **Database**: Create PostgreSQL instance
   - Plan: "Standard" ($15/month) or "Starter" ($10/month, limited)
   - Save connection string

2. **Redis Cache**: Create Redis instance
   - Plan: "Starter" ($5/month)
   - Save connection string

3. **API Backend**: New Web Service
   - Connect GitHub repo
   - Build command: `pnpm --filter @workspace/api-server run build`
   - Start command: `node artifacts/api-server/dist/index.mjs`
   - Add environment variables from PostgreSQL/Redis above
   - Plan: "Starter" ($7/month)

4. **Frontend**: Static Site
   - Same GitHub repo
   - Build command: `pnpm --filter @workspace/cloud-ide run build`
   - Publish dir: `artifacts/cloud-ide/dist`
   - Plan: Free

5. **Custom Domain**
   - Point DNS to Render
   - All traffic routed through Render's reverse proxy

**Total**: ~$20-30/month (all included)

---

## Option 4: AWS (Most Flexible, ~$20-50/month)

### Architecture
```
Route 53 (DNS)
    ↓
CloudFront (CDN, Free tier: 1GB/month)
    ├── /api/* → API Gateway → Lambda / ECS
    └── /*    → S3 static files
```

### Services
| Service | Free Tier | Cost |
|---|---|---|
| RDS PostgreSQL | 750 hours/month | $0-50/month |
| ElastiCache Redis | None | ~$20/month |
| Elastic Container Service (ECS) | 160 hours/month | $0-20/month |
| S3 + CloudFront | 1GB/month | $0-10/month |

**Setup:**
1. RDS PostgreSQL: Create database instance (free tier: `db.t3.micro`)
2. ElastiCache Redis: Create Redis cluster
3. ECS: Create Docker image, push to ECR, deploy to ECS Fargate
4. S3: Upload `artifacts/cloud-ide/dist/` files
5. CloudFront: Create distribution pointing to S3
6. Route 53: Create DNS records

---

## Option 5: Self-Hosted on VPS ($5-10/month)

### Providers (Pick One)
- **Linode** ($5/month) — [linode.com](https://linode.com)
- **Hetzner** (~$4/month) — [hetzner.com](https://hetzner.com)
- **DigitalOcean Droplet** ($5/month) — [digitalocean.com](https://digitalocean.com)
- **Vultr** ($2.50/month) — [vultr.com](https://vultr.com)

### Setup
```bash
# SSH into your VPS

# 1. Install Node + pnpm
curl -fsSL https://get.pnpm.io/install.sh | sh -
curl -sL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs

# 2. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 3. Start PostgreSQL + Redis
docker run -d --name postgres -e POSTGRES_PASSWORD=yourpass -v postgres_data:/var/lib/postgresql/data -p 5432:5432 postgres:16
docker run -d --name redis -v redis_data:/data -p 6379:6379 redis:7-alpine

# 4. Clone your repo
git clone <your-repo> /app/cloudide
cd /app/cloudide
pnpm install

# 5. Set environment variables
cat > artifacts/api-server/.env << EOF
DATABASE_URL=postgresql://postgres:yourpass@localhost:5432/cloudide
REDIS_URL=redis://localhost:6379
JWT_SECRET=$(openssl rand -hex 32)
NODE_ENV=production
PORT=8080
EOF

# 6. Build and run
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/cloud-ide run build

# 7. Run API with PM2 (keep it running)
sudo npm install -g pm2
pm2 start "node artifacts/api-server/dist/index.mjs" --name cloudide-api
pm2 startup
pm2 save

# 8. Serve frontend with Nginx
sudo apt install nginx
sudo tee /etc/nginx/sites-enabled/cloudide > /dev/null <<'CONF'
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /app/cloudide/artifacts/cloud-ide/dist;
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
CONF

sudo systemctl restart nginx

# 9. Free SSL certificate (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

**Total Cost**: $5-10/month

---

## Recommended Path (Start → Scale)

### Phase 1: Testing (Free)
Use **Vercel + Railway** combination
- Zero setup cost
- Perfect for prototyping
- Easy to upgrade later

### Phase 2: Small Production ($20-30/month)
Use **Render.com**
- All-in-one platform
- Simple deployment
- Good reliability for small teams

### Phase 3: Scale ($50+/month)
Use **AWS** or **Kubernetes**
- Auto-scaling
- Global CDN
- Enterprise features

---

## Environment Variables (What You Need)

### Database
```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

**Providers:**
- Railway: auto-provided
- Supabase: auto-provided
- AWS RDS: manual setup
- Local: `postgresql://postgres:password@localhost:5432/cloudide`

### Redis
```env
REDIS_URL=redis://[:password@]host:port
```

**Providers:**
- Railway: auto-provided
- Render: auto-provided
- Upstash (free tier): `https://...`
- Local: `redis://localhost:6379`

### Application
```env
JWT_SECRET=<64-char random string>
NODE_ENV=production
PORT=8080
CORS_ORIGIN=https://your-frontend-domain.com
```

---

## Database Setup (Postgres)

### Create Database
```sql
CREATE DATABASE cloudide;
\c cloudide
```

### Migrations
```bash
pnpm --filter @workspace/api-server run db:push
```

This creates:
- `users` table
- `projects` table
- `project_versions` table
- `shared_projects` table
- `run_usage` table

### Backup
```bash
# Local backup
pg_dump postgresql://user:pass@host:5432/cloudide > backup.sql

# Restore
psql postgresql://user:pass@host:5432/cloudide < backup.sql
```

---

## Troubleshooting

### "Cannot find module" errors
```bash
pnpm install
pnpm --filter @workspace/api-server run build
```

### "Port already in use"
```bash
lsof -i :8080  # Find what's using it
kill -9 <PID>  # Kill it
```

### "Database connection failed"
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check URL format
# Should be: postgresql://user:password@host:port/database
```

### "Redis connection failed"
```bash
# Test connection
redis-cli ping

# Check URL format
# Should be: redis://[:password@]host:port/0
```

### API working but frontend stuck on "No previewable Apps"
- Check `VITE_API_BASE` env var matches your API URL
- Check CORS headers: API should allow your frontend domain
- Browser console should show CORS errors

---

## Performance Tips

1. **CDN**: Use Cloudflare or CloudFront in front
2. **Caching**: Set long TTL on static files (`artifacts/cloud-ide/dist/`)
3. **Database**: Add indexes on frequently queried columns
4. **Redis**: Use for session storage (already done)
5. **Compression**: Nginx/Cloudflare gzip should be enabled

---

## Security Checklist

- [ ] JWT_SECRET is random + 32+ chars
- [ ] Database password is strong
- [ ] HTTPS enabled (free with Let's Encrypt or Vercel/Railway)
- [ ] CORS_ORIGIN set to your actual domain
- [ ] Environment variables never committed to git
- [ ] Database backups configured
- [ ] Rate limiting enabled (already built-in)
- [ ] SQL injection: using Drizzle ORM (protected)

---

## Monitoring

### Free Options
- **Uptime monitoring**: [UptimeRobot.com](https://uptimerobot.com) — alerts if site goes down
- **Error tracking**: [Sentry.io](https://sentry.io) — free tier catches JavaScript + API errors
- **Logs**: Render/Railway have built-in log viewers

### Setup Sentry
```bash
pnpm add @sentry/node
```

In `artifacts/api-server/src/index.ts`:
```typescript
import * as Sentry from "@sentry/node";

Sentry.init({ dsn: process.env.SENTRY_DSN });
```

---

## Summary: Cheapest Options

| Setup | Frontend | Backend | Database | Redis | Cost |
|---|---|---|---|---|---|
| **Local** | Localhost | Localhost | Docker | Docker | $0 |
| **Vercel + Railway** | Vercel | Railway | Railway | Railway | $0-5 |
| **Render** | Render | Render | Render | Render | $20-30 |
| **VPS** | Nginx | Node | Docker | Docker | $5-10 |

**Pick one based on your comfort level:**
- **No DevOps experience?** → Vercel + Railway
- **Want simplicity?** → Render
- **Want full control?** → VPS
- **Enterprise scale?** → AWS

