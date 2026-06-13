import express, { type Request, type Response, type NextFunction } from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import compression from "compression";
import * as Sentry from "@sentry/node";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Sentry v9 initialization — auto-instruments via OpenTelemetry.
  // No requestHandler/errorHandler middleware needed in v9.
  Sentry.init({
    dsn: process.env.SENTRY_DSN || "",
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: 0.2,
  });

  app.use(helmet());
  app.use(compression());

  const staticPath = path.resolve(__dirname, "..", "dist", "public");
  app.use(express.static(staticPath));

  app.get("*", (_req: Request, res: Response) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  // Express error-handling middleware (4-arg signature) — captures errors to Sentry
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    Sentry.captureException(err);
    if (process.env.NODE_ENV === "development") {
      console.error(err);
    }
    res.status(500).send("Internal Server Error");
  });

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch((err) => {
  Sentry.captureException(err);
  console.error("Failed to start server:", err.message);
  process.exit(1);
});
