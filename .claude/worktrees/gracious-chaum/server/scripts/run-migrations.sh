#!/bin/bash
# ============================================================================
# ClarityTracker 2 - Database Migration Runner
# ============================================================================
# Purpose: Execute database migrations in sequence
# Date: 2025-10-28
# Author: ClarityTracker 2 Database Migration Agent
#
# Usage:
#   ./run-migrations.sh [database_url] [options]
#
# Options:
#   --dry-run    Show what would be executed without running migrations
#   --single N   Run only migration N (e.g., --single 001)
#   --verbose    Show detailed output from PostgreSQL
#   --help       Show this help message
#
# Environment Variables:
#   DATABASE_URL    PostgreSQL connection string
#                   Format: postgresql://user:password@host:port/database
#
# Examples:
#   ./run-migrations.sh
#   ./run-migrations.sh postgresql://user:pass@localhost:5432/claritytracker
#   ./run-migrations.sh --dry-run
#   ./run-migrations.sh --single 001
#
# ============================================================================

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MIGRATIONS_DIR="$PROJECT_ROOT/migrations"
DRY_RUN=false
VERBOSE=false
SINGLE_MIGRATION=""

# ============================================================================
# Helper Functions
# ============================================================================

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

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

show_help() {
    cat << EOF
ClarityTracker 2 - Database Migration Runner

Usage: $0 [database_url] [options]

Options:
    --dry-run       Show what would be executed without running migrations
    --single N      Run only migration N (e.g., --single 001)
    --verbose       Show detailed output from PostgreSQL
    --help          Show this help message

Environment Variables:
    DATABASE_URL    PostgreSQL connection string (required if not passed as argument)
                    Format: postgresql://user:password@host:port/database

Examples:
    $0
    $0 postgresql://user:pass@localhost:5432/claritytracker
    $0 --dry-run
    $0 --single 001

Available Migrations:
EOF
    if [ -d "$MIGRATIONS_DIR" ]; then
        for migration in "$MIGRATIONS_DIR"/*.sql; do
            if [ -f "$migration" ]; then
                echo "    - $(basename "$migration")"
            fi
        done
    fi
}

check_prerequisites() {
    print_info "Checking prerequisites..."

    # Check if psql is installed
    if ! command -v psql &> /dev/null; then
        print_error "psql command not found. Please install PostgreSQL client tools."
        exit 1
    fi

    # Check if migrations directory exists
    if [ ! -d "$MIGRATIONS_DIR" ]; then
        print_error "Migrations directory not found: $MIGRATIONS_DIR"
        exit 1
    fi

    # Check if there are any migration files
    if [ -z "$(ls -A "$MIGRATIONS_DIR"/*.sql 2>/dev/null)" ]; then
        print_error "No migration files found in: $MIGRATIONS_DIR"
        exit 1
    fi

    print_success "Prerequisites check passed"
}

verify_database_connection() {
    print_info "Verifying database connection..."

    if [ "$DRY_RUN" = true ]; then
        print_warning "Dry run mode: Skipping connection verification"
        return 0
    fi

    if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
        print_success "Database connection successful"
    else
        print_error "Failed to connect to database"
        print_error "Connection string: ${DATABASE_URL%%:*}://[REDACTED]"
        exit 1
    fi
}

run_migration() {
    local migration_file=$1
    local migration_name=$(basename "$migration_file")

    echo ""
    print_header "Running Migration: $migration_name"

    if [ "$DRY_RUN" = true ]; then
        print_warning "Dry run mode: Would execute $migration_name"
        if [ "$VERBOSE" = true ]; then
            echo -e "\n${BLUE}--- Migration Content ---${NC}"
            cat "$migration_file"
            echo -e "${BLUE}--- End Migration Content ---${NC}\n"
        fi
        return 0
    fi

    # Run the migration
    local start_time=$(date +%s)

    if [ "$VERBOSE" = true ]; then
        psql "$DATABASE_URL" -f "$migration_file"
    else
        psql "$DATABASE_URL" -f "$migration_file" > /dev/null 2>&1
    fi

    local exit_code=$?
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    if [ $exit_code -eq 0 ]; then
        print_success "$migration_name completed successfully (${duration}s)"
    else
        print_error "$migration_name failed with exit code $exit_code"
        print_error "Migration aborted. Please check the error messages above."
        exit $exit_code
    fi
}

create_migration_log() {
    if [ "$DRY_RUN" = true ]; then
        return 0
    fi

    print_info "Creating migration log table..."

    psql "$DATABASE_URL" << 'EOF' > /dev/null 2>&1
CREATE TABLE IF NOT EXISTS migration_log (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL,
    executed_at TIMESTAMP DEFAULT NOW(),
    success BOOLEAN DEFAULT true,
    error_message TEXT
);
EOF

    print_success "Migration log table ready"
}

log_migration() {
    local migration_name=$1
    local success=${2:-true}
    local error_message=${3:-""}

    if [ "$DRY_RUN" = true ]; then
        return 0
    fi

    psql "$DATABASE_URL" << EOF > /dev/null 2>&1
INSERT INTO migration_log (migration_name, success, error_message)
VALUES ('$migration_name', $success, '$error_message');
EOF
}

# ============================================================================
# Parse Command Line Arguments
# ============================================================================

DATABASE_URL=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --single)
            SINGLE_MIGRATION="$2"
            shift 2
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            if [ -z "$DATABASE_URL" ]; then
                DATABASE_URL="$1"
            else
                print_error "Unknown option: $1"
                show_help
                exit 1
            fi
            shift
            ;;
    esac
done

# Use environment variable if DATABASE_URL not provided
if [ -z "$DATABASE_URL" ]; then
    DATABASE_URL="${DATABASE_URL:-}"
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    print_error "DATABASE_URL not set"
    echo ""
    echo "Usage: $0 [database_url]"
    echo "   or: export DATABASE_URL=postgresql://user:pass@host:port/db"
    echo "       $0"
    exit 1
fi

# ============================================================================
# Main Execution
# ============================================================================

print_header "ClarityTracker 2 - Database Migration Runner"

if [ "$DRY_RUN" = true ]; then
    print_warning "Running in DRY RUN mode - no changes will be made"
fi

echo ""
print_info "Project Root: $PROJECT_ROOT"
print_info "Migrations Directory: $MIGRATIONS_DIR"
print_info "Database: ${DATABASE_URL%%:*}://[REDACTED]"

if [ -n "$SINGLE_MIGRATION" ]; then
    print_info "Mode: Single migration ($SINGLE_MIGRATION)"
else
    print_info "Mode: All migrations"
fi

echo ""

# Run prerequisite checks
check_prerequisites
verify_database_connection
create_migration_log

# Get list of migrations
if [ -n "$SINGLE_MIGRATION" ]; then
    MIGRATIONS=("$MIGRATIONS_DIR/${SINGLE_MIGRATION}_"*.sql)
    if [ ! -f "${MIGRATIONS[0]}" ]; then
        print_error "Migration not found: ${SINGLE_MIGRATION}"
        exit 1
    fi
else
    MIGRATIONS=("$MIGRATIONS_DIR"/*.sql)
fi

# Sort migrations (they should already be sorted by name)
IFS=$'\n' MIGRATIONS=($(sort -V <<<"${MIGRATIONS[*]}"))
unset IFS

# Count migrations
TOTAL_MIGRATIONS=${#MIGRATIONS[@]}
print_info "Found $TOTAL_MIGRATIONS migration(s) to run"

# Run each migration
COMPLETED=0
FAILED=0

for migration in "${MIGRATIONS[@]}"; do
    if [ -f "$migration" ]; then
        run_migration "$migration"
        if [ $? -eq 0 ]; then
            COMPLETED=$((COMPLETED + 1))
            log_migration "$(basename "$migration")" true ""
        else
            FAILED=$((FAILED + 1))
            log_migration "$(basename "$migration")" false "Migration failed"
            break
        fi
    fi
done

# Print summary
echo ""
print_header "Migration Summary"
echo ""
print_info "Total migrations: $TOTAL_MIGRATIONS"
print_success "Completed: $COMPLETED"

if [ $FAILED -gt 0 ]; then
    print_error "Failed: $FAILED"
    echo ""
    print_error "Migration process failed. Please review errors above."
    exit 1
else
    echo ""
    print_success "All migrations completed successfully!"

    if [ "$DRY_RUN" = false ]; then
        echo ""
        print_info "Next steps:"
        print_info "  1. Verify database changes"
        print_info "  2. Test application functionality"
        print_info "  3. Monitor performance"
        print_info "  4. Review migration log:"
        print_info "     SELECT * FROM migration_log ORDER BY executed_at DESC;"
    fi
fi

echo ""
print_header "Migration Runner Complete"

exit 0
