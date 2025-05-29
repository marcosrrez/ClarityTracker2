import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import { sendFeedbackNotification } from "./email";
import { storage } from "./storage";
import { handleTwilioWebhook } from "./sms-service";

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

  // SMS webhook endpoint for text-to-entry feature
  app.post('/api/sms/webhook', express.urlencoded({ extended: false }), handleTwilioWebhook);

  // Analytics endpoints
  app.get("/api/admin/analytics", async (req, res) => {
    try {
      const analytics = await storage.getAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  app.post("/api/analytics/track", express.json(), async (req, res) => {
    try {
      const { userId, sessionId, event, page, metadata } = req.body;
      
      await storage.trackUserEvent({
        userId,
        sessionId,
        event,
        page,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to track event:", error);
      res.status(500).json({ error: "Failed to track event" });
    }
  });

  // Supervision API endpoints
  app.post("/api/supervision/relationships", express.json(), async (req, res) => {
    try {
      const relationship = await storage.createSuperviseeRelationship(req.body);
      res.json(relationship);
    } catch (error) {
      console.error("Error creating supervisee relationship:", error);
      res.status(500).json({ error: "Failed to create supervisee relationship" });
    }
  });

  app.get("/api/supervision/relationships/:supervisorId", async (req, res) => {
    try {
      const relationships = await storage.getSuperviseeRelationships(req.params.supervisorId);
      res.json(relationships);
    } catch (error) {
      console.error("Error fetching supervisee relationships:", error);
      res.status(500).json({ error: "Failed to fetch supervisee relationships" });
    }
  });

  app.patch("/api/supervision/relationships/:id", express.json(), async (req, res) => {
    try {
      await storage.updateSuperviseeRelationship(req.params.id, req.body);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating supervisee relationship:", error);
      res.status(500).json({ error: "Failed to update supervisee relationship" });
    }
  });

  app.post("/api/supervision/sessions", express.json(), async (req, res) => {
    try {
      const session = await storage.createSupervisionSession(req.body);
      res.json(session);
    } catch (error) {
      console.error("Error creating supervision session:", error);
      res.status(500).json({ error: "Failed to create supervision session" });
    }
  });

  app.get("/api/supervision/sessions/:supervisorId", async (req, res) => {
    try {
      const { superviseeId } = req.query;
      const sessions = await storage.getSupervisionSessions(
        req.params.supervisorId, 
        superviseeId as string
      );
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching supervision sessions:", error);
      res.status(500).json({ error: "Failed to fetch supervision sessions" });
    }
  });

  app.patch("/api/supervision/sessions/:id", express.json(), async (req, res) => {
    try {
      await storage.updateSupervisionSession(req.params.id, req.body);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating supervision session:", error);
      res.status(500).json({ error: "Failed to update supervision session" });
    }
  });

  app.post("/api/supervision/assessments", express.json(), async (req, res) => {
    try {
      const assessment = await storage.createCompetencyAssessment(req.body);
      res.json(assessment);
    } catch (error) {
      console.error("Error creating competency assessment:", error);
      res.status(500).json({ error: "Failed to create competency assessment" });
    }
  });

  app.get("/api/supervision/assessments/:supervisorId", async (req, res) => {
    try {
      const { superviseeId } = req.query;
      const assessments = await storage.getCompetencyAssessments(
        req.params.supervisorId,
        superviseeId as string
      );
      res.json(assessments);
    } catch (error) {
      console.error("Error fetching competency assessments:", error);
      res.status(500).json({ error: "Failed to fetch competency assessments" });
    }
  });

  app.get("/api/supervision/compliance/:supervisorId", async (req, res) => {
    try {
      const compliance = await storage.getSupervisionCompliance(req.params.supervisorId);
      res.json(compliance);
    } catch (error) {
      console.error("Error fetching supervision compliance:", error);
      res.status(500).json({ error: "Failed to fetch supervision compliance" });
    }
  });

  app.get("/api/supervision/progress/:superviseeId", async (req, res) => {
    try {
      const progress = await storage.getSuperviseeProgress(req.params.superviseeId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching supervisee progress:", error);
      res.status(500).json({ error: "Failed to fetch supervisee progress" });
    }
  });

  // Since we're using Firebase for all data operations,
  // the main API routes are handled client-side with Firebase SDK
  // This server primarily serves the frontend and provides health checks

  const httpServer = createServer(app);

  return httpServer;
}
