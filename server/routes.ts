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

  // Download extension files
  app.get("/api/download-extension", (req, res) => {
    const path = require('path');
    const fs = require('fs');
    
    try {
      const extensionDir = path.join(process.cwd(), 'extension');
      
      // Set headers for zip download
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="claritylog-extension.zip"');
      
      // Create a simple zip-like response with all files
      const files = fs.readdirSync(extensionDir);
      let zipContent = '';
      
      files.forEach(file => {
        const filePath = path.join(extensionDir, file);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        zipContent += `--- ${file} ---\n${fileContent}\n\n`;
      });
      
      res.send(zipContent);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create extension download' });
    }
  });

  // Since we're using Firebase for all data operations,
  // the main API routes are handled client-side with Firebase SDK
  // This server primarily serves the frontend and provides health checks

  const httpServer = createServer(app);

  return httpServer;
}
