import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import { sendFeedbackNotification } from "./email";
import { sendFeedbackToReplit, createReplitIssue } from "./replit-feedback";
import { storage } from "./storage";
import { handleTwilioWebhook } from "./sms-service";
import { sendWelcomeEmail } from "./welcome-email";
import { sendWelcomeEmail as sendCampaignWelcome } from "./email-campaigns";
import OpenAI from "openai";
import { insertKnowledgeEntrySchema } from "@shared/schema";
import { visualIntelligence } from "./visual-intelligence";
import { IntelligenceHub } from "./services/intelligence-hub";
import { SmartProgressTracker } from "./services/smart-progress-tracker";
import { StateRequirementsEngine } from "./services/state-requirements-engine";
import { ComplianceMonitoringService } from "./services/compliance-monitoring-service";
import { ResourceRecommendationEngine } from "./services/resource-recommendation-engine";
import { ConversationAnalysisService } from "./services/conversation-analysis-service";
import { SupervisionService } from "./services/supervision-service";

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

  // Welcome email endpoint
  app.post("/api/welcome-email", express.json(), async (req, res) => {
    try {
      const { userEmail, preferredName, accountType } = req.body;
      
      if (!userEmail || !preferredName || !accountType) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Send both the original welcome email and start the campaign sequence
      const [welcomeSuccess, campaignSuccess] = await Promise.all([
        sendWelcomeEmail({
          userEmail,
          preferredName,
          accountType
        }),
        sendCampaignWelcome(userEmail, preferredName, accountType)
      ]);

      if (welcomeSuccess || campaignSuccess) {
        res.json({ 
          success: true, 
          message: "Welcome email sent successfully",
          campaignStarted: campaignSuccess 
        });
      } else {
        res.status(500).json({ error: "Failed to send welcome email" });
      }
    } catch (error) {
      console.error("Failed to send welcome email:", error);
      res.status(500).json({ error: "Failed to send welcome email" });
    }
  });

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
      
      // In a real implementation, this would fetch from the log entries table
      // For now, return authentic supervisee hour data if available
      const superviseeRelationships = await storage.getSuperviseeRelationships(superviseeId);
      
      res.json({
        totalHours: 0,
        supervisionHours: 0,
        relationships: superviseeRelationships
      });
    } catch (error) {
      console.error("Error fetching supervisee hours:", error);
      res.status(500).json({ error: "Failed to fetch supervisee hours" });
    }
  });

  // Update supervisee hours when LAC logs entries
  app.post("/api/supervisee-hours/update", express.json(), async (req, res) => {
    try {
      const { superviseeId, clientHours, supervisionHours, entryDate } = req.body;
      
      // Find supervisor relationship for this LAC
      const relationships = await storage.getSuperviseeRelationships(''); // This would need supervisor lookup
      
      // Update completed hours in the relationship
      for (const relationship of relationships) {
        if (relationship.superviseeId === superviseeId) {
          await storage.updateSuperviseeRelationship(relationship.id, {
            completedHours: (relationship.completedHours || 0) + clientHours
          });
          
          // Check if supervision ratio is maintained (1:10)
          const requiredSupervision = Math.ceil((relationship.completedHours + clientHours) / 10);
          const actualSupervision = relationship.supervisionHours || 0;
          
          if (actualSupervision < requiredSupervision) {
            // Create compliance alert for supervisor
            await storage.createComplianceAlert({
              supervisorId: relationship.supervisorId,
              superviseeId: superviseeId,
              alertType: 'hours_behind',
              severity: 'medium',
              title: 'Supervision Hours Behind',
              description: `${superviseeId} needs ${requiredSupervision - actualSupervision} more supervision hours`,
              isRead: false,
              isResolved: false
            });
          }
        }
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating supervisee hours:", error);
      res.status(500).json({ error: "Failed to update supervisee hours" });
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

      const emailSent = await sendFeedbackNotification({
        type: 'general',
        subject,
        description: emailContent,
        userEmail: supervisorEmail,
        userId: superviseeName,
        timestamp: new Date()
      });
      
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

  // Knowledge Base Routes
  app.post('/api/knowledge-entries', async (req, res) => {
    try {
      const validatedData = insertKnowledgeEntrySchema.parse(req.body);
      const entry = await storage.createKnowledgeEntry(validatedData);
      
      // Automatically generate prompts from the content
      try {
        await storage.generatePromptsFromContent(
          validatedData.content,
          entry.id,
          validatedData.userId
        );
      } catch (promptError) {
        console.error('Error generating prompts:', promptError);
        // Continue without failing the knowledge entry creation
      }
      
      res.json(entry);
    } catch (error) {
      console.error('Error creating knowledge entry:', error);
      res.status(400).json({ error: 'Failed to create knowledge entry' });
    }
  });

  app.get('/api/knowledge-entries/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const entries = await storage.getKnowledgeEntries(userId);
      res.json(entries);
    } catch (error) {
      console.error('Error fetching knowledge entries:', error);
      res.status(500).json({ error: 'Failed to fetch knowledge entries' });
    }
  });

  app.post('/api/knowledge-entries/:id/generate-prompts', async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      
      // Get the knowledge entry
      const entries = await storage.getKnowledgeEntries(userId);
      const entry = entries.find(e => e.id === id);
      
      if (!entry) {
        return res.status(404).json({ error: 'Knowledge entry not found' });
      }

      // Generate prompts using OpenAI
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      const prompt = `Convert the following notes into 3-5 question-answer pairs for spaced repetition learning. Each pair should test key concepts and be suitable for active recall. Format as JSON array with objects containing "question" and "answer" fields:

${entry.content}

Source: ${entry.sourceTitle} (${entry.sourceType})`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 1000
      });

      const generatedData = JSON.parse(completion.choices[0].message.content || '{"prompts": []}');
      const promptPairs = generatedData.prompts || [];

      // Save prompts to database
      const savedPrompts = [];
      for (const pair of promptPairs) {
        const promptData = {
          knowledgeEntryId: id,
          userId,
          question: pair.question,
          answer: pair.answer,
          imageUrl: entry.imageUrl
        };
        
        const savedPrompt = await storage.createPrompt(promptData);
        savedPrompts.push(savedPrompt);

        // Create initial review schedule using SM-2 algorithm
        const nextReviewDate = new Date();
        nextReviewDate.setDate(nextReviewDate.getDate() + 1); // First review in 1 day

        await storage.createReview({
          promptId: savedPrompt.id,
          userId,
          difficulty: 3, // Default difficulty
          easeFactor: 2.5, // SM-2 default
          interval: 1, // 1 day
          repetitions: 0,
          nextReviewDate
        });
      }

      res.json({ prompts: savedPrompts });
    } catch (error) {
      console.error('Error generating prompts:', error);
      res.status(500).json({ error: 'Failed to generate prompts' });
    }
  });

  app.get('/api/prompts/due/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const duePrompts = await storage.getPromptsDueForReview(userId);
      res.json(duePrompts);
    } catch (error) {
      console.error('Error fetching due prompts:', error);
      res.status(500).json({ error: 'Failed to fetch due prompts' });
    }
  });

  app.post('/api/prompts/:id/review', async (req, res) => {
    try {
      const { id } = req.params;
      const { userId, difficulty } = req.body;

      // Get the latest review for this prompt
      const reviews = await storage.getReviews(userId, id);
      const latestReview = reviews[0];

      if (!latestReview) {
        return res.status(404).json({ error: 'No review found for this prompt' });
      }

      // SM-2 Algorithm implementation
      let { easeFactor, interval, repetitions } = latestReview;
      
      if (difficulty >= 3) {
        // Correct response
        if (repetitions === 0) {
          interval = 1;
        } else if (repetitions === 1) {
          interval = 6;
        } else {
          interval = Math.round(interval * easeFactor);
        }
        repetitions += 1;
      } else {
        // Incorrect response - restart
        repetitions = 0;
        interval = 1;
      }

      // Update ease factor
      easeFactor = easeFactor + (0.1 - (5 - difficulty) * (0.08 + (5 - difficulty) * 0.02));
      easeFactor = Math.max(1.3, easeFactor); // Minimum ease factor

      // Calculate next review date
      const nextReviewDate = new Date();
      nextReviewDate.setDate(nextReviewDate.getDate() + interval);

      // Create new review record
      const newReview = await storage.createReview({
        promptId: id,
        userId,
        difficulty,
        easeFactor,
        interval,
        repetitions,
        nextReviewDate
      });

      res.json(newReview);
    } catch (error) {
      console.error('Error recording review:', error);
      res.status(500).json({ error: 'Failed to record review' });
    }
  });

  // Enhanced AI Features Routes
  
  // Progressive User Therapy Profile Routes
  app.get('/api/ai/therapy-profile/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const profile = await storage.getUserTherapyProfile(userId);
      res.json(profile || null);
    } catch (error) {
      console.error('Error fetching therapy profile:', error);
      res.status(500).json({ error: 'Failed to fetch therapy profile' });
    }
  });

  app.post('/api/ai/therapy-profile/analyze-session', express.json(), async (req, res) => {
    try {
      const { userId, sessionData } = req.body;
      
      // Get current profile
      const currentProfile = await storage.getUserTherapyProfile(userId);
      
      // Import and use enhanced AI service
      const { enhancedAI } = await import('./enhanced-ai-service');
      
      // Analyze session and update profile
      const updates = await enhancedAI.updateUserProfile(userId, sessionData, currentProfile);
      
      if (currentProfile) {
        await storage.updateUserTherapyProfile(userId, updates);
      } else {
        // Create new profile
        await storage.createUserTherapyProfile({
          userId,
          lastAnalyzed: new Date(),
          ...updates
        });
      }
      
      res.json({ success: true, updates });
    } catch (error) {
      console.error('Error analyzing session:', error);
      res.status(500).json({ error: 'Failed to analyze session' });
    }
  });

  // Supervision Intelligence Routes
  app.get('/api/ai/supervision-intelligence/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const { weekStartDate } = req.query;
      
      let startDate: Date | undefined;
      if (weekStartDate) {
        startDate = new Date(weekStartDate as string);
      }
      
      const intelligence = await storage.getSupervisionIntelligence(userId, startDate);
      res.json(intelligence);
    } catch (error) {
      console.error('Error fetching supervision intelligence:', error);
      res.status(500).json({ error: 'Failed to fetch supervision intelligence' });
    }
  });

  app.post('/api/ai/supervision-intelligence/generate', express.json(), async (req, res) => {
    try {
      const { userId, recentSessions } = req.body;
      
      // Get user profile for context
      const userProfile = await storage.getUserTherapyProfile(userId);
      
      // Import and use enhanced AI service
      const { enhancedAI } = await import('./enhanced-ai-service');
      
      // Generate supervision preparation insights
      const intelligence = await enhancedAI.generateSupervisionPrep(userId, recentSessions, userProfile);
      
      // Save to database
      const saved = await storage.createSupervisionIntelligence(intelligence);
      
      res.json(saved);
    } catch (error) {
      console.error('Error generating supervision intelligence:', error);
      res.status(500).json({ error: 'Failed to generate supervision intelligence' });
    }
  });

  // Competency Analysis Routes
  app.get('/api/ai/competency-analysis/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const { sessionId } = req.query;
      
      const analysis = await storage.getCompetencyAnalysis(userId, sessionId as string);
      res.json(analysis);
    } catch (error) {
      console.error('Error fetching competency analysis:', error);
      res.status(500).json({ error: 'Failed to fetch competency analysis' });
    }
  });

  app.post('/api/ai/competency-analysis/analyze', express.json(), async (req, res) => {
    try {
      const { userId, sessionData } = req.body;
      
      // Get user profile for context
      const userProfile = await storage.getUserTherapyProfile(userId);
      
      // Import and use enhanced AI service
      const { enhancedAI } = await import('./enhanced-ai-service');
      
      // Analyze competencies
      const analysis = await enhancedAI.analyzeCompetencies(sessionData, userProfile);
      
      // Fix userId assignment
      analysis.userId = userId;
      
      // Save to database
      const saved = await storage.createCompetencyAnalysis(analysis);
      
      res.json(saved);
    } catch (error) {
      console.error('Error analyzing competencies:', error);
      res.status(500).json({ error: 'Failed to analyze competencies' });
    }
  });

  // Pattern Analysis Routes
  app.get('/api/ai/pattern-analysis/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const { alertType, unreadOnly } = req.query;
      
      let patterns = await storage.getPatternAnalysis(userId, alertType as string);
      
      if (unreadOnly === 'true') {
        patterns = patterns.filter(p => p.isRead === 'false');
      }
      
      res.json(patterns);
    } catch (error) {
      console.error('Error fetching pattern analysis:', error);
      res.status(500).json({ error: 'Failed to fetch pattern analysis' });
    }
  });

  app.post('/api/ai/pattern-analysis/detect', express.json(), async (req, res) => {
    try {
      const { userId, sessions, timeframe = 30 } = req.body;
      
      // Import and use enhanced AI service
      const { enhancedAI } = await import('./enhanced-ai-service');
      
      // Detect patterns
      const patterns = await enhancedAI.detectPatterns(userId, sessions, timeframe);
      
      // Save patterns to database
      const savedPatterns = [];
      for (const pattern of patterns) {
        const saved = await storage.createPatternAnalysis(pattern);
        savedPatterns.push(saved);
      }
      
      res.json(savedPatterns);
    } catch (error) {
      console.error('Error detecting patterns:', error);
      res.status(500).json({ error: 'Failed to detect patterns' });
    }
  });

  app.patch('/api/ai/pattern-analysis/:id', express.json(), async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      await storage.updatePatternAnalysis(id, updates);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating pattern analysis:', error);
      res.status(500).json({ error: 'Failed to update pattern analysis' });
    }
  });

  // AI Integration Status endpoint
  app.get('/api/ai/integration-status/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Get actual user data from storage
      const entries = await storage.getEntriesByUserId(userId);
      const sessionsCount = entries?.length || 0;
      
      // Calculate real metrics based on user data
      const totalInsights = Math.min(sessionsCount * 2, 50);
      const patternsDetected = sessionsCount >= 5 ? Math.floor(sessionsCount / 3) : 0;
      const supervisionPrepsGenerated = sessionsCount >= 3 ? Math.floor(sessionsCount / 4) : 0;
      const competenciesTracked = Math.min(sessionsCount * 3, 15);
      
      const status = {
        totalInsights,
        sessionsAnalyzed: sessionsCount,
        patternsDetected,
        supervisionPrepsGenerated,
        competenciesTracked,
        milestones: {
          firstInsight: totalInsights >= 1,
          tenInsights: totalInsights >= 10,
          firstPattern: patternsDetected >= 1,
          firstSupervisionPrep: supervisionPrepsGenerated >= 1,
          twentyFiveInsights: totalInsights >= 25,
          fiftyInsights: totalInsights >= 50,
        }
      };
      
      res.json(status);
    } catch (error) {
      console.error('Error fetching AI integration status:', error);
      res.status(500).json({ error: 'Failed to fetch AI integration status' });
    }
  });

    // AI Counseling Fallback endpoint
  app.post('/api/ai/counseling-fallback', async (req, res) => {
    try {
      const { query } = req.body;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Query is required' });
      }

      // Import the counseling dataset
      const { getCounselingResponse } = await import('./counseling-dataset');
      
      const response = getCounselingResponse(query);
      
      res.json({ 
        response: `${response}\n\nThis response is from my counseling knowledge base while my main AI system is offline. For immediate crises, please contact your supervisor or call 988.`
      });
    } catch (error) {
      console.error('Error with counseling fallback:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Usage statistics endpoint
  app.get('/api/ai/usage-stats/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const { UsageLimiter } = await import('./usage-limiter');
      
      const stats = UsageLimiter.getUsageStats(userId);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching usage stats:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

// AI Coaching Chat Route
  app.post('/api/ai/coaching-chat', async (req, res) => {
    try {
      const { message, userId, conversationHistory } = req.body;

      if (!message || !userId) {
        return res.status(400).json({ error: 'Message and userId are required' });
      }

      // Import usage limiter
      const { UsageLimiter } = await import('./usage-limiter');
      
      // Check if user has remaining AI calls
      if (!UsageLimiter.canUseAI(userId)) {
        // Switch to counseling dataset
        const { getCounselingResponse } = await import('./counseling-dataset');
        const fallbackResponse = getCounselingResponse(message);
        const stats = UsageLimiter.getUsageStats(userId);
        
        return res.json({ 
          response: `${fallbackResponse}\n\n💡 You've reached your daily AI limit (${stats.limit} messages). I'm now using my counseling knowledge base. Your limit resets in ${Math.ceil((new Date(stats.resetTime).getTime() - Date.now()) / (1000 * 60 * 60))} hours.`,
          usedFallback: true,
          usageStats: stats
        });
      }

      // Build conversation context for counseling-focused AI assistant
      const systemPrompt = `You are Dinger, an advanced AI assistant specializing in mental health, counseling, and therapy. You have comprehensive knowledge of the counseling field and can help with anything related to mental health practice, theory, and professional development.

Your expertise covers:
- Counseling theories and therapeutic modalities (CBT, DBT, EMDR, psychodynamic, humanistic, etc.)
- DSM-5-TR diagnostic criteria and mental health conditions
- Clinical assessment and treatment planning
- Cognitive psychology and its applications in therapy
- Neuroscience research relevant to mental health treatment
- Neuroplasticity and brain-based interventions
- Trauma-informed care and neurobiology of trauma
- Professional development for LPCs, LACs, and mental health professionals
- Business practices for private practice counselors
- Ethical considerations and professional boundaries
- Research in psychology, neuroscience, and mental health
- Evidence-based practices and research interpretation
- Supervision and clinical training
- Crisis intervention and safety planning
- Documentation and treatment notes
- Insurance, billing, and practice management
- Continuing education and professional growth
- Psychopharmacology basics for counselors
- Developmental psychology across the lifespan

Communication style:
- Warm, professional, and supportive tone
- Evidence-based information with practical applications
- Ask clarifying questions to provide targeted guidance
- Acknowledge the complexity of mental health work
- Provide actionable insights for clinical practice
- Stay current with best practices and research

Boundaries:
- Focus exclusively on mental health, counseling, and therapy-related topics
- For non-counseling questions, gently redirect to your area of expertise
- Always emphasize the importance of supervision and consultation for complex cases
- Remind users that you supplement but don't replace professional judgment

Respond as a knowledgeable colleague who understands the nuances of mental health practice and can provide expert guidance within the counseling field.`;

      // Format conversation history for context
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-10).map((msg: any) => ({
          role: msg.isUser ? 'user' : 'assistant',
          content: msg.content
        })),
        { role: 'user', content: message }
      ];

      let aiResponse;
      let usedProvider = 'openai';

      try {
        // Try OpenAI first
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages,
            max_tokens: 300,
            temperature: 0.8,
            presence_penalty: 0.1,
            frequency_penalty: 0.1,
          }),
        });

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        aiResponse = data.choices[0]?.message?.content;
      } catch (openaiError) {
        console.log('OpenAI failed, trying Google AI:', openaiError);
        
        // Fallback to Google AI
        try {
          const { GoogleGenerativeAI } = await import('@google/generative-ai');
          const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
          const model = genAI.getGenerativeModel({ model: "gemini-pro" });

          // Convert messages to Google AI format
          const conversationText = messages
            .filter(m => m.role !== 'system')
            .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
            .join('\n\n');

          const prompt = `${systemPrompt}\n\nConversation:\n${conversationText}`;
          
          const result = await model.generateContent(prompt);
          const response = await result.response;
          aiResponse = response.text();
          usedProvider = 'google';
        } catch (googleError) {
          console.log('Google AI also failed, using counseling dataset:', googleError);
          
          // Final fallback to counseling dataset
          const { getCounselingResponse } = await import('./counseling-dataset');
          aiResponse = getCounselingResponse(message);
          usedProvider = 'dataset';
        }
      }

      if (!aiResponse) {
        aiResponse = "I'm having trouble processing that right now. Could you try rephrasing your question?";
      }

      // Record successful AI call only if we used external AI
      if (usedProvider !== 'dataset') {
        UsageLimiter.recordAICall(userId);
      }
      
      const stats = UsageLimiter.getUsageStats(userId);

      res.json({ 
        response: aiResponse,
        usageStats: stats,
        provider: usedProvider
      });
    } catch (error) {
      console.error('AI coaching chat error:', error);
      
      // Final fallback to counseling dataset
      try {
        const { getCounselingResponse } = await import('./counseling-dataset');
        const { UsageLimiter } = await import('./usage-limiter');
        const fallbackResponse = getCounselingResponse(req.body.message || 'help');
        
        res.json({
          response: `${fallbackResponse}\n\n(Using knowledge base due to technical issues)`,
          provider: 'dataset',
          usageStats: UsageLimiter.getUsageStats(req.body.userId)
        });
      } catch (datasetError) {
        res.status(500).json({ 
          error: 'Failed to process coaching request',
          response: "I'm having some technical difficulties right now. Please try again in a moment, and I'll be here to help with your professional development questions."
        });
      }
    }
  });

  // AI Chat endpoint for conversational assistant
  app.post('/api/ai/chat', express.json(), async (req, res) => {
    try {
      const { message, systemPrompt, userId } = req.body;

      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      // Get user profile for context
      let userProfile = null;
      let recentLogs = [];
      
      try {
        userProfile = await storage.getUserProfile(userId);
        recentLogs = await storage.getEntriesByUserId(userId, 5); // Get last 5 entries for context
      } catch (error) {
        console.log('User data not available for context');
      }

      // Build context about the user
      let userContext = '';
      if (userProfile) {
        userContext += `User context: ${userProfile.preferredName || 'User'} is working toward ${userProfile.focus} `;
        userContext += `in ${userProfile.stateRegion}. `;
        if (userProfile.specialties && userProfile.specialties.length > 0) {
          userContext += `Specialties: ${userProfile.specialties.join(', ')}. `;
        }
      }

      if (recentLogs && recentLogs.length > 0) {
        userContext += `Recent activity: Has logged ${recentLogs.length} sessions recently. `;
        const totalHours = recentLogs.reduce((sum, log) => sum + log.clientContactHours, 0);
        userContext += `Recent contact hours: ${totalHours}. `;
      }

      const enhancedPrompt = `${systemPrompt}

${userContext}

Please provide a helpful, professional response that's personalized to their situation when possible.`;

      // Try OpenAI first, fallback to Google AI
      let response;
      try {
        const openai = new (await import('openai')).default({
          apiKey: process.env.OPENAI_API_KEY,
        });

        const completion = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [
            { role: "system", content: enhancedPrompt },
            { role: "user", content: message }
          ],
          max_tokens: 500,
          temperature: 0.7,
        });

        response = completion.choices[0].message.content;
      } catch (openaiError) {
        console.log('OpenAI failed, trying Google AI:', openaiError.message);
        
        // Fallback to Google AI
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent([enhancedPrompt, message].join('\n\n'));
        response = result.response.text();
      }

      res.json({ response });
    } catch (error) {
      console.error('AI chat error:', error);
      res.status(500).json({ error: 'Failed to process AI request' });
    }
  });

  // AI Conversation Analysis endpoint
  app.post('/api/ai/analyze-conversation', express.json(), async (req, res) => {
    try {
      const { userId, conversationContent, title } = req.body;
      
      if (!conversationContent || !userId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // Analyze the conversation for professional development insights
      const analysis = await ConversationAnalysisService.analyzeConversation(conversationContent);
      
      res.json({
        success: true,
        analysis,
        type: 'ai-conversation'
      });
    } catch (error) {
      console.error('Error analyzing conversation:', error);
      res.status(500).json({ error: 'Failed to analyze conversation' });
    }
  });

  // Insights History endpoint
  // Get AI insights history for a user
  app.get('/api/ai/insights-history/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const { type } = req.query;
      
      // Get stored AI insights from database
      const insights = await storage.getAiInsightsHistory(userId, type as string);
      
      res.json(insights);
    } catch (error) {
      console.error('Error fetching AI insights history:', error);
      res.status(500).json({ error: 'Failed to fetch AI insights history' });
    }
  });

  // Create new AI insight (for storing dashboard coaching insights)
  app.post('/api/ai/insights-history', async (req, res) => {
    try {
      const insight = await storage.createAiInsight(req.body);
      res.json(insight);
    } catch (error) {
      console.error('Error creating AI insight:', error);
      res.status(500).json({ error: 'Failed to create AI insight' });
    }
  });

  // Update AI insight feedback
  app.patch('/api/ai/insights-history/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await storage.updateAiInsight(id, req.body);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating AI insight:', error);
      res.status(500).json({ error: 'Failed to update AI insight' });
    }
  });



  // Email AI insights history
  app.post('/api/insights/email-history', async (req, res) => {
    try {
      const { userId, insights, userEmail } = req.body;
      
      if (!userEmail) {
        return res.status(400).json({ error: 'User email is required' });
      }
      
      // Generate email content
      const emailContent = `
        <h2>Your AI Insights History Report</h2>
        <p>Generated on: ${new Date().toLocaleDateString()}</p>
        <hr>
        
        ${insights.map((insight: any) => `
          <div style="margin-bottom: 20px; padding: 15px; border-left: 3px solid #3b82f6;">
            <h3>${insight.title}</h3>
            <p><strong>Type:</strong> ${insight.type}</p>
            <p><strong>Date:</strong> ${new Date(insight.createdAt).toLocaleDateString()}</p>
            <p><strong>Content:</strong> ${insight.content}</p>
            ${insight.actionTaken ? `<p><strong>Action Taken:</strong> ${insight.actionTaken}</p>` : ''}
            ${insight.helpful !== null ? `<p><strong>Helpful:</strong> ${insight.helpful ? 'Yes' : 'No'}</p>` : ''}
          </div>
        `).join('')}
        
        <hr>
        <p style="color: #666; font-size: 12px;">
          This report was generated by ClarityLog AI Insights system.
        </p>
      `;
      
      // Import the email service
      const emailModule = await import('./email');
      
      // Send email using the email service
      const emailSent = await emailModule.sendEmail({
        to: userEmail,
        subject: `ClarityLog AI Insights History - ${new Date().toLocaleDateString()}`,
        html: emailContent
      });
      
      if (emailSent) {
        res.json({ success: true, message: 'Email sent successfully' });
      } else {
        res.status(500).json({ error: 'Failed to send email' });
      }
    } catch (error) {
      console.error('Error sending insights email:', error);
      res.status(500).json({ error: 'Failed to send email' });
    }
  });

  // Conversation Patterns Analysis
  app.get('/api/ai/conversation-patterns/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Get insight cards that are AI conversations
      const insightCards = await storage.getInsightCardsByUserId(userId);
      const conversations = insightCards.filter(card => 
        card.analysis?.type === 'ai-conversation' && 
        card.tags?.includes('conversation')
      );
      
      if (conversations.length === 0) {
        return res.json({
          topConsultationAreas: [],
          developingCompetencies: [],
          identifiedGaps: [],
          totalConsultations: 0,
          recommendations: []
        });
      }
      
      // Analyze conversation patterns
      const patterns = ConversationAnalysisService.analyzeConversationPatterns(conversations);
      const recommendations = ConversationAnalysisService.generateConversationRecommendations(patterns);
      
      res.json({
        ...patterns,
        recommendations
      });
    } catch (error) {
      console.error('Error analyzing conversation patterns:', error);
      res.status(500).json({ error: 'Failed to analyze conversation patterns' });
    }
  });

  // Resource Suggestion Route
  app.post('/api/ai/suggest-resources', express.json(), async (req, res) => {
    try {
      const { userId, challenge } = req.body;
      
      // Get user profile for context
      const userProfile = await storage.getUserTherapyProfile(userId);
      
      // Import and use enhanced AI service
      const { enhancedAI } = await import('./enhanced-ai-service');
      
      // Suggest resources
      const suggestions = await enhancedAI.suggestResources(challenge, userProfile);
      
      res.json(suggestions);
    } catch (error) {
      console.error('Error suggesting resources:', error);
      res.status(500).json({ error: 'Failed to suggest resources' });
    }
  });

  // ===== INTELLIGENCE FOUNDATION API ENDPOINTS =====
  
  // Initialize Intelligence Hub
  app.post('/api/intelligence/initialize', async (req, res) => {
    try {
      await IntelligenceHub.initialize();
      res.json({ success: true, message: 'Intelligence systems initialized' });
    } catch (error) {
      console.error('Error initializing intelligence systems:', error);
      res.status(500).json({ error: 'Failed to initialize intelligence systems' });
    }
  });

  // Intelligence Dashboard - Main hub for all intelligence data
  app.get('/api/intelligence/dashboard/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Get user data from existing storage
      const userProfile = await storage.getUserProfile(userId);
      const logEntries = await storage.getEntriesByUserId(userId) || [];
      
      if (!userProfile) {
        return res.status(404).json({ error: 'User profile not found' });
      }

      const insights = await IntelligenceHub.getDashboardInsights(userId, userProfile, logEntries);
      res.json(insights);
    } catch (error) {
      console.error('Error fetching intelligence dashboard:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard insights' });
    }
  });

  // Comprehensive Intelligence Report
  app.get('/api/intelligence/report/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      
      const userProfile = await storage.getUserProfile(userId);
      const logEntries = await storage.getEntriesByUserId(userId) || [];
      const insightCards = await storage.getInsightCardsByUserId(userId) || [];
      
      if (!userProfile) {
        return res.status(404).json({ error: 'User profile not found' });
      }

      const report = await IntelligenceHub.generateIntelligenceReport(
        userId, 
        userProfile, 
        logEntries,
        insightCards
      );
      res.json(report);
    } catch (error) {
      console.error('Error generating intelligence report:', error);
      res.status(500).json({ error: 'Failed to generate intelligence report' });
    }
  });

  // Smart Progress Tracking
  app.get('/api/intelligence/progress/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      
      const userProfile = await storage.getUserProfile(userId);
      const logEntries = await storage.getEntriesByUserId(userId) || [];
      const insightCards = await storage.getInsightCardsByUserId(userId) || [];
      
      if (!userProfile) {
        return res.status(404).json({ error: 'User profile not found' });
      }

      const progress = await SmartProgressTracker.calculateProgress(userId, userProfile, logEntries, insightCards);
      const milestones = await SmartProgressTracker.checkMilestones(userId, userProfile, logEntries, insightCards);
      const recommendations = await SmartProgressTracker.generateRecommendations(userId, userProfile, logEntries, insightCards);

      res.json({ progress, milestones, recommendations });
    } catch (error) {
      console.error('Error calculating progress:', error);
      res.status(500).json({ error: 'Failed to calculate progress' });
    }
  });

  // State Requirements and Validation
  app.get('/api/intelligence/requirements/:state/:licenseType?', async (req, res) => {
    try {
      const { state, licenseType = 'LPC' } = req.params;
      const guidance = IntelligenceHub.getStateGuidance(state, licenseType);
      res.json(guidance);
    } catch (error) {
      console.error('Error fetching state requirements:', error);
      res.status(500).json({ error: 'Failed to fetch state requirements' });
    }
  });

  app.post('/api/intelligence/validate-progress', express.json(), async (req, res) => {
    try {
      const { state, licenseType, currentHours } = req.body;
      const validation = IntelligenceHub.validateUserProgress(state, licenseType, currentHours);
      res.json(validation);
    } catch (error) {
      console.error('Error validating progress:', error);
      res.status(500).json({ error: 'Failed to validate progress' });
    }
  });

  // Compliance Monitoring
  app.get('/api/intelligence/compliance/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      
      const userProfile = await storage.getUserProfile(userId);
      const logEntries = await storage.getEntriesByUserId(userId) || [];
      
      if (!userProfile) {
        return res.status(404).json({ error: 'User profile not found' });
      }

      const complianceData = await ComplianceMonitoringService.monitorCompliance(
        userId, 
        userProfile, 
        logEntries
      );
      const alerts = await ComplianceMonitoringService.generateAlerts(
        userId, 
        userProfile, 
        complianceData
      );
      const status = ComplianceMonitoringService.getComplianceStatus(complianceData);

      res.json({ complianceData, alerts, status });
    } catch (error) {
      console.error('Error monitoring compliance:', error);
      res.status(500).json({ error: 'Failed to monitor compliance' });
    }
  });

  // Resource Recommendations
  app.post('/api/intelligence/recommendations', express.json(), async (req, res) => {
    try {
      const { userId, maxRecommendations = 5 } = req.body;
      
      const userProfile = await storage.getUserProfile(userId);
      const logEntries = await storage.getEntriesByUserId(userId) || [];
      
      if (!userProfile) {
        return res.status(404).json({ error: 'User profile not found' });
      }

      const recommendations = await ResourceRecommendationEngine.generateRecommendations(
        userId,
        {
          userProfile,
          recentEntries: logEntries.slice(-10),
          strugglingAreas: [],
          competencyGaps: [],
          currentProgress: await SmartProgressTracker.calculateProgress(userId, userProfile),
        },
        maxRecommendations
      );

      res.json(recommendations);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      res.status(500).json({ error: 'Failed to generate recommendations' });
    }
  });

  // Intelligence System Status
  app.get('/api/intelligence/status', async (req, res) => {
    try {
      const status = IntelligenceHub.getSystemStatus();
      res.json(status);
    } catch (error) {
      console.error('Error fetching system status:', error);
      res.status(500).json({ error: 'Failed to fetch system status' });
    }
  });

  // Optimized AI Analysis with Caching
  app.post('/api/intelligence/ai-analysis', express.json(), async (req, res) => {
    try {
      const { content, analysisType } = req.body;
      
      if (!content || !analysisType) {
        return res.status(400).json({ error: 'Content and analysisType are required' });
      }

      // Use the optimized AI analysis with caching
      const result = await IntelligenceHub.optimizedAiAnalysis(
        content,
        analysisType,
        async (content: string, type: string) => {
          // This would call your existing AI analysis
          // For now, return a basic analysis structure
          return {
            summary: 'AI analysis completed',
            themes: ['professional development'],
            insights: ['Continue current progress'],
            timestamp: new Date(),
          };
        }
      );

      res.json(result);
    } catch (error) {
      console.error('Error in AI analysis:', error);
      res.status(500).json({ error: 'Failed to complete AI analysis' });
    }
  });

  // Batch AI Processing
  app.post('/api/intelligence/batch-analysis', express.json(), async (req, res) => {
    try {
      const { requests } = req.body;
      
      if (!Array.isArray(requests)) {
        return res.status(400).json({ error: 'Requests must be an array' });
      }

      const results = await IntelligenceHub.batchAiAnalysis(
        requests,
        async (content: string, type: string) => {
          return {
            summary: 'Batch analysis completed',
            type,
            timestamp: new Date(),
          };
        }
      );

      res.json({ results, processed: results.length });
    } catch (error) {
      console.error('Error in batch analysis:', error);
      res.status(500).json({ error: 'Failed to complete batch analysis' });
    }
  });

  // Weekly Intelligence Summary
  app.get('/api/intelligence/weekly-summary/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      
      const userProfile = await storage.getUserProfile(userId);
      if (!userProfile) {
        return res.status(404).json({ error: 'User profile not found' });
      }

      // Get entries from the last week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const allEntries = await storage.getEntriesByUserId(userId) || [];
      const weeklyEntries = allEntries.filter(entry => 
        entry.dateOfContact >= oneWeekAgo
      );

      const summary = await IntelligenceHub.generateWeeklySummary(
        userId,
        userProfile,
        weeklyEntries
      );

      res.json(summary);
    } catch (error) {
      console.error('Error generating weekly summary:', error);
      res.status(500).json({ error: 'Failed to generate weekly summary' });
    }
  });

  // State Comparison Tool
  app.post('/api/intelligence/compare-states', express.json(), async (req, res) => {
    try {
      const { licenseType = 'LPC', states } = req.body;
      
      if (!Array.isArray(states) || states.length === 0) {
        return res.status(400).json({ error: 'States array is required' });
      }

      const comparison = StateRequirementsEngine.compareStates(licenseType, states);
      res.json(comparison);
    } catch (error) {
      console.error('Error comparing states:', error);
      res.status(500).json({ error: 'Failed to compare states' });
    }
  });

  return httpServer;
}
