import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import apiRouter from "./routes/index.routes.js";
import { environment } from "./config/environment.js";

// Initialize Express app
const app = express();

// Accept credentialed requests only from the configured frontend origins.
const allowedOrigins = environment.CLIENT_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Request origin is not allowed"));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Render uses this endpoint to confirm that the API process is ready to receive traffic.
app.get("/health", (_req, res) => res.status(200).json({ ready: true }));
app.use("/api", apiRouter);

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const frontendBuildPath = resolve(currentDirectory, "../../UI/zenvork-ui/dist/zenvork-ui/browser");

if (environment.NODE_ENV === "production" && existsSync(frontendBuildPath)) {
  // Serve the Angular application and preserve client-side routes after a page refresh.
  app.use(express.static(frontendBuildPath));
  app.get(/^(?!\/api(?:\/|$)).*/, (_req, res) => {
    res.sendFile(resolve(frontendBuildPath, "index.html"));
  });
}

export default app;
