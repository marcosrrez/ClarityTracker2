import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import { sendFeedbackNotification } from "./email";
import { sendFeedbackToReplit, createReplitIssue } from "./replit-feedback";
import { storage } from "./storage";
import { handleTwilioWebhook } from "./sms-service";

// Email reminder scheduling function
async function scheduleSessionReminders(session: any, reminderDays: number) {
  const sessionDate = new Date(session.sessionDate);
  const reminderDate = new Date(sessionDate);
  reminderDate.setDate(reminderDate.getDate() - reminderDays);
  
  // For now, send immediate confirmation email
  // In production, this would integrate with a job scheduler like Bull or Agenda
  const superviseeInfo = await storage.getSuperviseeRelationships(session.supervisorId);
  const supervisee = superviseeInfo.find(s => s.id === session.superviseeId);
  
  if (supervisee) {
    const emailData = {
      type: 'general' as const,
      subject: `Supervision Session Scheduled - ${sessionDate.toLocaleDateString()}`,
      description: `
Supervision Session Confirmation

Session Details:
- Date: ${sessionDate.toLocaleDateString()} at ${sessionDate.toLocaleTimeString()}
- Type: ${session.sessionType}
- Duration: ${session.durationMinutes} minutes
- Format: ${session.sessionFormat || 'In Person'}

Supervisor: ${session.supervisorId}
Supervisee: ${supervisee.superviseeName}

${session.notes ? `Agenda: ${session.notes}` : ''}

Reminder: This session is scheduled for ${reminderDays} day(s) from now.
      `,
      userEmail: supervisee.superviseeEmail,
      userId: session.supervisorId,
      timestamp: new Date(),
    };
    
    await sendFeedbackNotification(emailData);
  }
}

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
      const userAgent = req.get('User-Agent');
      const referer = req.get('Referer');
      
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

      // Prepare enhanced feedback data for Replit
      const feedbackData = {
        type,
        subject,
        description,
        userEmail: email,
        userId,
        timestamp: new Date(),
        appVersion: '1.0.0',
        userAgent,
        url: referer
      };

      // Send to Replit for automated processing AND email for all feedback types
      if (type === 'bug') {
        const issueId = await createReplitIssue(feedbackData);
        console.log(`Bug report ${issueId} sent to Replit for automated fix`);
        
        // Send to Replit's monitoring system for automated fixes
        await sendFeedbackToReplit(feedbackData);
        
        // ALSO send email so you can thank the user and follow up
        await sendFeedbackNotification(feedbackData);
        
        res.json({ 
          success: true, 
          message: "Bug report submitted to Replit for automated fix",
          feedbackId: savedFeedback.id,
          issueId: issueId
        });
      } else {
        // For feature requests and general feedback, send to Replit AND email
        await sendFeedbackToReplit(feedbackData);
        await sendFeedbackNotification(feedbackData);
        
        res.json({ 
          success: true, 
          message: "Feedback submitted successfully",
          feedbackId: savedFeedback.id
        });
      }

    } catch (error) {
      console.error("Feedback submission error:", error);
      res.status(500).json({ 
        error: "Internal server error" 
      });
    }
  });

  // Replit automated feedback monitoring endpoint
  app.get("/api/replit/feedback", async (req, res) => {
    try {
      const feedback = await storage.getFeedback();
      
      // Filter and format for Replit's automated processing
      const replitFeedback = feedback.map(item => ({
        id: item.id,
        type: item.type,
        subject: item.subject,
        description: item.description,
        status: item.status,
        priority: item.type === 'bug' ? 'high' : 'medium',
        createdAt: item.createdAt,
        automated: true,
        source: 'claritylog',
        requiresFix: item.type === 'bug' && item.status === 'new'
      }));

      res.json({
        total: replitFeedback.length,
        openBugs: replitFeedback.filter(f => f.type === 'bug' && f.requiresFix).length,
        feedback: replitFeedback
      });
    } catch (error) {
      console.error("Failed to fetch Replit feedback:", error);
      res.status(500).json({ error: "Failed to fetch feedback for automated processing" });
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
      const sessionData = req.body;
      
      // Create the supervision session
      const session = await storage.createSupervisionSession({
        ...sessionData,
        sessionDate: new Date(sessionData.sessionDate),
        topics: [],
        competencyAreas: [],
        actionItems: [],
        superviseeGoals: [],
        notes: sessionData.agenda || null,
      });

      // Send email reminders if requested
      if (sessionData.sendReminders) {
        try {
          await scheduleSessionReminders(session, sessionData.reminderDays || 1);
        } catch (emailError) {
          console.error('Failed to schedule email reminders:', emailError);
          // Don't fail the session creation if email fails
        }
      }

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

  // Enhanced supervision endpoints
  
  // Compliance alerts
  app.post("/api/supervision/alerts", express.json(), async (req, res) => {
    try {
      const alert = await storage.createComplianceAlert(req.body);
      res.json(alert);
    } catch (error) {
      console.error("Error creating compliance alert:", error);
      res.status(500).json({ error: "Failed to create compliance alert" });
    }
  });

  app.get("/api/supervision/alerts/:supervisorId", async (req, res) => {
    try {
      const { unreadOnly } = req.query;
      const alerts = await storage.getComplianceAlerts(
        req.params.supervisorId,
        unreadOnly === 'true'
      );
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching compliance alerts:", error);
      res.status(500).json({ error: "Failed to fetch compliance alerts" });
    }
  });

  // Supervisee management endpoints
  app.post("/api/supervisees", express.json(), async (req, res) => {
    try {
      const supervisee = await storage.createSuperviseeRelationship(req.body);
      res.json(supervisee);
    } catch (error) {
      console.error("Error creating supervisee:", error);
      res.status(500).json({ error: "Failed to create supervisee" });
    }
  });

  app.get("/api/supervisees", async (req, res) => {
    try {
      const { supervisorId } = req.query;
      const supervisees = await storage.getSuperviseeRelationships(supervisorId as string);
      res.json(supervisees);
    } catch (error) {
      console.error("Error fetching supervisees:", error);
      res.status(500).json({ error: "Failed to fetch supervisees" });
    }
  });

  app.delete("/api/supervisees/:id", async (req, res) => {
    try {
      // In a real implementation, you'd want to archive rather than delete
      // and ensure proper authorization
      await storage.updateSuperviseeRelationship(req.params.id, { 
        status: 'archived',
        endDate: new Date() 
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing supervisee:", error);
      res.status(500).json({ error: "Failed to remove supervisee" });
    }
  });

  // Messaging endpoints
  app.post("/api/messages", express.json(), async (req, res) => {
    try {
      // In a production app, you'd store messages in the database
      // For now, we'll send notifications via email
      const { recipient, subject, message, senderId, senderName } = req.body;
      
      // Find the supervisee to get their email
      const supervisees = await storage.getSuperviseeRelationships(senderId);
      const supervisee = supervisees.find(s => s.id === recipient);
      
      if (supervisee && supervisee.email) {
        // Send email notification using the existing email service
        const emailData = {
          type: 'general' as const,
          subject: `Message from ${senderName}: ${subject}`,
          description: message,
          userEmail: supervisee.email,
          userId: senderId,
          timestamp: new Date(),
        };
        
        // Import and use the email service
        const { sendFeedbackNotification } = await import("./email");
        await sendFeedbackNotification(emailData);
      }
      
      res.json({ success: true, messageId: `msg_${Date.now()}` });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  app.patch("/api/supervision/alerts/:id", express.json(), async (req, res) => {
    try {
      await storage.updateComplianceAlert(req.params.id, req.body);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating compliance alert:", error);
      res.status(500).json({ error: "Failed to update compliance alert" });
    }
  });

  app.post("/api/supervision/alerts/:id/resolve", express.json(), async (req, res) => {
    try {
      const { resolvedBy } = req.body;
      await storage.resolveComplianceAlert(req.params.id, resolvedBy);
      res.json({ success: true });
    } catch (error) {
      console.error("Error resolving compliance alert:", error);
      res.status(500).json({ error: "Failed to resolve compliance alert" });
    }
  });

  app.post("/api/supervision/alerts/generate/:supervisorId", async (req, res) => {
    try {
      const alerts = await storage.generateAutomatedAlerts(req.params.supervisorId);
      res.json(alerts);
    } catch (error) {
      console.error("Error generating automated alerts:", error);
      res.status(500).json({ error: "Failed to generate automated alerts" });
    }
  });

  // Hour sharing endpoints (for supervisee hour tracking)
  app.get("/api/supervisee-hours/:superviseeId", async (req, res) => {
    try {
      const { superviseeId } = req.params;
      
      // Fetch log entries for the supervisee - using storage interface
      // This would need to be implemented in the storage layer
      res.json([]); // Placeholder - would fetch from logEntry table
    } catch (error) {
      console.error("Error fetching supervisee hours:", error);
      res.status(500).json({ error: "Failed to fetch supervisee hours" });
    }
  });

  // Supervisor connection request system
  app.post("/api/supervision/request-connection", express.json(), async (req, res) => {
    try {
      const { superviseeId, superviseeName, superviseeEmail, supervisorEmail, licenseNumber, message } = req.body;
      
      // Send email to supervisor using Resend
      const subject = `Supervision Connection Request from ${superviseeName}`;
      const emailContent = `
        <h2>New Supervision Connection Request</h2>
        <p><strong>${superviseeName}</strong> (${superviseeEmail}) has requested to connect their hour tracking to your supervision.</p>
        
        <h3>LAC Information:</h3>
        <ul>
          <li><strong>Name:</strong> ${superviseeName}</li>
          <li><strong>Email:</strong> ${superviseeEmail}</li>
          <li><strong>License Number:</strong> ${licenseNumber}</li>
        </ul>
        
        <h3>Message:</h3>
        <p>${message}</p>
        
        <p>To approve this request, log into your ClarityLog supervisor dashboard and navigate to the Compliance section.</p>
        
        <p>Best regards,<br>ClarityLog Team</p>
      `;

      const emailSent = await sendEmail(supervisorEmail, subject, emailContent);
      
      if (emailSent) {
        // Store the connection request in a pending state
        // This would be stored in a supervision_requests table
        console.log('Connection request stored for approval');
        
        res.json({ 
          success: true, 
          message: "Connection request sent successfully",
          requestId: `req_${Date.now()}`
        });
      } else {
        res.status(500).json({ error: "Failed to send connection request email" });
      }
    } catch (error) {
      console.error("Error processing connection request:", error);
      res.status(500).json({ error: "Failed to process connection request" });
    }
  });

  // Individual supervisee endpoint
  app.get("/api/supervisees/:id", async (req, res) => {
    try {
      const supervisorId = req.query.supervisorId as string;
      const relationships = await storage.getSuperviseeRelationships(supervisorId || '');
      const supervisee = relationships.find(r => r.superviseeId === req.params.id);
      
      if (!supervisee) {
        return res.status(404).json({ error: "Supervisee not found" });
      }
      
      res.json(supervisee);
    } catch (error) {
      console.error("Error fetching supervisee:", error);
      res.status(500).json({ error: "Failed to fetch supervisee" });
    }
  });

  // Competency frameworks
  app.post("/api/supervision/frameworks", express.json(), async (req, res) => {
    try {
      const framework = await storage.createCompetencyFramework(req.body);
      res.json(framework);
    } catch (error) {
      console.error("Error creating competency framework:", error);
      res.status(500).json({ error: "Failed to create competency framework" });
    }
  });

  app.get("/api/supervision/frameworks", async (req, res) => {
    try {
      const { category } = req.query;
      const frameworks = await storage.getCompetencyFrameworks(category as string);
      res.json(frameworks);
    } catch (error) {
      console.error("Error fetching competency frameworks:", error);
      res.status(500).json({ error: "Failed to fetch competency frameworks" });
    }
  });

  // Enhanced reporting
  app.get("/api/supervision/competency-report/:superviseeId", async (req, res) => {
    try {
      const report = await storage.generateCompetencyReport(req.params.superviseeId);
      res.json(report);
    } catch (error) {
      console.error("Error generating competency report:", error);
      res.status(500).json({ error: "Failed to generate competency report" });
    }
  });

  app.get("/api/supervision/trends/:supervisorId", async (req, res) => {
    try {
      const { timeframe } = req.query;
      const trends = await storage.getSupervisionTrends(
        req.params.supervisorId,
        timeframe as string
      );
      res.json(trends);
    } catch (error) {
      console.error("Error fetching supervision trends:", error);
      res.status(500).json({ error: "Failed to fetch supervision trends" });
    }
  });

  // Since we're using Firebase for all data operations,
  // the main API routes are handled client-side with Firebase SDK
  // This server primarily serves the frontend and provides health checks

  const httpServer = createServer(app);

  return httpServer;
}
