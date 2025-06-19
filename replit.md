# ClarityLog - Clinical Supervision and Progress Tracking Platform

## Overview

ClarityLog is a comprehensive behavioral health platform designed for Licensed Associate Counselors (LACs) pursuing licensure. The application provides AI-powered session analysis, supervision management, compliance tracking, and professional development tools. Built as a full-stack web application with modern technologies, it serves individual counselors, supervisors, and enterprise organizations.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: Radix UI components with Tailwind CSS styling
- **State Management**: React Query for server state, React Context for auth
- **Routing**: Client-side routing for SPA experience

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for type safety
- **API Design**: RESTful endpoints with comprehensive route handling
- **Middleware**: Custom security, rate limiting, and validation layers

### Database Strategy
- **Primary Database**: PostgreSQL via Neon serverless
- **ORM**: Drizzle ORM for type-safe database operations
- **Connection Pooling**: Production-optimized connection management
- **Schema Management**: Shared schema definitions between client/server

### Authentication & Authorization
- **Provider**: Firebase Authentication for user management
- **Session Management**: JWT tokens with secure cookie handling
- **Authorization**: Role-based access control (individual, supervisor, enterprise, client)

## Key Components

### AI Services Integration
- **OpenAI GPT-4o**: Primary AI model for session analysis and insights
- **Google Gemini**: Secondary AI provider for analysis diversity
- **Azure Cognitive Services**: Speech transcription and face analysis
- **Usage Management**: Cost tracking and rate limiting to prevent overuse

### Session Intelligence System
- **Real-time Analysis**: Live transcription and clinical insight generation
- **Progress Note Automation**: AI-assisted documentation with 70% completion
- **Risk Assessment**: Automatic detection of clinical risk indicators
- **EBP Integration**: Evidence-based practice adherence scoring

### Supervision Management
- **Supervisor Dashboards**: Comprehensive supervisee progress tracking
- **Compliance Monitoring**: Automated alerts for requirement deadlines
- **Session Scheduling**: Intelligent scheduling based on compliance needs
- **Quality Metrics**: Performance analytics and competency assessments

### Progressive Disclosure System
- **Multi-Level Information**: Dashboard → Detail → Analysis → Educational content
- **Adaptive Learning**: Content adjusted based on user experience level
- **Competency Tracking**: Evidence-based skill development monitoring

## Data Flow

### User Journey Flow
```
Landing Page → Account Setup → Email Campaigns → Dashboard → Feature Usage
```

### AI Analysis Pipeline
```
Session Data → Transcription → AI Analysis → Insights Generation → Storage → Dashboard Display
```

### Supervision Workflow
```
LAC Activities → Progress Tracking → Supervisor Notifications → Supervision Sessions → Compliance Updates
```

### Progressive Disclosure Flow
```
Summary Card → Detailed View → Advanced Analysis → Educational Resources
```

## External Dependencies

### Core Infrastructure
- **Replit**: Application hosting and development environment
- **PostgreSQL**: Database hosting via Replit/Neon integration
- **Firebase**: Authentication and user management

### Communication Services
- **Resend**: Email delivery system for notifications and campaigns
- **Twilio**: SMS integration for text-to-entry functionality

### AI & Analytics
- **OpenAI API**: Primary AI service for session analysis
- **Google AI**: Secondary AI provider for diverse perspectives
- **Azure Cognitive Services**: Speech and vision analysis capabilities

### Monitoring & Security
- **Rate Limiting**: Express-rate-limit for API protection
- **Security Headers**: Helmet.js for security hardening
- **Input Validation**: Zod schemas for type-safe validation

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with hot module replacement
- **Database**: Local PostgreSQL or Replit-hosted database
- **Environment Variables**: Secure configuration management

### Production Deployment
- **Platform**: Replit Autoscale deployment
- **Build Process**: Vite build for client, esbuild for server
- **Process Management**: PM2 or similar for production process management
- **Health Monitoring**: Custom health check endpoints for system monitoring

### Performance Optimizations
- **Connection Pooling**: Optimized database connection management
- **Caching Strategy**: AI response caching to reduce API costs
- **Error Boundaries**: Comprehensive error handling and recovery
- **Rate Limiting**: Multi-tier rate limiting for different endpoint types

## Recent Changes
- June 19, 2025: DASHBOARD DATA CONSISTENCY RESOLVED
  - SUPERVISION METRICS ENDPOINT: Fixed supervision metrics API to return consistent supervisor counts
  - DATA ALIGNMENT COMPLETE: Both top section and Supervision Progress card now display matching active supervisor count (1)
  - ENDPOINT OPTIMIZATION: Created `/api/supervision/metrics/:userId` using same data source as working supervisors API
  - COMPONENT ERROR HANDLING: Added null checks to prevent SupervisionTracker crashes from undefined arrays
  - DASHBOARD STABILITY: All metric calculations now use unified data sources ensuring consistency across components
  - INVESTOR DEMO READY: Dashboard fully stable with consistent data display for Wednesday presentation
- June 18, 2025: ENHANCED CLINICAL RECORDING SYSTEM IMPLEMENTED
  - COMPETITIVE ANALYSIS COMPLETE: Comprehensive research of Mentalyc's session documentation features
  - MULTI-MODAL RECORDING INTERFACE: Created enhanced clinical recorder combining Eleos Health EBP analysis with Mentalyc's UX patterns
  - EVIDENCE-BASED PRACTICE ANALYSIS: Real-time EBP technique detection with adherence scoring and effectiveness measurement
  - SUPERVISION MARKERS: Automated generation of supervision points with transcript linking for targeted feedback
  - MEASUREMENT-BASED CARE: Integration of standardized assessment scales with visual trend analysis
  - PROGRESS NOTE AUTOMATION: AI-generated SOAP notes from comprehensive session data including EBP implementations
  - THERAPEUTIC ALLIANCE TRACKING: Real-time assessment and adjustment based on client-therapist interactions
  - CLINICAL VIDEO ANALYSIS: Enhanced Azure integration for engagement metrics and emotional state detection
  - STRATEGIC POSITIONING: Differentiated from documentation tools by focusing on real-time clinical intelligence
  - INVESTOR DEMO ENHANCED: Comprehensive session recording ready for Wednesday presentation
- June 16, 2025: ENHANCED SECURITY & SESSION MANAGEMENT IMPLEMENTED
  - AUTHENTICATION SECURITY UPGRADE: Added session timeout controls and "remember me" functionality
  - FIREBASE PERSISTENCE CONTROL: Users can now choose between session-only or persistent login
  - AZURE SPEECH SERVICE FIXED: Corrected endpoint paths and configuration parameters for transcription
  - AZURE VIDEO ANALYSIS OPERATIONAL: Fixed API endpoint mismatches enabling real-time emotion detection
  - SESSION INTELLIGENCE ENHANCED: Both video analysis and speech transcription now fully functional
  - COMPREHENSIVE ERROR LOGGING: Added detailed debugging for Azure Speech Service troubleshooting
  - SECURITY BALANCE ACHIEVED: Maintained ease of access while adding granular session control options
  - INVESTOR DEMO READY: All critical Azure services operational with authentic data processing

## User Preferences

Preferred communication style: Simple, everyday language.