import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Registered users — created on email/password registration or OAuth sign-in.
 * password_hash is null for OAuth-only accounts.
 * oauth_id is null for email/password accounts.
 */
export const usersTable = pgTable("users", {
  id:            uuid("id").primaryKey().defaultRandom(),
  email:         text("email").notNull().unique(),
  passwordHash:  text("password_hash"),
  oauthProvider: text("oauth_provider"), // 'google' | null
  oauthId:       text("oauth_id"),
  createdAt:     timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:     timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type User = typeof usersTable.$inferSelect;
