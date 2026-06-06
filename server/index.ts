import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import * as Sentry from "@sentry/node";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Sentry Initialization (Updated for Sentry v8+)
  Sentry.init({
    dsn: process.env.SENTRY_DSN || "",
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: 0.2,
  });

  // Security Headers (Task 5)
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }));

  app.use(cors({
    origin: [
      'https://echomenweb-fz7raxkq.manus.space',
      'https://chieji.github.io',
      ...(process.env.NODE_ENV === 'development' ? ['http://localhost:5173'] : []),
    ],
    credentials: true,
  }));

  app.use(compression());

  const staticPath = path.resolve(__dirname, "..", "dist", "public");
  app.use(express.static(staticPath));

  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
