#!/bin/bash
# ============================================================================
# Run migrations using DATABASE_URL from Vercel
# ============================================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🗄️  Running Database Migrations${NC}"
echo ""

# Option 1: Get DATABASE_URL from Vercel dashboard
echo "To get your DATABASE_URL:"
echo "1. Go to: https://vercel.com/marcos-projects-07c33181/claritytracker-2/settings/environment-variables"
echo "2. Find DATABASE_URL"
echo "3. Copy the value"
echo ""
read -p "Paste your DATABASE_URL here: " DB_URL

if [ -z "$DB_URL" ]; then
    echo "DATABASE_URL is required!"
    exit 1
fi

# Update .env temporarily
cp .env .env.backup
echo "DATABASE_URL=$DB_URL" > .env.temp
grep -v "^DATABASE_URL=" .env >> .env.temp
mv .env.temp .env

echo ""
echo -e "${GREEN}✅ DATABASE_URL configured${NC}"
echo ""

# Run migrations
if [ -f server/scripts/run-migrations.sh ]; then
    chmod +x server/scripts/run-migrations.sh
    ./server/scripts/run-migrations.sh
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✅ Migrations completed successfully!${NC}"
        echo ""
        echo "Your database is now ready for production!"
    else
        echo ""
        echo -e "${YELLOW}⚠️  Migrations had issues. Check the output above.${NC}"
        # Restore backup
        mv .env.backup .env
        exit 1
    fi
else
    echo "Migration script not found!"
    mv .env.backup .env
    exit 1
fi

# Restore original .env (keep DATABASE_URL if it was updated)
if ! grep -q "DATABASE_URL=postgresql://placeholder" .env.backup; then
    # Original had a real DATABASE_URL, restore it
    mv .env.backup .env
else
    # Keep the new DATABASE_URL
    rm .env.backup
fi

echo ""
echo -e "${GREEN}✅ Done! Your database is ready.${NC}"
