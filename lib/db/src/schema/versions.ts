import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { projectsTable } from "./projects";

/**
 * Stores file snapshots for version history.
 * Up to MAX_VERSIONS_PER_PROJECT rows per project (oldest pruned automatically).
 */
export const versionsTable = pgTable("versions", {
  id:        uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  files:     jsonb("files").notNull().$type<Record<string, string>>(),
  label:     text("label").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const MAX_VERSIONS_PER_PROJECT = 10;

export type Version = typeof versionsTable.$inferSelect;
