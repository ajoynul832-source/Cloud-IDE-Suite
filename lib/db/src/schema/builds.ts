import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { projectsTable } from "./projects";

/**
 * Persistent build job records — replaces the old in-memory job store.
 * Survives server restarts. APK path stored here for download after restart.
 *
 * Status lifecycle:
 *   queued → building → complete
 *                     ↘ failed-will-retry → building (retry)
 *                     ↘ failed
 */
export const buildsTable = pgTable("builds", {
  id:            uuid("id").primaryKey().defaultRandom(),
  userId:        uuid("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  projectId:     uuid("project_id").references(() => projectsTable.id, { onDelete: "set null" }),
  language:      text("language").notNull().default("flutter"),

  // queued | building | failed-will-retry | complete | failed
  status:        text("status").notNull().default("queued"),
  stage:         text("stage"),

  queuePosition: integer("queue_position").notNull().default(0),
  logText:       text("log_text").notNull().default(""),
  apkPath:       text("apk_path"),
  apkSize:       integer("apk_size"),

  // ── Phase 5: resilience ────────────────────────────────────────────────────
  errorMessage:  text("error_message"),
  errorType:     text("error_type"),           // 'retriable' | 'permanent' | 'system'
  retryCount:    integer("retry_count").notNull().default(0),
  lastErrorAt:   timestamp("last_error_at",   { withTimezone: true }),

  // ── Snack-preview extras (react-native builds) ────────────────────────────
  previewUrl:    text("preview_url"),
  embedUrl:      text("embed_url"),
  qrUrl:         text("qr_url"),

  createdAt:     timestamp("created_at",   { withTimezone: true }).notNull().defaultNow(),
  completedAt:   timestamp("completed_at", { withTimezone: true }),
});

export type Build          = typeof buildsTable.$inferSelect;
export type BuildStatus    = "queued" | "building" | "failed-will-retry" | "complete" | "failed";
export type BuildErrorType = "retriable" | "permanent" | "system";
export type BuildStage     = "uploading" | "extracting" | "running-pub-get" | "building-apk" | "packaging";
export type BuildLanguage  = "flutter" | "react-native" | "android";
