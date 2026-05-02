import { pgTable, text, timestamp, uuid, integer, primaryKey, index } from "drizzle-orm/pg-core";
import { projectsTable } from "./projects";

export const sharesTable = pgTable("shares", {
  shareId:    text("share_id").primaryKey(),
  projectId:  uuid("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  createdAt:  timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  totalViews: integer("total_views").notNull().default(0),
  uniqueViews: integer("unique_views").notNull().default(0),
  forksCount: integer("forks_count").notNull().default(0),
  runsCount:  integer("runs_count").notNull().default(0),
}, (t) => [
  index("shares_project_id_idx").on(t.projectId),
]);

/**
 * Tracks which viewer keys have seen a share (for unique-view deduplication).
 * viewer_key is a 16-char hex SHA-256 prefix of the requester's IP address.
 * Composite PK prevents double-counting.
 */
export const shareViewersTable = pgTable(
  "share_viewers",
  {
    shareId:   text("share_id").notNull().references(() => sharesTable.shareId, { onDelete: "cascade" }),
    viewerKey: text("viewer_key").notNull(),
    seenAt:    timestamp("seen_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.shareId, t.viewerKey] })],
);

export type Share        = typeof sharesTable.$inferSelect;
export type ShareViewer  = typeof shareViewersTable.$inferSelect;
