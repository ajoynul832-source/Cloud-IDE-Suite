/**
 * Authentication routes
 *
 * POST /api/auth/register          — email + password → creates user, sets cookie
 * POST /api/auth/login             — email + password → verifies, sets cookie
 * POST /api/auth/google            — Google idToken  → upserts user, sets cookie
 * GET  /api/auth/github            — redirect to GitHub OAuth
 * GET  /api/auth/github/callback   — handle GitHub OAuth callback
 * POST /api/auth/logout            — clears cookie
 * GET  /api/auth/me                — returns current user (requires cookie)
 */
import { Router } from "express";
import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";
import { eq, or } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { logger } from "../lib/logger";
import { requireAuth, signToken, setAuthCookie, clearAuthCookie } from "../middlewares/require-auth";

const router = Router();

const BCRYPT_ROUNDS = 12;
const GOOGLE_CLIENT_ID = process.env["GOOGLE_CLIENT_ID"] ?? "";
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

const GITHUB_CLIENT_ID     = process.env["GITHUB_CLIENT_ID"] ?? "";
const GITHUB_CLIENT_SECRET = process.env["GITHUB_CLIENT_SECRET"] ?? "";

function getBaseUrl(req: import("express").Request): string {
  const proto  = (req.headers["x-forwarded-proto"] as string) ?? req.protocol ?? "https";
  const host   = (req.headers["x-forwarded-host"] as string) ?? req.headers.host ?? "";
  return `${proto}://${host}`;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function safeUser(user: { id: string; email: string; oauthProvider: string | null }) {
  return { userId: user.id, email: user.email, oauthProvider: user.oauthProvider };
}

function validateEmail(email: unknown): string | null {
  if (typeof email !== "string") return null;
  const trimmed = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return null;
  return trimmed;
}

function validatePassword(password: unknown): string | null {
  if (typeof password !== "string" || password.length < 8) return null;
  if (password.length > 128) return null;
  return password;
}

// ─── POST /api/auth/register ─────────────────────────────────────────────────

router.post("/auth/register", async (req, res) => {
  const email    = validateEmail((req.body as Record<string, unknown>)["email"]);
  const password = validatePassword((req.body as Record<string, unknown>)["password"]);

  if (!email)    { res.status(400).json({ error: "Valid email is required" }); return; }
  if (!password) { res.status(400).json({ error: "Password must be 8–128 characters" }); return; }

  try {
    const existing = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (existing.length > 0) {
      res.status(409).json({ error: "An account with this email already exists" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const [user] = await db
      .insert(usersTable)
      .values({ email, passwordHash })
      .returning({ id: usersTable.id, email: usersTable.email, oauthProvider: usersTable.oauthProvider });

    const token = signToken(user.id);
    setAuthCookie(res, token);
    logger.info({ userId: user.id }, "user registered");

    res.status(201).json({ user: safeUser(user), token });
  } catch (err) {
    logger.error({ err }, "register failed");
    res.status(500).json({ error: "Registration failed — please try again" });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

router.post("/auth/login", async (req, res) => {
  const email    = validateEmail((req.body as Record<string, unknown>)["email"]);
  const password = validatePassword((req.body as Record<string, unknown>)["password"]);

  if (!email)    { res.status(400).json({ error: "Valid email is required" }); return; }
  if (!password) { res.status(400).json({ error: "Password is required" }); return; }

  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (!user || !user.passwordHash) {
      // Timing-safe: still hash to prevent user enumeration
      await bcrypt.hash("dummy", 4);
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = signToken(user.id);
    setAuthCookie(res, token);
    logger.info({ userId: user.id }, "user logged in");

    res.json({ user: safeUser(user), token });
  } catch (err) {
    logger.error({ err }, "login failed");
    res.status(500).json({ error: "Login failed — please try again" });
  }
});

// ─── POST /api/auth/google ────────────────────────────────────────────────────

router.post("/auth/google", async (req, res) => {
  if (!googleClient) {
    res.status(501).json({ error: "Google OAuth is not configured on this server" });
    return;
  }

  const idToken = (req.body as Record<string, unknown>)["idToken"];
  if (typeof idToken !== "string" || !idToken) {
    res.status(400).json({ error: "idToken is required" });
    return;
  }

  try {
    const ticket  = await googleClient.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();

    if (!payload?.sub || !payload.email) {
      res.status(401).json({ error: "Invalid Google token" });
      return;
    }

    const email   = payload.email.toLowerCase();
    const oauthId = payload.sub;

    // Find existing user by oauth_id or email
    let [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.oauthId, oauthId))
      .limit(1);

    if (!user) {
      // Try by email (user may have registered with email before)
      [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    }

    if (!user) {
      // Create new OAuth user
      [user] = await db
        .insert(usersTable)
        .values({ email, oauthProvider: "google", oauthId })
        .returning();
      logger.info({ userId: user.id }, "google user created");
    } else if (!user.oauthId) {
      // Link Google to existing email account
      await db
        .update(usersTable)
        .set({ oauthProvider: "google", oauthId })
        .where(eq(usersTable.id, user.id));
      logger.info({ userId: user.id }, "google linked to existing account");
    }

    const token = signToken(user.id);
    setAuthCookie(res, token);
    res.json({ user: safeUser(user), token });
  } catch (err) {
    logger.error({ err }, "google oauth failed");
    res.status(401).json({ error: "Google authentication failed" });
  }
});

// ─── GET /api/auth/github ─────────────────────────────────────────────────────
// Redirects user to GitHub OAuth authorization page

router.get("/auth/github", (req, res) => {
  if (!GITHUB_CLIENT_ID) {
    res.status(503).json({ error: "GitHub OAuth not configured (GITHUB_CLIENT_ID missing)" });
    return;
  }
  const callbackUrl = `${getBaseUrl(req)}/api/auth/github/callback`;
  const params = new URLSearchParams({
    client_id:    GITHUB_CLIENT_ID,
    redirect_uri:  callbackUrl,
    scope:         "read:user user:email",
    allow_signup:  "true",
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
});

// ─── GET /api/auth/github/callback ───────────────────────────────────────────

router.get("/auth/github/callback", async (req, res) => {
  const code  = (req.query as Record<string, string>)["code"]  ?? "";
  const error = (req.query as Record<string, string>)["error"] ?? "";

  const frontendBase = process.env["FRONTEND_URL"] ?? getBaseUrl(req);
  const failUrl      = `${frontendBase}/auth?error=github_failed`;

  if (error || !code) {
    logger.warn({ error }, "github oauth denied by user");
    res.redirect(failUrl);
    return;
  }

  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    res.redirect(failUrl);
    return;
  }

  try {
    // 1. Exchange code for access token
    const callbackUrl = `${getBaseUrl(req)}/api/auth/github/callback`;
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Accept":       "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id:     GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri:  callbackUrl,
      }),
    });
    const tokenData = await tokenRes.json() as { access_token?: string; error?: string };
    if (!tokenData.access_token) throw new Error(tokenData.error ?? "No access token");

    // 2. Get GitHub user info
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        "Authorization": `Bearer ${tokenData.access_token}`,
        "Accept":        "application/vnd.github.v3+json",
      },
    });
    const ghUser = await userRes.json() as {
      id?: number; login?: string; name?: string; email?: string | null;
    };

    // 3. Get primary email if not public
    let email = ghUser.email ?? null;
    if (!email) {
      const emailsRes = await fetch("https://api.github.com/user/emails", {
        headers: { "Authorization": `Bearer ${tokenData.access_token}`, "Accept": "application/vnd.github.v3+json" },
      });
      const emails = await emailsRes.json() as { email: string; primary: boolean; verified: boolean }[];
      email = emails.find((e) => e.primary && e.verified)?.email
           ?? emails.find((e) => e.verified)?.email
           ?? null;
    }

    if (!email || !ghUser.id) throw new Error("Could not get email from GitHub");

    const oauthId = `github:${ghUser.id}`;

    // 4. Upsert user in database
    let [user] = await db
      .select()
      .from(usersTable)
      .where(or(eq(usersTable.oauthId, oauthId), eq(usersTable.email, email)))
      .limit(1);

    if (!user) {
      [user] = await db
        .insert(usersTable)
        .values({ email, oauthProvider: "github", oauthId })
        .returning();
      logger.info({ userId: user.id }, "github user created");
    } else if (!user.oauthId) {
      await db
        .update(usersTable)
        .set({ oauthProvider: "github", oauthId })
        .where(eq(usersTable.id, user.id));
      logger.info({ userId: user.id }, "github linked to existing account");
    }

    const token = signToken(user.id);
    setAuthCookie(res, token);
    res.redirect(`${frontendBase}/ide?github=ok`);
  } catch (err) {
    logger.error({ err }, "github oauth callback failed");
    res.redirect(failUrl);
  }
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────

router.post("/auth/logout", (req, res) => {
  clearAuthCookie(res);
  res.json({ success: true });
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────

router.get("/auth/me", requireAuth, async (req, res) => {
  try {
    const [user] = await db
      .select({ id: usersTable.id, email: usersTable.email, oauthProvider: usersTable.oauthProvider })
      .from(usersTable)
      .where(eq(usersTable.id, req.user!.userId))
      .limit(1);

    if (!user) {
      clearAuthCookie(res);
      res.status(401).json({ error: "User not found", code: "UNAUTHENTICATED" });
      return;
    }

    res.json({ user: safeUser(user) });
  } catch (err) {
    logger.error({ err }, "auth/me failed");
    res.status(500).json({ error: "Failed to load user" });
  }
});

export default router;
