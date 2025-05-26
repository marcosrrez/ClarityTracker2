import type { Express } from "express";
import { createServer, type Server } from "http";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development"
    });
  });

  // Since we're using Firebase for all data operations,
  // the main API routes are handled client-side with Firebase SDK
  // This server primarily serves the frontend and provides health checks

  const httpServer = createServer(app);

  return httpServer;
}
