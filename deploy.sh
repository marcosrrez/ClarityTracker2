#!/bin/bash
# ============================================================================
# ClarityTracker 2 - Automated Deployment Script
# ============================================================================
# This script automates the deployment process
# ============================================================================

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 ClarityTracker 2 - Deployment Script${NC}"
echo "=========================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Please create .env file from .env.example"
    exit 1
fi

# Check DATABASE_URL
if grep -q "DATABASE_URL=postgresql://placeholder" .env || ! grep -q "DATABASE_URL=postgresql://" .env; then
    echo -e "${YELLOW}⚠️  DATABASE_URL not configured${NC}"
    echo ""
    echo "Please set up a database first:"
    echo "1. Go to https://neon.tech (recommended) or https://supabase.com"
    echo "2. Create a project"
    echo "3. Copy the connection string"
    echo "4. Update .env file with: DATABASE_URL=postgresql://..."
    echo ""
    read -p "Press Enter when DATABASE_URL is configured, or Ctrl+C to exit..."
fi

# Verify DATABASE_URL is set
if ! grep -q "DATABASE_URL=postgresql://" .env || grep -q "DATABASE_URL=postgresql://placeholder" .env; then
    echo -e "${RED}❌ DATABASE_URL still not configured!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment file found${NC}"

# Step 1: Build
echo ""
echo -e "${BLUE}📦 Step 1: Building application...${NC}"
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

# Step 2: Run migrations
echo ""
echo -e "${BLUE}🗄️  Step 2: Running database migrations...${NC}"
if [ -f server/scripts/run-migrations.sh ]; then
    chmod +x server/scripts/run-migrations.sh
    ./server/scripts/run-migrations.sh
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Migrations completed${NC}"
    else
        echo -e "${RED}❌ Migrations failed${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  Migration script not found, skipping...${NC}"
fi

# Step 3: Check Vercel CLI
echo ""
echo -e "${BLUE}🔍 Step 3: Checking Vercel CLI...${NC}"
if command -v vercel &> /dev/null; then
    echo -e "${GREEN}✅ Vercel CLI installed${NC}"
else
    echo -e "${YELLOW}⚠️  Vercel CLI not found${NC}"
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

# Step 4: Deploy
echo ""
echo -e "${BLUE}🚀 Step 4: Deploying to Vercel...${NC}"
echo ""
echo "This will:"
echo "1. Login to Vercel (if not already)"
echo "2. Deploy your application"
echo "3. Prompt you to add environment variables"
echo ""
read -p "Press Enter to continue with deployment, or Ctrl+C to cancel..."

vercel --prod

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Add environment variables in Vercel dashboard:"
echo "   - DATABASE_URL"
echo "   - JWT_SECRET"
echo "   - NODE_ENV=production"
echo "2. Test your production URL"
echo "3. Check logs: vercel logs"
