import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { globalLimiter } from "./middlewares/rate-limit";

const app: Express = express();

// ─── Security headers ─────────────────────────────────────────────────────────
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'",
  );
  if (process.env["NODE_ENV"] === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});

// ─── CORS ────────────────────────────────────────────────────────────────────
// In production allow only REPLIT_DOMAINS; in dev allow all (proxy iframe).
const replitDomains = (process.env["REPLIT_DOMAINS"] ?? "")
  .split(",")
  .map((d) => d.trim())
  .filter(Boolean);

const allowedOrigins = new Set<string>([
  ...replitDomains.flatMap((d) => [`https://${d}`, `http://${d}`]),
  // Local dev (Vite / preview)
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5174",
]);

app.use(
  cors({
    origin: (origin, cb) => {
      // No origin = same-origin or non-browser (curl / tests) — allow
      if (!origin) return cb(null, true);
      if (allowedOrigins.has(origin)) return cb(null, true);
      // Replit preview subdomains: *.replit.dev / *.repl.co / *.replit.app
      if (/\.(replit\.dev|repl\.co|replit\.app)$/.test(origin)) return cb(null, true);
      // Propagate error — Express will send 500; rate-limiting already handles abuse
      return cb(null, false);
    },
    credentials: true,
  }),
);

// ─── Response compression ─────────────────────────────────────────────────────
// Skip SSE streams (text/event-stream) — they must not be buffered/compressed.
app.use(compression({
  filter: (req, res) => {
    if (res.getHeader("Content-Type") === "text/event-stream") return false;
    return compression.filter(req, res);
  },
}));

// ─── Global per-IP rate limit ──────────────────────────────────────────────────
app.use(globalLimiter);

// ─── Body parsing & cookies ────────────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) { return { id: req.id, method: req.method, url: req.url?.split("?")[0] }; },
      res(res) { return { statusCode: res.statusCode }; },
    },
  }),
);
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// ─── API routes ───────────────────────────────────────────────────────────────
app.use("/api", router);

export default app;
