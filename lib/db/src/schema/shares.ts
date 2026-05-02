import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { projectsTable } from "./projects";

export const sharesTable = pgTable("shares", {
  shareId: text("share_id").primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projectsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Share = typeof sharesTable.$inferSelect;
