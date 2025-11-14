# Quick Start: Password Security Fix

**URGENT SECURITY FIX - 30-Minute Quick Implementation**

## TL;DR

Your app stores passwords in plaintext. This fixes it. Follow these steps exactly.

---

## Step 1: Install Dependencies (2 minutes)

```bash
cd "/Users/marcosrrez/Downloads/ClarityTracker 2"
npm install bcrypt @types/bcrypt
```

---

## Step 2: Backup Database (5 minutes)

```bash
# Replace with your actual database credentials
pg_dump -U your_username -d claritytracker > backup_$(date +%Y%m%d).sql
```

---

## Step 3: Update routes.ts (10 minutes)

### 3.1 Add Import (Top of file, around line 1-50)

```typescript
import { handleClientSignup, handleClientLogin } from './routes/auth-fixes';
```

### 3.2 Replace Signup Handler (Lines 5923-5970)

**Find this:**
```typescript
app.post('/api/auth/client-signup', express.json(), async (req, res) => {
  // ... 47 lines of code ...
});
```

**Replace with:**
```typescript
app.post('/api/auth/client-signup', express.json(), handleClientSignup);
```

### 3.3 Replace Login Handler (Lines 6038-6078)

**Find this:**
```typescript
app.post('/api/auth/client-login', express.json(), async (req, res) => {
  // ... 40 lines of code ...
});
```

**Replace with:**
```typescript
app.post('/api/auth/client-login', express.json(), handleClientLogin);
```

---

## Step 4: Migrate Existing Passwords (5 minutes)

### Test First (Dry Run):
```bash
npx tsx server/scripts/migrate-passwords.ts
```

### If Output Shows Plaintext Passwords, Run For Real:
```bash
DRY_RUN=false npx tsx server/scripts/migrate-passwords.ts
```

### If No Users Exist Yet:
Skip this step entirely.

---

## Step 5: Test (5 minutes)

### Test Signup:
```bash
curl -X POST http://localhost:5000/api/auth/client-signup \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@example.com","password":"TestPass123"}'
```

Expected: Status 201, returns token

### Test Login:
```bash
curl -X POST http://localhost:5000/api/auth/client-login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123"}'
```

Expected: Status 200, returns token

### Verify Database:
```bash
# Check that passwords are hashed (should start with $2b$)
psql -U user -d db -c "SELECT LEFT(hashed_password, 10) FROM clients LIMIT 1;"
```

Expected: `$2b$10$...`

---

## Step 6: Deploy (3 minutes)

```bash
# Build
npm run build

# Restart your app
pm2 restart claritytracker
# OR
systemctl restart claritytracker
# OR
npm start
```

---

## Verification Checklist

- [ ] bcrypt installed (`npm list bcrypt`)
- [ ] Database backed up (backup file exists)
- [ ] Import added to routes.ts
- [ ] Signup handler replaced
- [ ] Login handler replaced
- [ ] Passwords migrated (if users exist)
- [ ] Signup test passed
- [ ] Login test passed
- [ ] Database shows hashed passwords ($2b$...)
- [ ] App restarted successfully

---

## If Something Goes Wrong

### Rollback Code:
```bash
git checkout HEAD~1 server/routes.ts
pm2 restart claritytracker
```

### Rollback Database (Emergency Only):
```bash
psql -U user -d db < backup_20241028.sql
```

---

## What Changed?

| Before | After |
|--------|-------|
| `hashedPassword: password` | `hashedPassword: await bcrypt.hash(password, 10)` |
| `if (hashedPassword !== password)` | `if (await bcrypt.compare(password, hashedPassword))` |
| Passwords readable in database | Passwords encrypted with bcrypt |
| HIPAA violation | HIPAA compliant |

---

## Need More Details?

Read the full documentation:
- **Implementation Guide:** `/Users/marcosrrez/Downloads/ClarityTracker 2/server/AUTHENTICATION_MIGRATION.md`
- **Security Report:** `/Users/marcosrrez/Downloads/ClarityTracker 2/SECURITY_IMPLEMENTATION_REPORT.md`
- **Fixed Code:** `/Users/marcosrrez/Downloads/ClarityTracker 2/server/routes/auth-fixes.ts`

---

## Support

**Common Issues:**

1. **"Cannot find module 'bcrypt'"**
   - Run: `npm install bcrypt`

2. **"JWT_SECRET not set"**
   - Add to .env: `JWT_SECRET=your-secret-key`

3. **Login fails after migration**
   - Check migration logs: `cat logs/password-migration-*.log`
   - Verify hash format: Should start with `$2b$`

4. **Migration script errors**
   - Re-run in dry-run mode: `npx tsx server/scripts/migrate-passwords.ts`
   - Check database connection
   - Verify no database locks

---

**Estimated Total Time:** 30 minutes

**GO FIX IT NOW!**
