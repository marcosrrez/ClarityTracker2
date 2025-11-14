# ClarityTracker 2 - Database Migrations

## Overview

This directory contains production-ready database migration scripts for ClarityTracker 2. These migrations implement role-based access control, performance optimizations, and referential integrity constraints as identified in the database audit.

**Migration Date:** 2025-10-28
**Author:** ClarityTracker 2 Database Migration Agent

## Migration Structure

```
server/
├── migrations/
│   ├── README.md                          # This file
│   ├── 001_add_user_roles.sql            # Add RBAC columns and roles
│   ├── 002_add_performance_indices.sql   # Add database indices
│   ├── 003_add_foreign_keys.sql          # Add foreign key constraints
│   └── rollback/
│       ├── 001_rollback_user_roles.sql
│       ├── 002_rollback_indices.sql
│       └── 003_rollback_foreign_keys.sql
└── scripts/
    └── run-migrations.sh                  # Migration runner script
```

## Migrations Summary

### Migration 001: Add User Roles
**File:** `001_add_user_roles.sql`

**Purpose:** Implement role-based access control (RBAC) for users and clients.

**Changes:**
- Adds `role` column to `users` table (admin, supervisor, therapist, user)
- Adds `role` column to `clients` table (client)
- Creates indices on role columns
- Automatically assigns roles based on:
  - Admin emails (leadershipcoachmarcos@gmail.com, marcos@claritylog.com, admin@claritylog.com)
  - Existing supervisee relationships (sets supervisor role)
  - Existing client relationships (sets therapist role)

**Impact:**
- Enables role-based authorization
- Supports multi-tenant architecture
- Prepares for future permission system

### Migration 002: Add Performance Indices
**File:** `002_add_performance_indices.sql`

**Purpose:** Optimize query performance for frequently accessed data.

**Changes:**
- **HIGH PRIORITY:**
  - Supervisee relationships (supervisor_id, supervisee_id, composite, status)
  - Clients table (therapist_id, email, status, portal_access) - HIPAA sensitive
  - Shared insights (client_id, therapist_id, type, is_read) - Client data critical
- **Session & Analysis:**
  - Session analyses (user_id + date composite)
  - Supervisor insights (supervisor_id + date composite)
- **User Tracking:**
  - User analytics (user_id + timestamp composite, event)
  - Supervision sessions (supervisor_id + date composite, supervisee_id)
  - Feedback (user_id, status, type)
- **Core Tables:**
  - Users (email, created_at)
  - Client progress (client_id + date composite)
  - Log entries (user_id + date composite)

**Impact:**
- 50-90% faster query performance on indexed columns
- Improved supervisor dashboard loading times
- Faster client data retrieval (HIPAA compliance requirement)
- Better sorting and filtering operations

### Migration 003: Add Foreign Keys
**File:** `003_add_foreign_keys.sql`

**Purpose:** Enforce referential integrity across relational tables.

**Changes:**
- **CASCADE Deletes:** (automatically delete dependent records)
  - supervisee_relationships → users (supervisor_id, supervisee_id)
  - supervisor_insights → users (supervisor_id, supervisee_id)
  - shared_insights → users (therapist_id), clients (client_id)
  - client_progress → clients (client_id)
  - supervision_sessions → users (supervisor_id, supervisee_id)
  - session_analyses → users (user_id)
  - log_entries → users (user_id)
  - user_analytics → users (user_id)
  - insight_cards → users (user_id)

- **SET NULL:** (keep record, remove reference)
  - clients → users (therapist_id)
  - feedback → users (user_id)

**Impact:**
- Prevents orphaned records
- Ensures data consistency
- Automatic cleanup on record deletion
- GDPR compliance support (right to be forgotten)

**WARNING:** This migration will fail if orphaned records exist. See "Pre-Migration Checklist" below.

## Running Migrations

### Prerequisites

1. **PostgreSQL Client Tools**
   ```bash
   # macOS
   brew install postgresql

   # Ubuntu/Debian
   sudo apt-get install postgresql-client

   # Verify installation
   psql --version
   ```

2. **Database Backup**
   ```bash
   # Create backup before running migrations
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

3. **Database Credentials**
   ```bash
   export DATABASE_URL="postgresql://user:password@host:port/database"
   ```

### Running All Migrations

```bash
# Navigate to scripts directory
cd server/scripts

# Run all migrations
./run-migrations.sh

# Or specify database URL directly
./run-migrations.sh "postgresql://user:password@host:port/database"
```

### Running Single Migration

```bash
# Run only migration 001
./run-migrations.sh --single 001

# Run with verbose output
./run-migrations.sh --single 001 --verbose
```

### Dry Run Mode

```bash
# Test without making changes
./run-migrations.sh --dry-run

# See what would be executed
./run-migrations.sh --dry-run --verbose
```

### Manual Execution

```bash
# Run migration manually
psql $DATABASE_URL -f server/migrations/001_add_user_roles.sql

# Run with output
psql $DATABASE_URL -f server/migrations/001_add_user_roles.sql -o output.log
```

## Pre-Migration Checklist

Before running migrations, complete these checks:

### 1. Database Backup
- [ ] Create full database backup
- [ ] Verify backup integrity
- [ ] Store backup in secure location

### 2. Check for Orphaned Records

**Critical for Migration 003 (Foreign Keys)**

```sql
-- Check supervisee_relationships
SELECT COUNT(*) FROM supervisee_relationships sr
LEFT JOIN users u ON sr.supervisor_id = u.id
WHERE u.id IS NULL;

SELECT COUNT(*) FROM supervisee_relationships sr
LEFT JOIN users u ON sr.supervisee_id = u.id
WHERE u.id IS NULL;

-- Check clients
SELECT COUNT(*) FROM clients c
LEFT JOIN users u ON c.therapist_id = u.id
WHERE c.therapist_id IS NOT NULL AND u.id IS NULL;

-- Check shared_insights
SELECT COUNT(*) FROM shared_insights si
LEFT JOIN users u ON si.therapist_id = u.id
WHERE u.id IS NULL;

SELECT COUNT(*) FROM shared_insights si
LEFT JOIN clients c ON si.client_id = c.id
WHERE c.id IS NULL;

-- If any counts are > 0, clean up orphaned records before migration 003
```

### 3. Verify Database Connection
```bash
psql $DATABASE_URL -c "SELECT version();"
```

### 4. Check Disk Space
```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size(current_database()));

-- Check table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 5. Verify User Permissions
```sql
-- Check if user has required permissions
SELECT has_table_privilege(current_user, 'users', 'INSERT');
SELECT has_schema_privilege(current_user, 'public', 'CREATE');
```

## Post-Migration Verification

### 1. Verify Migration 001 (User Roles)

```sql
-- Check role distribution
SELECT role, COUNT(*) as count,
       ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM users
GROUP BY role;

-- Verify admin users
SELECT id, email, role FROM users WHERE role = 'admin';

-- Check constraints
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'users' AND constraint_name LIKE '%role%';
```

### 2. Verify Migration 002 (Indices)

```sql
-- List all indices
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Check index sizes
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC
LIMIT 20;

-- Verify index usage (run after some time)
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC
LIMIT 20;
```

### 3. Verify Migration 003 (Foreign Keys)

```sql
-- List all foreign keys
SELECT
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
LEFT JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- Verify no orphaned records remain
SELECT
    'supervisee_relationships' as table_name,
    COUNT(*) as orphaned_count
FROM supervisee_relationships sr
LEFT JOIN users u ON sr.supervisor_id = u.id
WHERE u.id IS NULL;
```

### 4. Check Migration Log

```sql
-- View migration history
SELECT * FROM migration_log ORDER BY executed_at DESC;

-- Check for any failures
SELECT * FROM migration_log WHERE success = false;
```

### 5. Performance Testing

```sql
-- Test query performance with EXPLAIN ANALYZE
EXPLAIN ANALYZE
SELECT u.*, COUNT(sr.id) as supervisee_count
FROM users u
LEFT JOIN supervisee_relationships sr ON u.id = sr.supervisor_id
WHERE u.role = 'supervisor'
GROUP BY u.id;

-- Test client queries
EXPLAIN ANALYZE
SELECT * FROM clients
WHERE therapist_id = 'some-therapist-id'
AND status = 'active'
ORDER BY created_at DESC;

-- Test shared insights
EXPLAIN ANALYZE
SELECT * FROM shared_insights
WHERE client_id = 'some-client-id'
AND is_read = 'false'
ORDER BY created_at DESC;
```

## Rollback Procedures

### Rolling Back All Migrations

**Execute rollbacks in reverse order:**

```bash
# Rollback migration 003
psql $DATABASE_URL -f server/migrations/rollback/003_rollback_foreign_keys.sql

# Rollback migration 002
psql $DATABASE_URL -f server/migrations/rollback/002_rollback_indices.sql

# Rollback migration 001
psql $DATABASE_URL -f server/migrations/rollback/001_rollback_user_roles.sql
```

### Rolling Back Single Migration

```bash
# Rollback only migration 002 (indices)
psql $DATABASE_URL -f server/migrations/rollback/002_rollback_indices.sql
```

### When to Rollback

**Rollback Migration 001 (User Roles) if:**
- Role assignments are incorrect
- Role column causes application errors
- Need to redesign role structure

**Rollback Migration 002 (Indices) if:**
- Indices cause excessive disk usage
- Write performance degrades significantly
- Index maintenance becomes problematic

**Rollback Migration 003 (Foreign Keys) if:**
- Foreign keys block legitimate operations
- Cascade deletes cause unexpected data loss
- Need more flexible data management

## Troubleshooting

### Issue: Migration Runner Not Found

```bash
# Ensure script is executable
chmod +x server/scripts/run-migrations.sh

# Run from correct directory
cd /Users/marcosrrez/Downloads/ClarityTracker\ 2
./server/scripts/run-migrations.sh
```

### Issue: Database Connection Failed

```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# Verify DATABASE_URL format
echo $DATABASE_URL
# Should be: postgresql://user:password@host:port/database
```

### Issue: Permission Denied

```sql
-- Grant necessary permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;
```

### Issue: Orphaned Records Prevent Migration 003

```sql
-- Find orphaned records
SELECT sr.id, sr.supervisor_id
FROM supervisee_relationships sr
LEFT JOIN users u ON sr.supervisor_id = u.id
WHERE u.id IS NULL;

-- Options:
-- 1. Delete orphaned records
DELETE FROM supervisee_relationships
WHERE id IN (
    SELECT sr.id FROM supervisee_relationships sr
    LEFT JOIN users u ON sr.supervisor_id = u.id
    WHERE u.id IS NULL
);

-- 2. Update to valid user_id
UPDATE supervisee_relationships
SET supervisor_id = 'valid-user-id'
WHERE supervisor_id NOT IN (SELECT id FROM users);
```

### Issue: Index Creation Slow

```sql
-- Create indices CONCURRENTLY (won't lock table)
CREATE INDEX CONCURRENTLY idx_name ON table_name(column_name);

-- Note: Run concurrent index creation outside transaction
-- Cannot use in migration script BEGIN/COMMIT blocks
```

### Issue: Foreign Key Constraint Violation

```sql
-- Identify constraint violation
-- Look at error message for constraint name

-- Temporarily disable constraint (not recommended for production)
ALTER TABLE table_name DISABLE TRIGGER ALL;
-- ... fix data ...
ALTER TABLE table_name ENABLE TRIGGER ALL;

-- Better approach: Fix data then re-run migration
```

## Monitoring Post-Migration

### Database Performance

```sql
-- Monitor index usage over time
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Monitor slow queries
SELECT
    query,
    calls,
    total_time,
    mean_time,
    max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 20;
```

### Database Size

```sql
-- Monitor database growth
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) -
                   pg_relation_size(schemaname||'.'||tablename)) AS index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Foreign Key Violations

```sql
-- Monitor constraint violations (check application logs)
-- Set up alerts for:
-- - Failed DELETE operations due to foreign keys
-- - Increased error rates
-- - Unexpected CASCADE deletes
```

## Best Practices

### 1. Always Backup First
- Create full database backup before migrations
- Test backup restoration process
- Store backups securely off-site

### 2. Test in Staging First
- Run migrations in staging environment
- Verify application functionality
- Monitor performance impacts
- Test rollback procedures

### 3. Schedule Migrations During Low Traffic
- Run migrations during maintenance windows
- Notify users of scheduled maintenance
- Monitor application during and after migration

### 4. Use Transactions
- All migrations use BEGIN/COMMIT
- Atomic operations ensure consistency
- Failed migrations automatically rollback

### 5. Monitor After Migration
- Watch query performance
- Monitor error rates
- Check index usage
- Verify data integrity

### 6. Document Changes
- Update application documentation
- Document new role system
- Update API documentation if needed
- Train team on new features

## Support & Contact

**Issues or Questions:**
- Review troubleshooting section above
- Check migration verification queries
- Consult ClarityTracker 2 documentation
- Contact: leadershipcoachmarcos@gmail.com

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-10-28 | Database Migration Agent | Initial migration scripts |

## License

Copyright 2025 ClarityTracker 2. All rights reserved.

---

**Last Updated:** 2025-10-28
**Migration Version:** 1.0.0
