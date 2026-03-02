# Database Migration Instructions

Since the local connection to Neon is having issues, here are two ways to run migrations:

## Option 1: Run Migrations via Neon SQL Editor (Easiest)

1. Go to your Neon dashboard: https://console.neon.tech
2. Select your project: `neondb`
3. Click on "SQL Editor" in the left sidebar
4. Copy and paste each migration file one at a time:

**Migration 001:**
```sql
-- Copy contents from: server/migrations/001_add_user_roles.sql
```

**Migration 002:**
```sql
-- Copy contents from: server/migrations/002_add_performance_indices.sql
```

**Migration 003:**
```sql
-- Copy contents from: server/migrations/003_add_foreign_keys.sql
```

5. Click "Run" after each migration
6. Verify success messages

## Option 2: Use Neon CLI (If Installed)

```bash
# Install Neon CLI
npm install -g neonctl

# Login
neonctl auth

# Run migrations
neonctl sql execute --project-id YOUR_PROJECT_ID --file server/migrations/001_add_user_roles.sql
neonctl sql execute --project-id YOUR_PROJECT_ID --file server/migrations/002_add_performance_indices.sql
neonctl sql execute --project-id YOUR_PROJECT_ID --file server/migrations/003_add_foreign_keys.sql
```

## Option 3: Test Production First

Your app is already deployed! The migrations might not be critical for initial testing. You can:

1. Test your production URL: `https://claritytracker-2.vercel.app`
2. Try creating a user account
3. If you get database errors, then run migrations via Option 1

## Quick Check: Are Migrations Needed?

The app might work without migrations if the database schema already exists. Test first, then migrate if needed!

---

**Recommended:** Use Option 1 (Neon SQL Editor) - it's the simplest and most reliable.
