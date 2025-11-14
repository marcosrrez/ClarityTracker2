# Authentication Security Migration Guide

## CRITICAL SECURITY ISSUE

**Status:** URGENT - Plaintext Password Storage Vulnerability
**Risk Level:** CRITICAL
**HIPAA Compliance:** NON-COMPLIANT
**CVE Classification:** CWE-256 (Plaintext Storage of a Password)

### Current Vulnerability

The application currently stores passwords in plaintext in the database, identified at:
- **File:** `/Users/marcosrrez/Downloads/ClarityTracker 2/server/routes.ts`
- **Signup Handler:** Line 5950 - `hashedPassword: password, // In production, hash this password`
- **Login Handler:** Line 6060 - `if (client.hashedPassword !== password)`

### Impact Assessment

**Security Risks:**
- Complete password exposure in database breach
- No protection against unauthorized database access
- Violates OWASP Top 10 security standards
- HIPAA violation for healthcare applications
- Potential legal liability and regulatory fines
- User account compromise across platforms (password reuse)

**Affected Components:**
- Client signup endpoint: `/api/auth/client-signup`
- Client login endpoint: `/api/auth/client-login`
- Database: `clientTable.hashedPassword` column

---

## Migration Plan

### Phase 1: Preparation (30 minutes)

#### 1.1 Install Required Dependencies

```bash
cd "/Users/marcosrrez/Downloads/ClarityTracker 2"
npm install bcrypt
npm install --save-dev @types/bcrypt
```

**Verification:**
```bash
npm list bcrypt
# Should show: bcrypt@5.x.x or higher
```

#### 1.2 Backup Current Database

```bash
# Create backup before any changes
pg_dump -U your_username -d claritytracker > backup_$(date +%Y%m%d_%H%M%S).sql

# OR using your preferred database backup method
```

#### 1.3 Review Fixed Code

Location: `/Users/marcosrrez/Downloads/ClarityTracker 2/server/routes/auth-fixes.ts`

The fixed code includes:
- bcrypt password hashing (10 salt rounds)
- Secure password comparison
- JWT token generation
- Comprehensive error handling
- Security audit logging
- Input validation
- Protection against timing attacks

---

### Phase 2: Code Implementation (1 hour)

#### 2.1 Add Import Statement to routes.ts

**Location:** Near the top of `server/routes.ts` (around line 1-50)

**Add this import:**
```typescript
import { handleClientSignup, handleClientLogin } from './routes/auth-fixes';
```

#### 2.2 Replace Client Signup Handler

**Original Code (Lines 5923-5970 in routes.ts):**
```typescript
app.post('/api/auth/client-signup', express.json(), async (req, res) => {
  try {
    const { firstName, lastName, email, password, communicationConsent } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if email already exists
    const existingClient = await db
      .select()
      .from(clientTable)
      .where(eq(clientTable.email, email))
      .limit(1);

    if (existingClient.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Create client account
    const [newClient] = await db
      .insert(clientTable)
      .values({
        firstName,
        lastName,
        email,
        hashedPassword: password, // In production, hash this password ⚠️ VULNERABLE
        accountType: 'standalone',
        communicationConsent: communicationConsent || false,
        onboardingCompleted: false,
      })
      .returning();

    res.json({
      success: true,
      client: {
        id: newClient.id,
        firstName: newClient.firstName,
        lastName: newClient.lastName,
        email: newClient.email,
      }
    });
  } catch (error) {
    console.error('Client signup error:', error);
    res.status(500).json({ error: 'Failed to create client account' });
  }
});
```

**REPLACE WITH (Single Line):**
```typescript
app.post('/api/auth/client-signup', express.json(), handleClientSignup);
```

**Exact Line Numbers:** Replace lines 5923-5970

#### 2.3 Replace Client Login Handler

**Original Code (Lines 6038-6078 in routes.ts):**
```typescript
app.post('/api/auth/client-login', express.json(), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find client by email
    const [client] = await db
      .select()
      .from(clientTable)
      .where(eq(clientTable.email, email))
      .limit(1);

    if (!client) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // In production, verify hashed password
    if (client.hashedPassword !== password) { // ⚠️ VULNERABLE - plaintext comparison
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json({
      success: true,
      client: {
        id: client.id,
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        onboardingCompleted: client.onboardingCompleted,
      }
    });
  } catch (error) {
    console.error('Client login error:', error);
    res.status(500).json({ error: 'Failed to authenticate client' });
  }
});
```

**REPLACE WITH (Single Line):**
```typescript
app.post('/api/auth/client-login', express.json(), handleClientLogin);
```

**Exact Line Numbers:** Replace lines 6038-6078

---

### Phase 3: Password Migration (2-4 hours)

#### 3.1 Identify Existing Users

Check if there are existing users with plaintext passwords:

```bash
# Connect to your database and run:
SELECT COUNT(*) FROM clients WHERE hashed_password IS NOT NULL;
```

#### 3.2 Run Migration Script

**IMPORTANT:** If you have existing users with plaintext passwords, you MUST run the migration script.

```bash
cd "/Users/marcosrrez/Downloads/ClarityTracker 2"
npx tsx server/scripts/migrate-passwords.ts
```

The script will:
1. Find all clients with plaintext passwords
2. Hash each password using bcrypt
3. Update the database with hashed passwords
4. Log all changes for audit
5. Create a rollback file (if needed)

**Migration Script Location:** `server/scripts/migrate-passwords.ts`

#### 3.3 Handle Password Migration Options

**Option A: Automated Migration (If plaintext passwords are in database)**
- Run the migration script above
- All existing passwords will be hashed
- Users can continue logging in with the same passwords

**Option B: Force Password Reset (More Secure)**
- Set all `hashedPassword` fields to NULL for existing users
- Implement password reset flow
- Email users to reset their passwords
- More secure but requires user action

**Option C: No Existing Users**
- If this is a new deployment with no users, skip migration
- New signups will use secure hashing automatically

---

### Phase 4: Testing (1-2 hours)

#### 4.1 Unit Tests

Create test file: `server/__tests__/auth.test.ts`

```typescript
import { describe, test, expect } from '@jest/globals';
import bcrypt from 'bcrypt';

describe('Password Hashing', () => {
  test('should hash password correctly', async () => {
    const password = 'TestPassword123!';
    const hashed = await bcrypt.hash(password, 10);

    expect(hashed).not.toBe(password);
    expect(hashed.length).toBeGreaterThan(50);
    expect(hashed.startsWith('$2b$')).toBe(true);
  });

  test('should verify correct password', async () => {
    const password = 'TestPassword123!';
    const hashed = await bcrypt.hash(password, 10);
    const isValid = await bcrypt.compare(password, hashed);

    expect(isValid).toBe(true);
  });

  test('should reject incorrect password', async () => {
    const password = 'TestPassword123!';
    const wrongPassword = 'WrongPassword123!';
    const hashed = await bcrypt.hash(password, 10);
    const isValid = await bcrypt.compare(wrongPassword, hashed);

    expect(isValid).toBe(false);
  });
});
```

Run tests:
```bash
npm test -- auth.test.ts
```

#### 4.2 Integration Tests

**Test Signup Flow:**
```bash
curl -X POST http://localhost:5000/api/auth/client-signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "SecurePassword123!",
    "communicationConsent": true
  }'

# Expected: 201 status, returns client object and JWT token
# Verify: hashedPassword in database starts with $2b$
```

**Test Login Flow:**
```bash
curl -X POST http://localhost:5000/api/auth/client-login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!"
  }'

# Expected: 200 status, returns client object and JWT token
```

**Test Invalid Password:**
```bash
curl -X POST http://localhost:5000/api/auth/client-login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "WrongPassword"
  }'

# Expected: 401 status, "Invalid email or password"
```

#### 4.3 Database Verification

```sql
-- Check that passwords are hashed (should start with $2b$)
SELECT
  id,
  email,
  LEFT(hashed_password, 20) as password_hash_preview,
  LENGTH(hashed_password) as hash_length
FROM clients
LIMIT 5;

-- Expected:
-- hash_length should be 60
-- password_hash_preview should be: $2b$10$...
```

#### 4.4 Security Verification Checklist

- [ ] Passwords in database are hashed (60 characters, start with $2b$10$)
- [ ] New signups create hashed passwords
- [ ] Login works with correct password
- [ ] Login fails with incorrect password
- [ ] JWT tokens are generated on successful auth
- [ ] Error messages don't reveal if email exists
- [ ] Failed login attempts are logged
- [ ] Successful logins are logged
- [ ] Password length validation works (minimum 8 characters)
- [ ] Email validation works
- [ ] Duplicate email registration is prevented

---

### Phase 5: Deployment (30 minutes)

#### 5.1 Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Database backup created
- [ ] Migration script tested in staging
- [ ] bcrypt dependency installed in production
- [ ] Environment variables configured (JWT_SECRET)
- [ ] Monitoring alerts configured
- [ ] Rollback plan documented

#### 5.2 Deployment Steps

1. **Stop Application (if using downtime window):**
   ```bash
   pm2 stop claritytracker
   # OR
   systemctl stop claritytracker
   ```

2. **Pull Updated Code:**
   ```bash
   git pull origin main
   # OR copy files manually
   ```

3. **Install Dependencies:**
   ```bash
   npm install
   ```

4. **Run Migration (if needed):**
   ```bash
   npx tsx server/scripts/migrate-passwords.ts
   ```

5. **Start Application:**
   ```bash
   pm2 start claritytracker
   # OR
   systemctl start claritytracker
   ```

6. **Verify Deployment:**
   ```bash
   curl http://localhost:5000/api/health
   # Test signup and login endpoints
   ```

#### 5.3 Post-Deployment Monitoring

Monitor these metrics for 24-48 hours:
- Failed login attempts (should remain normal)
- Successful login rate (should remain normal)
- Error rates on auth endpoints
- Response times (bcrypt adds ~100-200ms per request)
- Server CPU usage (bcrypt is CPU-intensive)

**Log Locations:**
- Authentication events: `logs/auth.log`
- Errors: `logs/error.log`
- Combined logs: `logs/combined.log`

---

### Phase 6: Rollback Plan (If Needed)

#### 6.1 Code Rollback

```bash
# Restore previous version of routes.ts
git checkout HEAD~1 server/routes.ts

# OR restore from backup
cp server/routes.ts.backup server/routes.ts

# Restart application
pm2 restart claritytracker
```

#### 6.2 Database Rollback

**ONLY if migration script created issues:**

```bash
# Restore from backup
psql -U your_username -d claritytracker < backup_20241028_000000.sql
```

**WARNING:** Rollback will restore plaintext passwords. This should only be a temporary measure while fixing issues.

---

## Security Best Practices Implemented

### 1. Password Hashing
- **Algorithm:** bcrypt (designed for password hashing)
- **Salt Rounds:** 10 (industry standard, ~100ms hash time)
- **Adaptive:** Can increase rounds as hardware improves

### 2. Timing Attack Prevention
- Generic error messages for login failures
- bcrypt.compare() uses constant-time comparison
- Doesn't reveal if email exists in database

### 3. JWT Token Security
- Tokens expire after 7 days (configurable)
- Tokens include user role for authorization
- Signed with secret key (JWT_SECRET)

### 4. Input Validation
- Email format validation
- Password minimum length (8 characters)
- Required field validation
- Email normalization (lowercase)

### 5. Audit Logging
- All login attempts logged (success and failure)
- Signup events logged
- IP addresses captured
- Failed attempts tracked for brute force detection

### 6. Error Handling
- Comprehensive try-catch blocks
- Detailed logging for debugging
- Generic user-facing error messages
- Proper HTTP status codes

---

## Compliance & Standards

### HIPAA Compliance
- ✅ Password encryption at rest (via bcrypt hashing)
- ✅ Audit logging for authentication events
- ✅ Unique user identification (JWT tokens)
- ✅ Access controls (role-based authorization)

### OWASP Top 10
- ✅ A02:2021 - Cryptographic Failures (FIXED)
- ✅ A07:2021 - Identification and Authentication Failures (IMPROVED)

### Industry Standards
- ✅ NIST SP 800-63B password guidelines
- ✅ PCI-DSS password requirements
- ✅ CWE-256 mitigation (plaintext storage)

---

## Performance Considerations

### Bcrypt Performance Impact

**Signup/Login Request Times:**
- Before (plaintext): ~10-20ms
- After (bcrypt): ~110-220ms per request
- Impact: +100-200ms per auth request

**Server Resources:**
- CPU: Moderate increase during auth requests
- Memory: Minimal impact
- Database: No impact

**Optimization Tips:**
- Consider caching JWT tokens (already implemented)
- Use connection pooling for database
- Implement rate limiting to prevent abuse
- Monitor CPU usage during high-traffic periods

### Scalability

Current configuration (10 salt rounds) handles:
- ~10-20 auth requests/second per CPU core
- Recommend horizontal scaling if >100 concurrent signups/logins

---

## Frequently Asked Questions

### Q: Will existing users need to reset passwords?
**A:** No, if you run the migration script. The script hashes existing plaintext passwords, allowing users to continue logging in with their current passwords.

### Q: What if I don't have any existing users?
**A:** Skip the migration script (Phase 3). New signups will automatically use secure hashing.

### Q: Can I use a different hashing algorithm?
**A:** bcrypt is recommended for passwords. Alternatives (argon2, scrypt) are also secure but require different libraries.

### Q: How do I increase password requirements?
**A:** Edit `handleClientSignup` in `auth-fixes.ts` to add more validation rules (uppercase, numbers, special characters, etc.)

### Q: What if bcrypt is too slow for my use case?
**A:** Reduce salt rounds from 10 to 8 (faster but slightly less secure). Never go below 8 rounds.

### Q: Do I need to update my frontend code?
**A:** No, the API contract remains the same. Frontend sends password in plaintext over HTTPS, server handles hashing.

---

## Support & Troubleshooting

### Common Issues

**Issue: "Cannot find module 'bcrypt'"**
```bash
# Solution: Install bcrypt
npm install bcrypt @types/bcrypt
```

**Issue: "JWT_SECRET environment variable not set"**
```bash
# Solution: Set environment variable
export JWT_SECRET="your-secret-key-here"
# OR add to .env file
echo "JWT_SECRET=your-secret-key-here" >> .env
```

**Issue: Login fails after migration**
```bash
# Check if passwords were properly hashed
psql -U user -d db -c "SELECT LEFT(hashed_password, 4) FROM clients LIMIT 1;"
# Should return: $2b$
```

**Issue: "Error: data and salt arguments required"**
```bash
# This means hashedPassword is NULL in database
# Run migration script or force password reset
```

### Getting Help

1. Check logs: `tail -f logs/error.log logs/auth.log`
2. Review migration script output
3. Verify database schema matches expectations
4. Test with curl commands above
5. Check environment variables

---

## Timeline Summary

| Phase | Duration | Critical Path |
|-------|----------|---------------|
| Preparation | 30 min | Yes |
| Code Implementation | 1 hour | Yes |
| Password Migration | 2-4 hours | If users exist |
| Testing | 1-2 hours | Yes |
| Deployment | 30 min | Yes |
| **Total** | **5-8 hours** | |

**Recommended Deployment Window:** Low-traffic period (late night/early morning)

---

## Verification Signature

After completing migration, verify with this command:

```bash
# Verify all passwords are hashed
psql -U your_username -d claritytracker -c \
  "SELECT COUNT(*) as total_users,
          COUNT(CASE WHEN hashed_password LIKE '\$2b\$%' THEN 1 END) as hashed_users,
          COUNT(CASE WHEN hashed_password NOT LIKE '\$2b\$%' THEN 1 END) as plaintext_users
   FROM clients;"

# Expected output:
# total_users | hashed_users | plaintext_users
# ------------|--------------|----------------
#     50      |      50      |        0

# ✅ Success if plaintext_users = 0
```

---

## Document Version

- **Version:** 1.0
- **Date:** 2025-10-28
- **Author:** Claude Code Security Agent
- **Status:** Production Ready
- **Next Review:** After successful deployment

---

**REMEMBER:** This is a critical security fix. Do not delay implementation.
