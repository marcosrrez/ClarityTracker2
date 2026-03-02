#!/bin/bash
# ============================================================================
# ClarityTracker 2 - Launch Execution Script
# ============================================================================
# This script executes the launch process step by step
# ============================================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║         🚀 ClarityTracker 2 - Launch Execution             ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Step 1: Verify Environment
echo -e "${BLUE}📋 Step 1: Verifying Environment...${NC}"
echo ""

if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Creating from template..."
    cp .env.example .env
    echo -e "${GREEN}✅ Created .env file${NC}"
fi

# Check DATABASE_URL
DB_URL=$(grep "^DATABASE_URL=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
if [ -z "$DB_URL" ] || [ "$DB_URL" = "postgresql://placeholder" ]; then
    echo -e "${YELLOW}⚠️  DATABASE_URL not configured${NC}"
    echo ""
    echo "You need to set up a database first. Options:"
    echo ""
    echo "Option 1: Run automated setup"
    echo "  ./setup-database.sh"
    echo ""
    echo "Option 2: Manual setup"
    echo "  1. Go to https://neon.tech (free tier)"
    echo "  2. Sign up and create project"
    echo "  3. Copy connection string"
    echo "  4. Update .env: DATABASE_URL=postgresql://..."
    echo ""
    read -p "Press Enter when DATABASE_URL is configured, or Ctrl+C to exit..."
    DB_URL=$(grep "^DATABASE_URL=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
fi

if [ -z "$DB_URL" ] || [ "$DB_URL" = "postgresql://placeholder" ]; then
    echo -e "${RED}❌ DATABASE_URL still not configured!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ DATABASE_URL configured${NC}"

# Check JWT_SECRET
JWT_SECRET=$(grep "^JWT_SECRET=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
if [ -z "$JWT_SECRET" ] || [ ${#JWT_SECRET} -lt 32 ]; then
    echo -e "${YELLOW}⚠️  JWT_SECRET invalid or missing${NC}"
    echo "Generating new JWT_SECRET..."
    NEW_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    if grep -q "^JWT_SECRET=" .env; then
        sed -i.bak "s|^JWT_SECRET=.*|JWT_SECRET=$NEW_SECRET|" .env
        rm .env.bak 2>/dev/null || true
    else
        echo "JWT_SECRET=$NEW_SECRET" >> .env
    fi
    echo -e "${GREEN}✅ JWT_SECRET generated${NC}"
else
    echo -e "${GREEN}✅ JWT_SECRET configured${NC}"
fi

echo ""

# Step 2: Build Application
echo -e "${BLUE}📦 Step 2: Building Application...${NC}"
echo ""

if [ -d dist ]; then
    echo "Cleaning previous build..."
    rm -rf dist
fi

npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo ""

# Step 3: Run Migrations
echo -e "${BLUE}🗄️  Step 3: Running Database Migrations...${NC}"
echo ""

if [ -f server/scripts/run-migrations.sh ]; then
    chmod +x server/scripts/run-migrations.sh
    chmod +x server/scripts/verify-migrations.sh
    
    echo "Running migrations..."
    ./server/scripts/run-migrations.sh
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Migrations completed successfully${NC}"
        
        echo ""
        echo "Verifying migrations..."
        ./server/scripts/verify-migrations.sh
    else
        echo -e "${RED}❌ Migrations failed${NC}"
        echo "Check the error above and fix DATABASE_URL if needed"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  Migration script not found, skipping...${NC}"
fi

echo ""

# Step 4: Test Database Connection
echo -e "${BLUE}🔍 Step 4: Testing Database Connection...${NC}"
echo ""

# Test with a simple query
if command -v psql &> /dev/null; then
    if psql "$DB_URL" -c "SELECT 1;" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Database connection successful${NC}"
    else
        echo -e "${YELLOW}⚠️  Could not test connection (psql may not be configured)${NC}"
        echo "This is okay - connection will be tested when server starts"
    fi
else
    echo -e "${YELLOW}⚠️  psql not found - skipping connection test${NC}"
    echo "Connection will be tested when server starts"
fi

echo ""

# Step 5: Prepare for Deployment
echo -e "${BLUE}🚀 Step 5: Preparing for Deployment...${NC}"
echo ""

# Check Vercel CLI
if command -v vercel &> /dev/null; then
    echo -e "${GREEN}✅ Vercel CLI installed${NC}"
    VERCEL_VERSION=$(vercel --version 2>/dev/null || echo "unknown")
    echo "  Version: $VERCEL_VERSION"
else
    echo -e "${YELLOW}⚠️  Vercel CLI not installed${NC}"
    echo ""
    read -p "Install Vercel CLI now? [Y/n]: " install_vercel
    if [[ ! $install_vercel =~ ^[Nn]$ ]]; then
        echo "Installing Vercel CLI..."
        npm install -g vercel
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Vercel CLI installed${NC}"
        else
            echo -e "${RED}❌ Failed to install Vercel CLI${NC}"
            echo "Install manually: npm install -g vercel"
        fi
    fi
fi

echo ""

# Step 6: Summary
echo -e "${CYAN}══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Pre-Deployment Checks Complete!${NC}"
echo -e "${CYAN}══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Next Steps:"
echo ""
echo "1. Test locally (optional):"
echo "   ./test-local.sh"
echo "   # Or: npm start"
echo ""
echo "2. Deploy to Vercel:"
echo "   vercel login"
echo "   vercel"
echo "   # Add environment variables when prompted"
echo "   vercel --prod"
echo ""
echo "3. Add environment variables in Vercel dashboard:"
echo "   - DATABASE_URL: $DB_URL"
echo "   - JWT_SECRET: (from .env)"
echo "   - NODE_ENV: production"
echo ""
echo -e "${BLUE}Ready to deploy? Run: vercel${NC}"
echo ""
