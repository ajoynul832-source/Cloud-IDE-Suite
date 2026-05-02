import { pgTable, text, timestamp, uuid, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const projectsTable = pgTable("projects", {
  id:          uuid("id").primaryKey().defaultRandom(),
  // Legacy anonymous identity — kept for backward-compat, set to userId for new auth'd projects
  userKey:     text("user_key").notNull(),
  // FK to authenticated user — nullable so existing rows are not broken
  userId:      uuid("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  name:        text("name").notNull(),
  projectType: text("project_type").notNull().default("javascript"),
  files:       jsonb("files").notNull().$type<Record<string, string>>(),
  createdAt:   timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:   timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => [
  index("projects_user_id_idx").on(t.userId),
  index("projects_updated_at_idx").on(t.updatedAt),
]);

export const insertProjectSchema = createInsertSchema(projectsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project       = typeof projectsTable.$inferSelect;
