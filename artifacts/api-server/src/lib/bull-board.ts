/**
 * Bull Board admin dashboard — mounts at /api/admin/queues
 *
 * Protected by HTTP Basic Auth.
 * Credentials: any username + password matching ADMIN_TOKEN env var.
 * Falls back to SESSION_SECRET if ADMIN_TOKEN is not set.
 * If neither is set the board is open (development only).
 */
import { createBullBoard }   from "@bull-board/api";
import { BullMQAdapter }     from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter }    from "@bull-board/express";
import type { Express, Request, Response, NextFunction } from "express";
import { logger }            from "./logger";
import { getQueue }          from "./queue";
import { getBuildQueue }     from "./build-queue";

const BOARD_PATH = "/api/admin/queues";

/** Very simple Basic-Auth gate for the board. */
function makeAuthMiddleware() {
  const secret = process.env["ADMIN_TOKEN"] ?? process.env["SESSION_SECRET"] ?? "";

  if (!secret) {
    logger.warn("Bull Board: no ADMIN_TOKEN or SESSION_SECRET set — dashboard is open");
    return (_req: Request, _res: Response, next: NextFunction) => next();
  }

  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers["authorization"] ?? "";

    // Support both "Basic <b64>" and "Bearer <token>"
    let provided = "";
    if (authHeader.startsWith("Basic ")) {
      const decoded = Buffer.from(authHeader.slice(6), "base64").toString();
      provided = decoded.includes(":") ? decoded.split(":").slice(1).join(":") : decoded;
    } else if (authHeader.startsWith("Bearer ")) {
      provided = authHeader.slice(7);
    }

    if (provided === secret) {
      return next();
    }

    res.set("WWW-Authenticate", 'Basic realm="Bull Board Admin"');
    res.status(401).send("Unauthorized — provide ADMIN_TOKEN as Basic Auth password");
  };
}

export function mountAdminBoard(app: Express): void {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath(BOARD_PATH);

  createBullBoard({
    queues: [
      new BullMQAdapter(getQueue()),
      new BullMQAdapter(getBuildQueue()),
    ],
    serverAdapter,
    options: {
      uiConfig: {
        boardTitle: "Cloud IDE Queues",
      },
    },
  });

  app.use(BOARD_PATH, makeAuthMiddleware(), serverAdapter.getRouter());

  logger.info({ path: BOARD_PATH }, "Bull Board admin dashboard mounted");
}
