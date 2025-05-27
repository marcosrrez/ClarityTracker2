import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import { sendFeedbackNotification } from "./email";
import { storage } from "./storage";

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

  // Feedback submission endpoint
  app.post("/api/feedback", express.json(), async (req, res) => {
    try {
      const { type, subject, description, email, userId } = req.body;
      
      // Validate required fields
      if (!type || !subject || !description) {
        return res.status(400).json({ 
          error: "Missing required fields: type, subject, description" 
        });
      }

      // Store feedback in database for future reference
      const savedFeedback = await storage.createFeedback({
        type,
        subject,
        description,
        email,
        userId
      });

      // Send email notification
      const emailSent = await sendFeedbackNotification({
        type,
        subject,
        description,
        userEmail: email,
        userId,
        timestamp: new Date()
      });

      if (emailSent && savedFeedback) {
        res.json({ 
          success: true, 
          message: "Feedback submitted successfully",
          feedbackId: savedFeedback.id
        });
      } else {
        res.status(500).json({ 
          error: "Failed to process feedback submission" 
        });
      }

    } catch (error) {
      console.error("Feedback submission error:", error);
      res.status(500).json({ 
        error: "Internal server error" 
      });
    }
  });

  // Admin endpoints for feedback management
  app.get("/api/admin/feedback", async (req, res) => {
    try {
      const feedback = await storage.getFeedback();
      res.json(feedback);
    } catch (error) {
      console.error("Failed to fetch feedback:", error);
      res.status(500).json({ error: "Failed to fetch feedback" });
    }
  });

  app.patch("/api/admin/feedback/:id/status", express.json(), async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      await storage.updateFeedbackStatus(id, status);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to update feedback status:", error);
      res.status(500).json({ error: "Failed to update status" });
    }
  });

  // Since we're using Firebase for all data operations,
  // the main API routes are handled client-side with Firebase SDK
  // This server primarily serves the frontend and provides health checks

  const httpServer = createServer(app);

  return httpServer;
}
