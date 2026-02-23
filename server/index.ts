import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import {
  listRegistry,
  getRegistryEntry,
  searchRegistry,
  getRegistryTags,
} from "./routes/mfe-registry";
import {
  getCountries,
  getCountryById,
  searchCountries,
  getMasterDataHealth,
  triggerSync,
} from "./routes/master-data";
import { initializeMFEFramework } from "@shared/mfe";

export function createServer() {
  const app = express();

  // Initialize MFE Framework
  initializeMFEFramework({
    debug: process.env.NODE_ENV !== "production",
    baseApiUrl: process.env.API_URL || "/api",
  });

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // MFE Registry API routes
  app.get("/api/mfe/registry", listRegistry);
  app.get("/api/mfe/registry/:id", getRegistryEntry);
  app.get("/api/mfe/registry/search", searchRegistry);
  app.get("/api/mfe/tags", getRegistryTags);

  // Master Data API routes
  app.get("/api/master/countries", getCountries);
  app.get("/api/master/countries/:id", getCountryById);
  app.get("/api/master/countries/search", searchCountries);
  app.get("/api/master/health", getMasterDataHealth);
  app.post("/api/master/sync", triggerSync);

  return app;
}
