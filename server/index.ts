import express from "express";
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

  app.use(helmet());
  app.use(compression());

  Sentry.init({
    dsn: process.env.SENTRY_DSN || "",
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: 0.2,
  });
  app.use(Sentry.Handlers.requestHandler());

  const staticPath = path.resolve(__dirname, "..", "dist", "public");
  app.use(express.static(staticPath));

  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  app.use(Sentry.Handlers.errorHandler());

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
