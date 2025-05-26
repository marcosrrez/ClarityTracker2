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

  // Download browser extension as zip
  app.get("/api/download-extension", (req, res) => {
    const path = require('path');
    const fs = require('fs');
    const archiver = require('archiver');
    
    try {
      const extensionDir = path.join(process.cwd(), 'extension');
      
      // Set headers for zip download
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="claritylog-browser-extension.zip"');
      
      // Create archiver instance
      const archive = archiver('zip', { zlib: { level: 9 } });
      
      // Handle archiver errors
      archive.on('error', (err) => {
        res.status(500).json({ error: 'Failed to create zip file' });
      });
      
      // Pipe archive data to response
      archive.pipe(res);
      
      // Add all files from extension directory
      archive.directory(extensionDir, false);
      
      // Finalize the archive
      archive.finalize();
      
    } catch (error) {
      console.error('Extension download error:', error);
      res.status(500).json({ error: 'Failed to create extension download' });
    }
  });

  // Since we're using Firebase for all data operations,
  // the main API routes are handled client-side with Firebase SDK
  // This server primarily serves the frontend and provides health checks

  const httpServer = createServer(app);

  return httpServer;
}
