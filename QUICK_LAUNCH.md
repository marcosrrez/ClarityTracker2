# ⚡ QUICK LAUNCH GUIDE - Get Live in 30 Minutes!

**Status:** Ready to execute!  
**Time:** 30 minutes to production

---

## 🚀 Step-by-Step Launch

### Step 1: Set Up Database (5 minutes)

Run the database setup helper:
```bash
./setup-database.sh
```

**Or manually:**
1. Go to https://neon.tech
2. Sign up (free)
3. Create project: `claritytracker-prod`
4. Copy connection string
5. Update `.env`:
   ```bash
   DATABASE_URL=postgresql://your-connection-string-here
   ```

---

### Step 2: Run Migrations (2 minutes)

```bash
./server/scripts/run-migrations.sh
```

Expected output:
```
✓ Migration 001: User roles - SUCCESS
✓ Migration 002: Performance indices - SUCCESS
✓ Migration 003: Foreign keys - SUCCESS
```

---

### Step 3: Test Locally (Optional - 5 minutes)

```bash
./test-local.sh
```

Or manually:
```bash
npm start
# In another terminal:
curl http://localhost:5000/api/health
```

---

### Step 4: Deploy to Vercel (15 minutes)

**Option A: Automated (Recommended)**
```bash
./deploy.sh
```

**Option B: Manual**
```bash
# Install Vercel CLI (if needed)
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Add environment variables
vercel env add DATABASE_URL
# Paste your database URL

vercel env add JWT_SECRET
# Paste from .env file

vercel env add NODE_ENV
# Type: production

# Deploy to production
vercel --prod
```

---

### Step 5: Verify Production (3 minutes)

1. Get your production URL from Vercel
2. Test health endpoint:
   ```bash
   curl https://your-app.vercel.app/api/health
   ```
3. Test signup:
   ```bash
   curl -X POST https://your-app.vercel.app/api/auth/client-signup \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"TestPass123","firstName":"Test","lastName":"User"}'
   ```
4. Open in browser and test!

---

## ✅ Success Checklist

- [ ] Database configured
- [ ] Migrations run successfully
- [ ] App builds without errors
- [ ] Deployed to Vercel
- [ ] Environment variables set in Vercel
- [ ] Production URL accessible
- [ ] Health endpoint returns 200
- [ ] Signup endpoint works
- [ ] Login endpoint works

---

## 🆘 Troubleshooting

### Database Connection Error
```bash
# Test connection
psql "$DATABASE_URL" -c "SELECT 1"
```

### Build Fails
```bash
rm -rf node_modules dist
npm install
npm run build
```

### Migration Fails
Check `DATABASE_URL` is correct in `.env`

### Deployment Fails
```bash
vercel logs
vercel --prod --force
```

---

## 🎉 You're Live!

Once deployed, your app will be available at:
`https://your-project-name.vercel.app`

**Next Steps:**
1. Monitor logs: `vercel logs`
2. Set up monitoring (Sentry)
3. Test with real users
4. Iterate based on feedback

---

**Ready? Run: `./setup-database.sh` to get started!** 🚀
