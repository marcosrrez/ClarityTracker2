#!/bin/bash
# ============================================================================
# ClarityTracker 2 - Local Testing Script
# ============================================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🧪 Local Testing${NC}"
echo "=========================================="
echo ""

# Check DATABASE_URL
if ! grep -q "DATABASE_URL=postgresql://" .env || grep -q "DATABASE_URL=postgresql://placeholder" .env; then
    echo -e "${RED}❌ DATABASE_URL not configured!${NC}"
    echo ""
    echo "Please run: ./setup-database.sh"
    exit 1
fi

# Check if dist exists
if [ ! -d dist ]; then
    echo -e "${YELLOW}⚠️  Build not found. Building now...${NC}"
    npm run build
fi

echo -e "${GREEN}✅ Build ready${NC}"
echo ""
echo "Starting server on http://localhost:5000"
echo "Press Ctrl+C to stop"
echo ""
echo "Testing endpoints:"
echo "  Health: curl http://localhost:5000/api/health"
echo "  Signup: curl -X POST http://localhost:5000/api/auth/client-signup \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"email\":\"test@example.com\",\"password\":\"TestPass123\",\"firstName\":\"Test\",\"lastName\":\"User\"}'"
echo ""

# Start server
npm start
