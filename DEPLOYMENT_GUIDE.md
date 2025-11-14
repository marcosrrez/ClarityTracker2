# ClarityTracker 2 - Deployment Guide for Launch

**Goal:** Launch in production within 1 month and start acquiring customers  
**Last Updated:** November 14, 2025  
**Status:** Ready for deployment preparation

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Deployment Options](#deployment-options)
3. [Quick Start - Recommended Path](#quick-start---recommended-path)
4. [Step-by-Step Deployment](#step-by-step-deployment)
5. [Post-Deployment Tasks](#post-deployment-tasks)
6. [Customer Acquisition Preparation](#customer-acquisition-preparation)

---

## Pre-Deployment Checklist

### ✅ Critical Requirements

- [ ] **PostgreSQL Database** - Set up production database (Neon, Supabase, or Railway)
- [ ] **Environment Variables** - Configure all production secrets
- [ ] **Domain Name** - Purchase and configure DNS
- [ ] **SSL Certificate** - Automatic with most platforms
- [ ] **Email Service** - Set up Resend or similar for notifications
- [ ] **Monitoring** - Configure Sentry for error tracking
- [ ] **Backup Strategy** - Automated database backups

### 📋 Nice to Have

- [ ] **AI API Keys** - For session intelligence features (can add later)
- [ ] **CDN** - For faster asset delivery
- [ ] **Redis** - For caching and job queues (can add later)

---

## Deployment Options

### Option 1: Vercel + Neon (Recommended for Quick Launch) ⭐

**Pros:**
- Fastest deployment (< 30 minutes)
- Automatic SSL and CDN
- Zero-downtime deployments
- Free tier available
- Excellent developer experience

**Cons:**
- Function timeout limits (10s on free tier)
- Cold starts on free tier

**Cost:** Free tier available, Pro starts at $20/month

### Option 2: Railway (Best for Startups)

**Pros:**
- Full-stack deployment (backend + database)
- No timeout limits
- Simple pricing
- Great for Node.js apps
- Built-in database backups

**Cons:**
- No free tier (credits for new users)

**Cost:** ~$5-20/month starting

### Option 3: Render (Balanced Option)

**Pros:**
- Free tier with limitations
- Good for full-stack apps
- Built-in SSL
- Database included

**Cons:**
- Free tier sleeps after inactivity
- Slower cold starts

**Cost:** Free tier available, paid plans start at $7/month

---

## Quick Start - Recommended Path

### Path A: Vercel + Neon (Fastest)

This is the recommended path for launching quickly and acquiring your first customers.

**Timeline:** 2-4 hours setup + 1 week testing = **Ready to launch**

#### Step 1: Set Up Database (15 minutes)

1. Go to [Neon.tech](https://neon.tech) and create free account
2. Create new project: `claritytracker-prod`
3. Copy connection string (looks like: `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/claritytracker`)
4. Save this - you'll need it for environment variables

#### Step 2: Prepare Local Environment (30 minutes)

```bash
cd "/Users/marcosrrez/Downloads/ClarityTracker 2"

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your database URL and generate JWT secret
# Generate JWT secret:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Edit `.env` file:**
```env
NODE_ENV=production
DATABASE_URL=postgresql://... # From Neon
JWT_SECRET=<generated-secret>
JWT_EXPIRES_IN=7d
```

#### Step 3: Run Database Migrations (15 minutes)

```bash
# Test database connection
psql "$DATABASE_URL" -c "SELECT version();"

# Run migrations
chmod +x server/scripts/run-migrations.sh
./server/scripts/run-migrations.sh

# Verify migrations
./server/scripts/verify-migrations.sh
```

#### Step 4: Test Local Build (15 minutes)

```bash
# Build the application
npm run build

# Test production build locally
npm start

# Open http://localhost:5000 and verify:
# - Homepage loads
# - Can create account
# - Can log in
# - Dashboard displays
```

#### Step 5: Deploy to Vercel (30 minutes)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (first time - will ask questions)
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name: claritytracker
# - Directory: ./
# - Override settings? No
```

**Configure Environment Variables in Vercel:**

1. Go to Vercel dashboard → Your project → Settings → Environment Variables
2. Add all variables from your `.env` file:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN`
   - `NODE_ENV=production`

3. Redeploy:
```bash
vercel --prod
```

#### Step 6: Configure Domain (30 minutes)

1. In Vercel dashboard → Domains
2. Add your domain (e.g., `app.claritytracker.com`)
3. Update DNS records as instructed by Vercel
4. Wait for DNS propagation (5-60 minutes)

**Done!** Your app is now live at your domain! 🎉

---

## Step-by-Step Deployment (Detailed)

### Phase 1: Local Setup & Testing (Week 1)

#### Day 1: Environment Setup

```bash
# 1. Install dependencies
cd "/Users/marcosrrez/Downloads/ClarityTracker 2"
npm install

# 2. Set up database (choose one):
# - Neon.tech (recommended)
# - Supabase
# - Railway
# - Local PostgreSQL

# 3. Create .env file
cp .env.example .env
# Edit .env with your values

# 4. Generate secrets
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

#### Day 2: Database Migration

```bash
# 1. Backup any existing data
pg_dump "$DATABASE_URL" > backup_$(date +%Y%m%d).sql

# 2. Run migrations
./server/scripts/run-migrations.sh

# 3. Verify migrations
./server/scripts/verify-migrations.sh

# 4. Check for issues
psql "$DATABASE_URL" -c "SELECT * FROM users LIMIT 5;"
```

#### Day 3-4: Local Testing

```bash
# 1. Build the app
npm run build

# 2. Start production mode locally
npm start

# 3. Test all features:
# - User registration
# - Login/logout
# - Dashboard
# - Client management
# - Session tracking
# - Supervisor features (if applicable)

# 4. Check logs
tail -f logs/application.log
```

#### Day 5: Security Review

- [ ] Review `.gitignore` - ensure `.env` is listed
- [ ] Check for hardcoded secrets in code
- [ ] Verify password hashing is enabled
- [ ] Test rate limiting on auth endpoints
- [ ] Verify CORS settings
- [ ] Check JWT token expiration

### Phase 2: Deployment (Week 2)

#### Option A: Vercel Deployment

**Best for:** Quick launch, minimal DevOps

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy to preview
vercel

# 4. Test preview deployment
# Visit the preview URL and test thoroughly

# 5. Deploy to production
vercel --prod
```

**Configure Build Settings:**

Create `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": null,
  "outputDirectory": "dist/public"
}
```

#### Option B: Railway Deployment

**Best for:** Full control, database included

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Initialize project
railway init

# 4. Add PostgreSQL database
railway add --database postgres

# 5. Set environment variables
railway variables set JWT_SECRET=<your-secret>
railway variables set NODE_ENV=production

# 6. Deploy
railway up

# 7. Get your URL
railway domain
```

#### Option C: Render Deployment

**Best for:** Balance of features and cost

1. Go to [Render.com](https://render.com)
2. Connect your GitHub repository
3. Create new Web Service:
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
   - **Environment:** Node
4. Add PostgreSQL database
5. Set environment variables
6. Deploy

### Phase 3: Post-Deployment Setup (Week 2)

#### 1. Configure Monitoring

**Sentry for Error Tracking:**

```bash
npm install @sentry/node @sentry/react

# Add to server/index.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

#### 2. Set Up Backups

**Automated Daily Backups:**

```bash
# Create backup script
cat > scripts/backup-db.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL | gzip > backups/backup_$DATE.sql.gz
# Upload to S3 or similar
EOF

chmod +x scripts/backup-db.sh

# Add to cron (runs daily at 2 AM)
crontab -e
# Add: 0 2 * * * /path/to/scripts/backup-db.sh
```

#### 3. Configure Email

**Using Resend:**

```bash
npm install resend

# Add to .env
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@your-domain.com
```

#### 4. Set Up Domain & SSL

Most platforms (Vercel, Railway, Render) provide automatic SSL with Let's Encrypt.

**Custom Domain Setup:**
1. Add domain in platform dashboard
2. Update DNS records (CNAME or A record)
3. Wait for DNS propagation (5-60 minutes)
4. SSL certificate auto-generated

### Phase 4: Final Testing (Week 3)

#### Production Smoke Tests

```bash
# Test signup
curl -X POST https://your-domain.com/api/auth/client-signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123","firstName":"Test","lastName":"User"}'

# Test login
curl -X POST https://your-domain.com/api/auth/client-login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123"}'

# Test protected endpoint
curl -H "Authorization: Bearer <token>" \
  https://your-domain.com/api/user/profile
```

#### Load Testing

```bash
# Install loadtest
npm install -g loadtest

# Test homepage
loadtest -c 10 -n 1000 https://your-domain.com

# Test API endpoint
loadtest -c 5 -n 100 https://your-domain.com/api/health
```

#### Security Scan

```bash
# Check SSL
curl -I https://your-domain.com | grep -i strict-transport

# Check security headers
curl -I https://your-domain.com | grep -E "(X-Frame|X-Content|X-XSS)"

# Test rate limiting
for i in {1..20}; do curl -X POST https://your-domain.com/api/auth/client-login; done
```

---

## Post-Deployment Tasks

### Week 4: Optimization & Monitoring

#### Day 1-2: Set Up Analytics

- [ ] Google Analytics or Plausible
- [ ] User behavior tracking
- [ ] Conversion funnels
- [ ] Error tracking review

#### Day 3-4: Performance Optimization

- [ ] Review server response times
- [ ] Optimize database queries
- [ ] Set up CDN for assets
- [ ] Enable gzip compression
- [ ] Optimize images

#### Day 5-7: Customer Onboarding Prep

- [ ] Create welcome email template
- [ ] Set up onboarding flow
- [ ] Create help documentation
- [ ] Set up customer support system
- [ ] Create FAQ page

---

## Customer Acquisition Preparation

### Before Launch Checklist

#### Marketing Materials

- [ ] Landing page with clear value proposition
- [ ] Product demo video
- [ ] Feature comparison chart
- [ ] Pricing page
- [ ] Terms of service & privacy policy

#### Customer Support

- [ ] Support email (support@your-domain.com)
- [ ] Help center or documentation
- [ ] Onboarding emails
- [ ] FAQ section

#### Payment & Pricing

- [ ] Stripe or payment processor setup
- [ ] Pricing tiers defined
- [ ] Billing system integrated
- [ ] Invoice generation

#### Launch Strategy

Week 1: **Soft Launch**
- Invite 10-20 beta users
- Collect feedback
- Fix critical issues
- Monitor performance

Week 2: **Limited Release**
- Open to 50-100 users
- Continue monitoring
- Implement feedback
- Optimize onboarding

Week 3-4: **Public Launch**
- Announce on social media
- Product Hunt launch
- Email marketing
- Paid ads (if budget allows)

---

## Monitoring & Maintenance

### Daily Checks (First Month)

- [ ] Check error logs in Sentry
- [ ] Review server response times
- [ ] Check database performance
- [ ] Monitor user signups
- [ ] Review customer feedback

### Weekly Tasks

- [ ] Database backup verification
- [ ] Security updates
- [ ] Performance review
- [ ] User analytics review
- [ ] Customer support tickets

### Monthly Tasks

- [ ] Full security audit
- [ ] Database optimization
- [ ] Cost analysis
- [ ] Feature usage analysis
- [ ] User retention analysis

---

## Troubleshooting

### Common Issues

#### Build Fails

```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

#### Database Connection Fails

```bash
# Test connection
psql "$DATABASE_URL" -c "SELECT 1"

# Check firewall rules
# Ensure your IP is whitelisted
```

#### JWT Errors

```bash
# Regenerate JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Update in environment variables
# Redeploy application
```

#### Rate Limiting Issues

```bash
# Check rate limit configuration
# Adjust RATE_LIMIT_MAX and RATE_LIMIT_WINDOW_MS
# Consider implementing Redis for distributed rate limiting
```

---

## Success Metrics

### Week 1

- [ ] Zero downtime
- [ ] < 500ms average response time
- [ ] < 1% error rate
- [ ] 10+ signups

### Month 1

- [ ] 99.5%+ uptime
- [ ] 50+ active users
- [ ] < 2% error rate
- [ ] Positive user feedback

### Month 3

- [ ] 99.9% uptime
- [ ] 200+ active users
- [ ] 50%+ retention rate
- [ ] Revenue generating

---

## Additional Resources

- **Deployment Checklist:** `PRODUCTION_DEPLOYMENT_CHECKLIST.md`
- **Security Guide:** `SECURITY_IMPLEMENTATION_REPORT.md`
- **Database Migrations:** `server/migrations/README.md`
- **Authentication:** `server/AUTHENTICATION_MIGRATION.md`

---

## Getting Help

If you encounter issues:

1. Check the logs: `tail -f logs/application.log`
2. Review error tracking: Sentry dashboard
3. Check database: `psql "$DATABASE_URL"`
4. Review documentation in `docs/` folder

---

**Ready to launch?** Start with [Quick Start - Recommended Path](#quick-start---recommended-path) above!

Good luck with your launch! 🚀
