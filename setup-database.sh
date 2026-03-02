#!/bin/bash
# ============================================================================
# ClarityTracker 2 - Database Setup Helper
# ============================================================================
# This script helps you set up your database connection
# ============================================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🗄️  Database Setup Helper${NC}"
echo "=========================================="
echo ""

echo "Choose your database provider:"
echo ""
echo "1) Neon (Recommended - Free tier, easy setup)"
echo "2) Supabase (Alternative - Free tier)"
echo "3) I already have a PostgreSQL database"
echo "4) Exit"
echo ""
read -p "Enter choice [1-4]: " choice

case $choice in
    1)
        echo ""
        echo -e "${BLUE}Setting up Neon database...${NC}"
        echo ""
        echo "Steps:"
        echo "1. Open https://neon.tech in your browser"
        echo "2. Sign up with GitHub (free)"
        echo "3. Click 'Create Project'"
        echo "4. Project name: claritytracker-prod"
        echo "5. Choose region (US East recommended)"
        echo "6. Copy the connection string"
        echo ""
        echo "The connection string looks like:"
        echo "postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/claritytracker"
        echo ""
        read -p "Press Enter when you have the connection string..."
        ;;
    2)
        echo ""
        echo -e "${BLUE}Setting up Supabase database...${NC}"
        echo ""
        echo "Steps:"
        echo "1. Open https://supabase.com in your browser"
        echo "2. Sign up with GitHub (free)"
        echo "3. Create new project"
        echo "4. Go to Settings → Database"
        echo "5. Copy the connection string"
        echo ""
        read -p "Press Enter when you have the connection string..."
        ;;
    3)
        echo ""
        echo -e "${BLUE}Using existing PostgreSQL database...${NC}"
        echo ""
        echo "Make sure your connection string is in this format:"
        echo "postgresql://username:password@host:port/database"
        echo ""
        ;;
    4)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
read -p "Enter your DATABASE_URL: " db_url

# Validate format
if [[ ! $db_url =~ ^postgresql:// ]]; then
    echo -e "${YELLOW}⚠️  Warning: Connection string should start with 'postgresql://'${NC}"
    read -p "Continue anyway? [y/N]: " confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Update .env file
if [ -f .env ]; then
    # Backup
    cp .env .env.backup
    
    # Update DATABASE_URL
    if grep -q "^DATABASE_URL=" .env; then
        # Replace existing
        sed -i.bak "s|^DATABASE_URL=.*|DATABASE_URL=$db_url|" .env
        rm .env.bak 2>/dev/null || true
    else
        # Add new
        echo "DATABASE_URL=$db_url" >> .env
    fi
    
    echo ""
    echo -e "${GREEN}✅ DATABASE_URL updated in .env${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run migrations: ./server/scripts/run-migrations.sh"
    echo "2. Test connection: npm start"
    echo ""
else
    echo -e "${YELLOW}⚠️  .env file not found. Creating from template...${NC}"
    cp .env.example .env
    echo "DATABASE_URL=$db_url" >> .env
    echo -e "${GREEN}✅ Created .env file with DATABASE_URL${NC}"
fi

# Test connection
echo ""
read -p "Test database connection now? [y/N]: " test_conn
if [[ $test_conn =~ ^[Yy]$ ]]; then
    echo ""
    echo "Testing connection..."
    if command -v psql &> /dev/null; then
        psql "$db_url" -c "SELECT version();" && echo -e "${GREEN}✅ Connection successful!${NC}" || echo -e "${YELLOW}⚠️  Connection test failed (this might be okay if psql isn't configured)${NC}"
    else
        echo "psql not found. Skipping connection test."
        echo "You can test after running migrations."
    fi
fi

echo ""
echo -e "${GREEN}✅ Database setup complete!${NC}"
