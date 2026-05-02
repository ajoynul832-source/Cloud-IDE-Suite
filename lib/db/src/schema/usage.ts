import { pgTable, varchar, integer, primaryKey } from "drizzle-orm/pg-core";

/**
 * Persistent per-user daily usage counters.
 * PK: (user_key, date) — one row per user per calendar day (UTC).
 */
export const usageTable = pgTable(
  "usage",
  {
    userKey:     varchar("user_key",     { length: 64 }).notNull(),
    date:        varchar("date",         { length: 10 }).notNull(), // YYYY-MM-DD UTC
    runsCount:   integer("runs_count").notNull().default(0),
    buildsCount: integer("builds_count").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.userKey, t.date] })],
);

export type UsageRow = typeof usageTable.$inferSelect;
