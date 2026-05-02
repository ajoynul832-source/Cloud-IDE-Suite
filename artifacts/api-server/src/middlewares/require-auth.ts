/**
 * requireAuth — attach req.user or return 401
 * optionalAuth — attach req.user if token present; never fails
 */
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { logger } from "../lib/logger";

const JWT_SECRET = (() => {
  const s = process.env["JWT_SECRET"] ?? process.env["SESSION_SECRET"];
  if (!s) logger.warn("JWT_SECRET not set — falling back to insecure default");
  return s ?? "dev-jwt-secret-change-in-production";
})();

export interface AuthUser {
  userId: string;
}

// Augment Express Request globally
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

function extractToken(req: Request): string | null {
  const cookie = (req.cookies as Record<string, string | undefined>)?.["auth_token"];
  if (cookie) return cookie;
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: "Authentication required", code: "UNAUTHENTICATED" });
    return;
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
    req.user = { userId: payload.sub };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token", code: "TOKEN_INVALID" });
  }
}

/** Never returns 401 — just populates req.user if token is valid */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
      req.user = { userId: payload.sub };
    } catch {
      // ignore — unauthenticated is fine for this route
    }
  }
  next();
}

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: "7d" });
}

export function setAuthCookie(res: Response, token: string): void {
  res.cookie("auth_token", token, {
    httpOnly: true,
    secure: process.env["NODE_ENV"] === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie("auth_token", { httpOnly: true, sameSite: "lax", path: "/" });
}
