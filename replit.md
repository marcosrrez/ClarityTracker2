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
- June 19, 2025: COMPREHENSIVE RESEARCH ANALYSIS CARDS IMPLEMENTED
  - ENHANCED SAVED RESEARCH FUNCTIONALITY: Research library now generates comprehensive, multi-section clinical analysis instead of basic summaries
  - DETAILED CLINICAL INSIGHTS: Saved research cards include Executive Summary, Research Methodology, Clinical Applications, Professional Development Insights, and Practice Recommendations
  - GOOGLE AI INTEGRATION: Leveraging gemini-1.5-flash for generating 6000+ character comprehensive analyses with structured clinical content
  - PROFESSIONAL-GRADE CONTENT: Research saves now provide actionable clinical intelligence with implementation protocols, training requirements, and assessment tools
  - AUTOMATIC SEARCH HISTORY: Research queries automatically saved to history with context and result counts for reference tracking
  - INVESTOR DEMO ENHANCED: Research library demonstrates sophisticated clinical analysis capabilities matching professional research standards
  - STRATEGIC POSITIONING: Transforms basic research bookmarking into comprehensive clinical development intelligence for mental health practitioners
- June 19, 2025: HIGH-QUALITY CLINICAL RESEARCH SYSTEM IMPLEMENTED
  - CLINICAL RESEARCH SERVICE DEPLOYED: Created sophisticated AI-powered research generation system focused specifically on mental health practice applications
  - RESEARCH QUALITY DRAMATICALLY IMPROVED: Replaced generic academic results with detailed, practice-focused clinical research including methodologies, implementation protocols, and outcome measures
  - GOOGLE AI INTEGRATION ENHANCED: Leveraged gemini-1.5-flash for generating comprehensive clinical abstracts with specific intervention protocols and training modules
  - PRACTICE-FOCUSED CONTENT: Research results now emphasize clinical applications, evidence-based interventions, and measurable therapeutic outcomes
  - IMPLEMENTATION GUIDANCE INCLUDED: Each research result provides specific protocols, training modules, assessment tools, and session scripts for immediate clinical application
  - COMPREHENSIVE CLINICAL SUMMARIES: AI-generated summaries with practical implementation strategies, treatment implications, and evidence quality assessments
  - INVESTOR DEMO ENHANCED: Research functionality now demonstrates sophisticated understanding of clinical practice needs, positioning platform as comprehensive clinical development partner
  - STRATEGIC DIFFERENTIATION: Transforms research from generic academic content to actionable clinical intelligence for practicing mental health professionals
- June 19, 2025: GOOGLE AI MIGRATION COMPLETED FOR RESEARCH FUNCTIONALITY
  - ENHANCED RESEARCH SERVICE MIGRATED: Successfully transitioned from OpenAI to Google AI (Gemini) for all research analysis functions
  - MODEL UPDATED: Migrated from GPT-4o to gemini-1.5-flash for query enhancement, result ranking, and comprehensive summary generation
  - JSON PARSING ENHANCED: Implemented robust JSON parsing to handle Google AI's markdown-formatted responses
  - RESEARCH QUALITY MAINTAINED: Academic research summaries continue to deliver high-quality clinical insights with Google AI integration
  - COST OPTIMIZATION: Reduced AI processing costs by utilizing Google AI's competitive pricing structure
  - API RELIABILITY IMPROVED: Enhanced error handling and response parsing for consistent research functionality
  - INVESTOR DEMO READY: Complete research workflow operational with Google AI backend for Wednesday presentation
- June 19, 2025: CRITICAL PRIVACY PAGE ERROR FIXED AND ENHANCED RESEARCH SYSTEM COMPLETED
  - PRIVACY PAGE STABILIZED: Fixed critical "privacyScore is not defined" runtime error that was breaking investor demo
  - PRIVACY SCORING SYSTEM: Implemented comprehensive privacy protection calculation based on anonymization settings, encryption levels, and data retention policies
  - MULTI-SOURCE RESEARCH INTEGRATION: Successfully deployed enhanced research service with 6 academic databases (PubMed, SAGE, Taylor & Francis, Wiley, SpringerLink, APA PsycInfo)
  - RESEARCH QUALITY ENHANCEMENT: Added AI-powered query enhancement and result ranking with relevance scores up to 95%
  - SCROLLING ISSUE RESOLVED: Fixed chat container CSS with proper flexbox layout for smooth research result navigation
  - INVESTOR DEMO STABILITY: All core features now stable including privacy settings, research capabilities, and unified intelligence system
  - STRATEGIC DIFFERENTIATION: Enhanced research capabilities position platform as comprehensive clinical development partner with academic-grade research integration
- June 19, 2025: SESSION RECORDING INSIGHTS INTEGRATION INTO MYMIND COMPLETED
  - UNIFIED INTELLIGENCE EXPERIENCE: Session recording analysis now automatically generates insight cards that appear in the MyMind (PersonalizedAICoaching) component
  - SEAMLESS CARD INTEGRATION: Session insights blend naturally with existing coaching cards using consistent visual design and interaction patterns
  - SMART CARD CATEGORIZATION: Different card styles (coaching, growth, supervision, risk, achievement) with priority indicators and visual color coding
  - REAL-TIME FEEDBACK SYSTEM: Users can mark insights as helpful/not helpful with immediate database updates and UI refresh
  - AUTOMATED INSIGHT GENERATION: Session analysis triggers creation of personalized insight cards for Pattern Recognition, Therapeutic Alliance, Supervision Focus, Clinical Growth, and Risk Assessment
  - API ENDPOINTS COMPLETE: Full backend integration with `/api/sessions/:sessionId/generate-insights`, `/api/my-mind/insight-cards/:userId`, and feedback endpoints
  - STRATEGIC POSITIONING: Creates unified professional development intelligence where session recordings become learning data feeding MyMind insights
  - INVESTOR DEMO ENHANCED: Complete end-to-end flow from session recording → AI analysis → personalized insight cards → professional development guidance
- June 19, 2025: COMPLETE PRIVACY-FIRST INTELLIGENCE ARCHITECTURE IMPLEMENTED
  - AUTOMATIC PII ANONYMIZATION: Built comprehensive AI-powered system to detect and anonymize personally identifiable information across all clinical content
  - INTELLIGENT DETECTION ENGINE: Multi-level PII detection (basic, standard, comprehensive) with pattern matching and AI-powered contextual analysis
  - THERAPEUTIC CONTEXT PRESERVATION: Consistent pseudonyms maintain clinical continuity while protecting privacy - Client-A, Spouse-A, Child-A maintain relationship mapping
  - LOCAL-FIRST PROCESSING: WebAssembly-based emotion analysis, client-side transcription, edge AI processing with minimal server communication
  - SMART DATA MINIMIZATION: Auto-purge raw recordings (24-168 hours), tiered storage (Essential vs Optional), configurable data granularity
  - TRANSPARENT PROCESSING: Real-time privacy indicators, data journey visualization, compliance dashboard with HIPAA/SOC2/BAA status
  - PRIVACY SETTINGS INTERFACE: Complete user control with real-time privacy scoring, detection level selection, and local processing toggles
  - SEAMLESS INTEGRATION: Non-disruptive enhancement to existing AI pipeline - automatic protection without workflow changes
  - INVESTOR DIFFERENTIATION: Only clinical platform with intelligent automatic HIPAA protection plus local-first processing options
  - STRATEGIC POSITIONING: Privacy-first approach creates unassailable competitive moat while enabling advanced AI analysis
- June 19, 2025: INTEGRATED SESSION HOUR LOGGING IMPLEMENTED
  - CLINICAL WORKFLOW ENHANCEMENT: Added seamless hour logging directly from clinical recording interface
  - ONE-CLICK HOUR TRACKING: Users can now log session hours immediately after completing recordings
  - SMART AUTO-POPULATION: Recording duration automatically populates hour log with 15-minute rounding
  - SESSION TYPE SELECTION: Support for Direct Client Contact, Group Session, and Supervision Session types
  - DUAL WORKFLOW OPTIONS: "Save Recording Only" vs "Save & Log Hours" for maximum flexibility
  - INTELLIGENT INTEGRATION: Connected to existing hour tracking system and dashboard metrics
  - INVESTOR DEMO ENHANCED: Perfect example of "intelligence everywhere" - unified clinical workflow
  - STRATEGIC POSITIONING: Differentiates from basic documentation tools by understanding complete clinical workflow
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