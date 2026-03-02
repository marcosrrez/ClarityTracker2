# 🗄️ Running Migrations in Neon SQL Editor

## Step-by-Step Instructions

### Step 1: Clear the Editor
1. In Neon SQL Editor, click **"New Query"** or clear the example code
2. You should have a blank editor

---

### Step 2: Run Migration 001 (User Roles)

1. **Copy the entire contents** of: `server/migrations/001_add_user_roles.sql`
2. **Paste** into the Neon SQL editor
3. Click **"Run"** button (or press Ctrl+Enter / Cmd+Enter)
4. **Wait for completion** - you should see success messages

**Expected:** You'll see notices like:
- "Successfully added role column to users table"
- "Successfully added role column to clients table"
- Role distribution queries at the end

**Note:** If you see warnings about tables not existing, that's okay! The migrations are designed to handle that.

---

### Step 3: Run Migration 002 (Performance Indices)

1. Click **"New Query"** to clear the editor
2. **Copy the entire contents** of: `server/migrations/002_add_performance_indices.sql`
3. **Paste** into the Neon SQL editor
4. Click **"Run"**
5. **Wait for completion**

**Expected:** You'll see notices like:
- "Created supervisee_relationships indices"
- "Created clients indices"
- "Created shared_insights indices"
- etc.

At the end, you'll see a list of all created indices.

---

### Step 4: Run Migration 003 (Foreign Keys)

1. Click **"New Query"** to clear the editor
2. **Copy the entire contents** of: `server/migrations/003_add_foreign_keys.sql`
3. **Paste** into the Neon SQL editor
4. Click **"Run"**
5. **Wait for completion**

**Expected:** You'll see notices like:
- "Created supervisee_relationships foreign keys"
- "Created clients foreign keys"
- etc.

At the end, you'll see verification queries showing all foreign keys.

**Note:** If you get errors about orphaned records, that's okay for a fresh database - there won't be any orphaned records.

---

## ✅ Verification

After all three migrations, you should see:
- ✅ All migrations completed without errors
- ✅ Indices created (from Migration 002)
- ✅ Foreign keys created (from Migration 003)

---

## 🚨 Troubleshooting

### "Table does not exist" warnings
**This is normal!** The migrations check if tables exist first. If your database is fresh, some tables won't exist yet. The app will create them when needed.

### "Already exists" errors
**This is also normal!** If you run a migration twice, PostgreSQL will tell you things already exist. That's fine - it means the migration already ran.

### Connection errors
- Make sure you're connected to the correct database branch
- Check that your Neon project is active

---

## 🎉 Done!

Once all three migrations complete successfully, your database is ready!

**Next:** Test your production app at: `https://claritytracker-2.vercel.app`
