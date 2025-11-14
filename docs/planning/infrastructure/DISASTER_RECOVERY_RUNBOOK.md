# ClarityLog Disaster Recovery Runbook

## Overview
- **Recovery Time Objective (RTO)**: 30 minutes
- **Recovery Point Objective (RPO)**: 15 minutes
- **Last Tested**: 2025-01-16 (Initial Implementation)

## Emergency Contacts

### System Administrator - Primary Contact
- **Phone**: TBD
- **Email**: admin@claritylog.com

### Database Administrator - Database Recovery
- **Phone**: TBD
- **Email**: dba@claritylog.com

### Development Team Lead - Application Recovery
- **Phone**: TBD
- **Email**: dev@claritylog.com

## Recovery Procedures

### Database Recovery (CRITICAL Priority)
**Estimated Time**: 15 minutes
**Required Personnel**: Database Admin, System Admin
**Dependencies**: None

**Description**: Restore PostgreSQL database from backup

**Steps**:

1. **Stop all application services** (2 min)
   - Command: `sudo systemctl stop claritylog-app`
   - Verification: Verify no connections to database

2. **Restore database from latest backup** (10 min)
   - Command: `pg_restore -d claritylog_production [BACKUP_FILE]`
   - Verification: Verify table counts match expected values

3. **Restart application services** (3 min)
   - Command: `sudo systemctl start claritylog-app`
   - Verification: Verify application responds to health checks

### Application Recovery (CRITICAL Priority)
**Estimated Time**: 20 minutes
**Required Personnel**: System Admin, Developer
**Dependencies**: Database Recovery

**Description**: Restore application from backup or redeploy

**Steps**:

1. **Deploy application from known good state** (10 min)
   - Command: `git checkout [LAST_KNOWN_GOOD_COMMIT] && npm run build`
   - Verification: Verify build completes successfully

2. **Configure environment variables and secrets** (5 min)
   - Verification: Verify all required environment variables are set

3. **Start application services** (5 min)
   - Command: `npm run start`
   - Verification: Verify application health check passes

### Data Integrity Verification (HIGH Priority)
**Estimated Time**: 10 minutes
**Required Personnel**: Database Admin
**Dependencies**: Database Recovery

**Description**: Verify data integrity after recovery

**Steps**:

1. **Verify all tables exist and have expected structure** (3 min)
   - Verification: All critical tables present with correct schema

2. **Verify data counts match expected ranges** (3 min)
   - Verification: User and log entry counts within expected ranges

3. **Verify foreign key relationships are intact** (4 min)
   - Verification: No orphaned records detected

## Pre-Recovery Checklist
- [ ] Assess scope of disaster
- [ ] Notify emergency contacts
- [ ] Identify last known good backup
- [ ] Verify backup integrity
- [ ] Prepare staging environment for testing
- [ ] Document incident details

## Post-Recovery Checklist
- [ ] Verify all systems operational
- [ ] Test critical user workflows
- [ ] Monitor system performance
- [ ] Document recovery process
- [ ] Update runbook based on lessons learned
- [ ] Schedule post-incident review

## Testing Schedule
- **Daily**: Automated backup verification
- **Weekly**: Recovery test (dry run)
- **Monthly**: Full recovery test (staging environment)
- **Quarterly**: Complete disaster recovery drill

## Recovery Metrics
- Database recovery time: Target < 15 minutes
- Application recovery time: Target < 20 minutes
- Full system recovery time: Target < 30 minutes
- Data integrity verification: Target < 10 minutes

## API Endpoints for Recovery Management

### Backup Verification
- **POST** `/api/admin/backup-verification` - Trigger backup verification
- **GET** `/api/admin/backup-status` - Check latest backup status
- **GET** `/api/admin/backup-history` - View backup verification history

### Disaster Recovery Testing
- **GET** `/api/admin/disaster-recovery/plan` - View recovery plan
- **POST** `/api/admin/disaster-recovery/test` - Test specific recovery procedure
- **POST** `/api/admin/disaster-recovery/test-all` - Test all recovery procedures
- **GET** `/api/admin/disaster-recovery/test-history` - View test results

### System Health Monitoring
- **GET** `/api/admin/system-health` - Overall system health status
- **GET** `/api/admin/rate-limit/stats` - Rate limiting statistics
- **POST** `/api/admin/rate-limit/cleanup` - Cleanup old rate limit logs

## Automated Tasks

### Daily Tasks (2:00 AM)
- Backup verification and integrity checks
- Automated restore testing to staging environment
- Email alerts for any backup failures

### Weekly Tasks (Sunday 3:00 AM)
- Dry run of all recovery procedures
- Recovery test reporting
- Documentation updates if needed

### Monthly Tasks (1st of month 4:00 AM)
- Rate limit log cleanup (keep 30 days)
- Backup retention policy enforcement
- Recovery runbook review

### Hourly Tasks
- System health monitoring
- Critical alert detection
- Performance metrics collection

## Rate Limiting Configuration

### Endpoint Protection Levels
- **Public endpoints**: 100 requests/15 minutes
- **Authenticated endpoints**: 500 requests/15 minutes
- **AI analysis endpoints**: 10 requests/minute
- **Admin endpoints**: 50 requests/hour
- **Data export endpoints**: 5 requests/day

### Rate Limit Response
```json
{
  "error": "Too many requests",
  "message": "You have exceeded your request limit. Please try again later.",
  "retryAfter": 900
}
```

## Backup Verification Process

### Verification Components
1. **File Integrity**: Backup file completeness and corruption checks
2. **Content Verification**: Essential database elements presence
3. **Restore Testing**: Automated restore to staging environment
4. **Data Consistency**: Orphaned records and relationship integrity

### Verification Results
- **Success**: All checks passed, backup is reliable
- **Warning**: Minor issues detected, backup usable with caution
- **Failure**: Critical issues detected, backup may be unreliable

### Alert Triggers
- Backup verification failures
- Restore test failures
- Data integrity issues
- Performance degradation

## Emergency Procedures

### Immediate Response (First 5 minutes)
1. Assess the severity and scope of the incident
2. Notify the primary emergency contact
3. Begin documenting the incident timeline
4. Identify the last known good backup
5. Determine if this is a partial or complete system failure

### System Recovery (Next 25 minutes)
1. Execute appropriate recovery procedures based on failure type
2. Monitor recovery progress and system health
3. Verify data integrity after each major step
4. Test critical system functionality
5. Document any deviations from standard procedures

### Post-Recovery (After restoration)
1. Conduct thorough system testing
2. Monitor for any residual issues
3. Document lessons learned
4. Update procedures based on experience
5. Schedule post-incident review meeting

## Compliance and Documentation

### HIPAA Compliance
- All backup and recovery procedures maintain HIPAA compliance
- Patient data protection throughout recovery process
- Audit trail documentation for all recovery activities

### Audit Requirements
- Complete timeline of recovery actions
- Personnel involved in recovery efforts
- Data integrity verification results
- System downtime duration and impact

### Reporting
- Incident summary report within 24 hours
- Detailed technical report within 72 hours
- Compliance report if applicable
- Lessons learned documentation

---

*This runbook should be reviewed and updated quarterly or after any major system changes. Last updated: January 16, 2025*

## Quick Reference Commands

### Backup Commands
```bash
# Create backup
pg_dump "$DATABASE_URL" > "backup_$(date +%Y%m%d_%H%M%S).sql"

# Restore from backup  
pg_restore -d claritylog_production backup_file.sql

# Verify backup integrity
psql -c "SELECT COUNT(*) FROM log_entries; SELECT COUNT(*) FROM users;"
```

### Application Commands
```bash
# Stop application
sudo systemctl stop claritylog-app

# Start application
sudo systemctl start claritylog-app

# Check application status
curl -f http://localhost:3000/health || echo "Application not responding"

# Deploy from known good state
git checkout [COMMIT_HASH] && npm run build && npm run start
```

### Monitoring Commands
```bash
# Check system health
curl -H "Authorization: Bearer [ADMIN_TOKEN]" http://localhost:3000/api/admin/system-health

# Check backup status
curl -H "Authorization: Bearer [ADMIN_TOKEN]" http://localhost:3000/api/admin/backup-status

# View rate limit stats
curl -H "Authorization: Bearer [ADMIN_TOKEN]" http://localhost:3000/api/admin/rate-limit/stats
```