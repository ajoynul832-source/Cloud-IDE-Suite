/**
 * @deprecated  Phase 3 replaced the in-memory job store with the `builds` DB table.
 * This file is kept as an empty stub to avoid breaking any undetected imports.
 * All build logic has moved to:
 *   - lib/build-queue.ts    — BullMQ queue
 *   - workers/buildJob.ts   — job processor
 *   - routes/build.ts       — HTTP routes (status, download, logs, history)
 *   - routes/project-build.ts — /api/build/project route
 */
export {};
