# ClarityLog - Clinical Supervision and Progress Tracking Platform

## Overview
ClarityLog is a comprehensive behavioral health platform for Licensed Associate Counselors (LACs) seeking licensure. It offers AI-powered session analysis, supervision management, compliance tracking, and professional development tools. The platform aims to serve individual counselors, supervisors, and enterprise organizations, providing significant ROI through enhanced efficiency and clinical outcomes.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **UI Library**: Radix UI with Tailwind CSS
- **State Management**: React Query for server state, React Context for authentication
- **Routing**: Client-side routing for Single Page Application (SPA) experience

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **API Design**: RESTful endpoints
- **Middleware**: Custom security, rate limiting, and validation

### Database
- **Primary Database**: PostgreSQL via Neon serverless
- **ORM**: Drizzle ORM
- **Connection Pooling**: Production-optimized
- **Schema Management**: Shared client/server definitions
- **Backup & Recovery**: Automated daily verification, 30-minute RTO, 15-minute RPO

### Authentication & Authorization
- **Provider**: Firebase Authentication
- **Session Management**: JWT tokens with secure cookie handling
- **Authorization**: Role-based access control (individual, supervisor, enterprise, client)

### AI Services
- **Primary AI**: OpenAI GPT-4o for session analysis
- **Secondary AI**: Google Gemini for analysis diversity
- **Speech/Vision**: Azure Cognitive Services for transcription and face analysis
- **Privacy**: Automatic PII anonymization, local-first processing, configurable data minimization.

### Key Features
- **Session Intelligence**: Real-time analysis, AI-assisted progress note automation (70% completion), risk assessment, EBP adherence scoring.
- **Supervision Management**: Supervisor dashboards, compliance monitoring, intelligent scheduling, quality metrics.
- **Progressive Disclosure**: Multi-level information display (Dashboard → Detail → Analysis → Educational), adaptive learning, competency tracking.
- **Clinical Research System**: AI-powered research generation focused on mental health practice applications, integrating multiple academic databases (e.g., PubMed, Google Scholar).
- **Session Recording & Hour Logging**: Integrated PII anonymization, real-time insights generation, one-click hour tracking with auto-population.

## External Dependencies

### Core Infrastructure
- **Replit**: Application hosting and development
- **PostgreSQL**: Database hosting (via Replit/Neon)
- **Firebase**: Authentication and user management

### Communication
- **Resend**: Email delivery
- **Twilio**: SMS integration (for text-to-entry)

### AI & Analytics
- **OpenAI API**: Primary AI service
- **Google AI**: Secondary AI provider
- **Azure Cognitive Services**: Speech and vision analysis

### Security & Monitoring
- **Rate Limiting**: Multi-tier API protection
- **Security Headers**: Helmet.js
- **Input Validation**: Zod schemas
- **System Health Monitoring**: Real-time alerts