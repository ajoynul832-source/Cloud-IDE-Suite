import app from "./app";
import { logger } from "./lib/logger";
import { ensureRedis, shutdownRedis } from "./lib/redis";
import { startWorker, shutdownQueue } from "./lib/queue";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function main() {
  // Start Redis then the BullMQ worker before accepting requests
  await ensureRedis();
  await startWorker();

  const server = app.listen(port, (err?: Error) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "Server listening");
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, "shutting down");
    server.close(async () => {
      await shutdownQueue();
      await shutdownRedis();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000);
  };

  process.on("SIGTERM", () => { void shutdown("SIGTERM"); });
  process.on("SIGINT",  () => { void shutdown("SIGINT"); });
}

main().catch((err) => {
  logger.error({ err }, "fatal startup error");
  process.exit(1);
});
