#!/bin/bash
# ============================================================================
# ClarityTracker 2 - Migration Verification Script
# ============================================================================
# Purpose: Verify database state after running migrations
# Date: 2025-10-28
# Author: ClarityTracker 2 Database Migration Agent
#
# Usage:
#   ./verify-migrations.sh [database_url]
#
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}============================================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Get database URL
DATABASE_URL="${1:-$DATABASE_URL}"

if [ -z "$DATABASE_URL" ]; then
    print_error "DATABASE_URL not set"
    echo "Usage: $0 [database_url]"
    exit 1
fi

print_header "ClarityTracker 2 - Migration Verification"
echo ""

# ============================================================================
# Verify Migration 001: User Roles
# ============================================================================
print_header "Verifying Migration 001: User Roles"
echo ""

print_info "Checking users.role column..."
USERS_ROLE_EXISTS=$(psql "$DATABASE_URL" -t -c "
    SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'role'
    );
" | xargs)

if [ "$USERS_ROLE_EXISTS" = "t" ]; then
    print_success "users.role column exists"
else
    print_error "users.role column missing"
fi

print_info "Checking clients.role column..."
CLIENTS_ROLE_EXISTS=$(psql "$DATABASE_URL" -t -c "
    SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'clients' AND column_name = 'role'
    );
" | xargs)

if [ "$CLIENTS_ROLE_EXISTS" = "t" ]; then
    print_success "clients.role column exists"
else
    print_error "clients.role column missing"
fi

print_info "User role distribution:"
psql "$DATABASE_URL" -c "
    SELECT role, COUNT(*) as count
    FROM users
    GROUP BY role
    ORDER BY count DESC;
"

echo ""

# ============================================================================
# Verify Migration 002: Indices
# ============================================================================
print_header "Verifying Migration 002: Performance Indices"
echo ""

print_info "Counting indices created..."
INDEX_COUNT=$(psql "$DATABASE_URL" -t -c "
    SELECT COUNT(*)
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%';
" | xargs)

print_success "Found $INDEX_COUNT indices"

print_info "High-priority indices:"
psql "$DATABASE_URL" -c "
    SELECT tablename, indexname
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND (
        indexname LIKE 'idx_supervisee_relationships_%'
        OR indexname LIKE 'idx_clients_%'
        OR indexname LIKE 'idx_shared_insights_%'
    )
    ORDER BY tablename, indexname;
"

echo ""

# ============================================================================
# Verify Migration 003: Foreign Keys
# ============================================================================
print_header "Verifying Migration 003: Foreign Keys"
echo ""

print_info "Counting foreign key constraints..."
FK_COUNT=$(psql "$DATABASE_URL" -t -c "
    SELECT COUNT(*)
    FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY'
    AND table_schema = 'public';
" | xargs)

print_success "Found $FK_COUNT foreign key constraints"

print_info "Foreign key constraints by table:"
psql "$DATABASE_URL" -c "
    SELECT
        table_name,
        COUNT(*) as constraint_count
    FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY'
    AND table_schema = 'public'
    GROUP BY table_name
    ORDER BY constraint_count DESC, table_name;
"

echo ""

print_info "Checking for orphaned records..."
psql "$DATABASE_URL" -c "
    SELECT
        'supervisee_relationships - orphaned supervisors' as check_type,
        COUNT(*) as orphaned_count
    FROM supervisee_relationships sr
    LEFT JOIN users u ON sr.supervisor_id = u.id
    WHERE u.id IS NULL

    UNION ALL

    SELECT
        'clients - orphaned therapists' as check_type,
        COUNT(*) as orphaned_count
    FROM clients c
    LEFT JOIN users u ON c.therapist_id = u.id
    WHERE c.therapist_id IS NOT NULL AND u.id IS NULL;
"

echo ""

# ============================================================================
# Database Size Report
# ============================================================================
print_header "Database Size Report"
echo ""

print_info "Overall database size:"
psql "$DATABASE_URL" -c "
    SELECT pg_size_pretty(pg_database_size(current_database())) as database_size;
"

print_info "Top 10 largest tables:"
psql "$DATABASE_URL" -c "
    SELECT
        tablename,
        pg_size_pretty(pg_total_relation_size('public.'||tablename)) AS total_size,
        pg_size_pretty(pg_relation_size('public.'||tablename)) AS table_size,
        pg_size_pretty(pg_total_relation_size('public.'||tablename) -
                       pg_relation_size('public.'||tablename)) AS index_size
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size('public.'||tablename) DESC
    LIMIT 10;
"

echo ""

# ============================================================================
# Migration Log
# ============================================================================
print_header "Migration Log"
echo ""

MIGRATION_LOG_EXISTS=$(psql "$DATABASE_URL" -t -c "
    SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'migration_log'
    );
" | xargs)

if [ "$MIGRATION_LOG_EXISTS" = "t" ]; then
    print_success "Migration log table exists"
    echo ""
    print_info "Recent migrations:"
    psql "$DATABASE_URL" -c "
        SELECT
            migration_name,
            executed_at,
            success
        FROM migration_log
        ORDER BY executed_at DESC
        LIMIT 10;
    "
else
    print_error "Migration log table not found"
fi

echo ""

# ============================================================================
# Summary
# ============================================================================
print_header "Verification Summary"
echo ""

TOTAL_CHECKS=0
PASSED_CHECKS=0

# Check 1: User roles
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
[ "$USERS_ROLE_EXISTS" = "t" ] && PASSED_CHECKS=$((PASSED_CHECKS + 1))

# Check 2: Client roles
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
[ "$CLIENTS_ROLE_EXISTS" = "t" ] && PASSED_CHECKS=$((PASSED_CHECKS + 1))

# Check 3: Indices
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
[ "$INDEX_COUNT" -gt 0 ] && PASSED_CHECKS=$((PASSED_CHECKS + 1))

# Check 4: Foreign keys
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
[ "$FK_COUNT" -gt 0 ] && PASSED_CHECKS=$((PASSED_CHECKS + 1))

echo "Checks passed: $PASSED_CHECKS / $TOTAL_CHECKS"

if [ $PASSED_CHECKS -eq $TOTAL_CHECKS ]; then
    print_success "All verification checks passed!"
    exit 0
else
    print_error "Some verification checks failed"
    exit 1
fi
