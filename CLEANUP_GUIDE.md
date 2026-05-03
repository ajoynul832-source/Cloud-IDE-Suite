# CloudIDE — Safe Cleanup Guide

How to shrink your project by removing unnecessary files.

---

## Size Breakdown

```
524 MB  — Root node_modules (dependencies installed)
200 MB  — artifacts/api-server/node_modules
19 MB   — artifacts/cloud-ide/node_modules
2.7 MB  — artifacts/mockup-sandbox/node_modules
252 KB  — pnpm-lock.yaml (DO NOT DELETE)
100 MB  — artifacts/api-server/dist (built files)
50 MB   — .git (version control history)
```

**Total:** ~950 MB (before cleanup)  
**After cleanup:** ~50-100 MB (source code only)

---

## SAFE TO DELETE ✅

### 1. All `node_modules` directories (726 MB saved!)

```bash
# Delete all node_modules
rm -rf node_modules
rm -rf artifacts/*/node_modules
rm -rf packages/*/node_modules
```

**Why safe:** These are auto-generated from `pnpm-lock.yaml`. Reinstall with:
```bash
pnpm install
```

---

### 2. Build artifacts (100 MB saved)

```bash
# Delete compiled output
rm -rf artifacts/api-server/dist
rm -rf artifacts/cloud-ide/dist
rm -rf artifacts/mockup-sandbox/dist
```

**Why safe:** These are generated from source code. Rebuild with:
```bash
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/cloud-ide run build
```

---

### 3. Cache directories (50 MB saved)

```bash
# Delete caches
rm -rf .cache
rm -rf .local
rm -rf .agents
rm -rf .upm
rm -rf artifacts/*/.turbo
```

**Why safe:** These are temporary build caches. They'll be recreated automatically.

---

### 4. Optional: Screenshots/Assets (5 MB saved)

```bash
# If you don't need the attached screenshots
rm -rf attached_assets
```

**Why safe:** Screenshots are just for reference. Keep if you want to remember how the app looked.

---

## DO NOT DELETE ⛔

### Keep these (critical)
```
✓ artifacts/*/src/**/*.ts*      — Source code
✓ artifacts/*/src/**/*.tsx      — React components
✓ artifacts/*/vite.config.ts    — Build config
✓ packages/api-client-react/    — Shared code
✓ pnpm-lock.yaml                — Dependency lock file
✓ package.json                  — Workspace config
✓ pnpm-workspace.yaml           — Monorepo config
✓ tsconfig.json                 — TypeScript config
✓ .replit                        — Replit config
✓ .git/                          — Version control (optional, can delete if not needed)
```

### Keep these (documentation)
```
✓ README.md                     — Main docs
✓ DEPLOYMENT_GUIDE.md           — How to deploy
✓ FUNCTION_CATALOG.md           — Function reference
✓ replit.md                     — Session notes
✓ RUNBOOK.md                    — Instructions
```

---

## Cleanup Script (Do This)

Run this to remove everything safe:

```bash
#!/bin/bash

echo "🧹 Cleaning up CloudIDE project..."

# Remove node_modules
echo "Removing node_modules (526 MB)..."
rm -rf node_modules
rm -rf artifacts/*/node_modules
rm -rf packages/*/node_modules

# Remove build artifacts
echo "Removing dist folders (100 MB)..."
rm -rf artifacts/*/dist

# Remove caches
echo "Removing caches (50 MB)..."
rm -rf .cache
rm -rf .local
rm -rf .agents
rm -rf .upm
rm -rf artifacts/*/.turbo
find . -name ".DS_Store" -delete
find . -name "*.log" -delete

echo "✅ Cleanup complete!"
echo ""
echo "Project size reduced. To restore:"
echo "  pnpm install"
echo "  pnpm --filter @workspace/api-server run build"
echo "  pnpm --filter @workspace/cloud-ide run build"
```

Save this as `cleanup.sh` and run:
```bash
chmod +x cleanup.sh
./cleanup.sh
```

---

## Restore After Cleanup

```bash
# Reinstall dependencies
pnpm install

# Rebuild everything
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/cloud-ide run build

# Start development
pnpm --filter @workspace/api-server run dev  # Terminal 1
pnpm --filter @workspace/cloud-ide run dev   # Terminal 2
```

---

## Size Comparison

| State | Size | What's Included |
|---|---|---|
| **Fresh clone** | 1.0 GB | node_modules + dist |
| **After cleanup** | ~70 MB | Source code only |
| **In production** | ~50 MB | Minified + production builds |

---

## What Each Directory Contains

### Keep (Source Code)
```
artifacts/api-server/src/          ← Backend source code (essential)
artifacts/cloud-ide/src/           ← Frontend source code (essential)
artifacts/mockup-sandbox/src/      ← Component preview source (optional)
packages/api-client-react/         ← Shared API client (essential)
```

### Safe to Delete (Auto-Generated)
```
artifacts/api-server/node_modules/ ← Dependencies (reinstall with pnpm)
artifacts/api-server/dist/         ← Compiled JavaScript (rebuild with pnpm)
.cache/                            ← Build cache (recreated on next build)
.local/                            ← Temporary files
.agents/                           ← Replit internal (auto-generated)
.turbo/                            ← Turbo cache (recreated on next build)
```

### Documentation (Keep Unless You Don't Need)
```
README.md                          ← Main documentation
DEPLOYMENT_GUIDE.md                ← Deployment instructions
FUNCTION_CATALOG.md                ← All functions A-Z
RUNBOOK.md                         ← Runbook
replit.md                          ← Session notes
CHANGELOG.md                       ← Change history
```

---

## Before Uploading/Sharing

```bash
# Final cleanup before ZIP/upload
./cleanup.sh

# Optional: Remove Git history if file size still matters
rm -rf .git
rm -rf .github

# Create ZIP for distribution
zip -r cloudide-source.zip . -x "node_modules/*" "dist/*" ".cache/*"

# Check size
du -sh cloudide-source.zip
```

---

## Summary

**Minimum safe cleanup (most impact):**
```bash
rm -rf node_modules artifacts/*/node_modules artifacts/*/dist
```

**Aggressive cleanup (maximum shrinkage):**
```bash
rm -rf node_modules artifacts/*/node_modules artifacts/*/dist .cache .local .agents .upm .git
```

**For distribution:**
- Delete: `node_modules/`, `dist/`, `.cache/`, `.git/`
- Keep: Source code, config files, documentation
- Result: ~50-70 MB ZIP file

