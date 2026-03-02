# Authentication Quick Reference for ClarityTracker 2

**Quick Start Guide for Developers**

---

## 1. Basic Setup (30 seconds)

### Step 1: Import Middleware
```typescript
import { verifyToken, requireRole, verifyOwnership, optionalAuth, type AuthRequest } from './middleware/auth';
```

### Step 2: Add to Route
```typescript
// Before
app.get("/api/clients/:therapistId", async (req, res) => {

// After
app.get("/api/clients/:therapistId",
  verifyToken,
  verifyOwnership('therapistId'),
  async (req: AuthRequest, res) => {
```

### Step 3: Access User
```typescript
const userId = req.user?.id;
const userRole = req.user?.role;
const userEmail = req.user?.email;
```

---

## 2. Common Patterns (Copy & Paste)

### Pattern 1: Admin Only
```typescript
app.get("/api/admin/analytics",
  verifyToken,
  requireRole(['admin']),
  async (req: AuthRequest, res) => {
    // Only admins can access
  }
);
```

**Use for:** Admin dashboards, system settings, feature flags

---

### Pattern 2: Own Resource
```typescript
app.get("/api/clients/:therapistId",
  verifyToken,
  verifyOwnership('therapistId'),
  async (req: AuthRequest, res) => {
    // User can only access their own data
    // Admins automatically bypass
  }
);
```

**Use for:** User-specific data (clients, entries, profiles)

---

### Pattern 3: Any Authenticated User
```typescript
app.post("/api/ai/analyze-session",
  express.json(),
  verifyToken,
  async (req: AuthRequest, res) => {
    // Any logged-in user can access
  }
);
```

**Use for:** General features, AI analysis, public tools

---

### Pattern 4: Multiple Roles
```typescript
app.get("/api/supervision/frameworks",
  verifyToken,
  requireRole(['admin', 'supervisor', 'therapist']),
  async (req: AuthRequest, res) => {
    // Multiple roles allowed
  }
);
```

**Use for:** Shared resources, common features

---

### Pattern 5: Optional Auth
```typescript
app.get("/api/health/detailed",
  optionalAuth,
  async (req: AuthRequest, res) => {
    // Works with or without token
    // Show more info if authenticated
    const details = req.user ? getDetailedInfo() : getBasicInfo();
  }
);
```

**Use for:** Public endpoints that enhance with auth

---

### Pattern 6: With Rate Limiting
```typescript
app.post("/api/ai/analyze-content",
  express.json(),
  verifyToken,              // 1. Auth first
  aiAnalysisRateLimit,      // 2. Then rate limit
  async (req: AuthRequest, res) => {
    // Expensive operation
  }
);
```

**Use for:** AI operations, data exports, expensive queries

---

### Pattern 7: Privacy/Data Export
```typescript
app.get("/api/privacy/export-data",
  verifyToken,
  verifyOwnership('userId'),
  dataExportRateLimit,
  async (req: AuthRequest, res) => {
    // HIPAA-critical operation
  }
);
```

**Use for:** Privacy operations, data exports, deletions

---

## 3. Decision Tree

```
Need to protect endpoint?
│
├─ Public/Health Check?
│  └─ Use: optionalAuth or none
│
├─ Admin Operation?
│  └─ Use: verifyToken + requireRole(['admin'])
│
├─ User-Specific Data?
│  ├─ From URL param (:userId)?
│  │  └─ Use: verifyToken + verifyOwnership('userId')
│  │
│  ├─ From query (?userId=...)?
│  │  └─ Use: verifyToken + verifyOwnership('userId')
│  │
│  └─ Complex ownership?
│     └─ Use: verifyToken + custom middleware
│
├─ Expensive Operation (AI, etc)?
│  └─ Use: verifyToken + [rate limit]
│
└─ General Feature?
   └─ Use: verifyToken
```

---

## 4. Middleware Order (Important!)

**Always follow this order:**

```typescript
app.post("/api/endpoint",
  express.json(),           // 1. Body parsing (if needed)
  rateLimitMiddleware,      // 2. Rate limiting (optional)
  verifyToken,              // 3. Authentication
  requireRole([...]),       // 4. Role check (optional)
  verifyOwnership('...'),   // 5. Ownership check (optional)
  async (req, res) => {     // 6. Your handler
```

**Why?**
- Parse body first (needed for validation)
- Rate limit before expensive auth checks (optional)
- Auth before authorization
- Role check before ownership check
- Handler executes last

---

## 5. Quick Fixes

### Fix: "Property 'user' does not exist on Request"
```typescript
// Change this:
async (req: Request, res: Response) => {

// To this:
async (req: AuthRequest, res: Response) => {

// And import AuthRequest:
import { type AuthRequest } from './middleware/auth';
```

---

### Fix: "Cannot read property 'id' of undefined"
```typescript
// Don't assume user exists:
const userId = req.user.id; // ❌ Crashes if no user

// Always check:
const userId = req.user?.id; // ✅ Safe
if (!req.user) {
  return res.status(401).json({ error: "Not authenticated" });
}
```

---

### Fix: "User can access other users' data"
```typescript
// Missing ownership check:
app.get("/api/entries/:userId", verifyToken, handler); // ❌

// Add ownership check:
app.get("/api/entries/:userId",
  verifyToken,
  verifyOwnership('userId'), // ✅
  handler
);
```

---

## 6. Testing Checklist

For each endpoint you protect:

```bash
# 1. No token → 401
curl http://localhost:5000/api/endpoint

# 2. Invalid token → 401
curl -H "Authorization: Bearer invalid" http://localhost:5000/api/endpoint

# 3. Valid token, wrong role → 403
curl -H "Authorization: Bearer <therapist_token>" \
  http://localhost:5000/api/admin/endpoint

# 4. Valid token, not owner → 403
curl -H "Authorization: Bearer <user1_token>" \
  http://localhost:5000/api/entries/user2

# 5. Valid token, correct access → 200
curl -H "Authorization: Bearer <correct_token>" \
  http://localhost:5000/api/endpoint
```

---

## 7. Common Endpoints

### Admin Endpoints (39)
```typescript
app.METHOD("/api/admin/*",
  verifyToken,
  requireRole(['admin']),
  handler
);
```

### Client Endpoints (18)
```typescript
app.get("/api/clients/:therapistId",
  verifyToken,
  verifyOwnership('therapistId'),
  handler
);

app.get("/api/clients/:id/progress",
  verifyToken,
  verifyClientAccess,  // Custom middleware
  handler
);
```

### Supervision Endpoints (35)
```typescript
app.get("/api/supervision/sessions/:supervisorId",
  verifyToken,
  verifyOwnership('supervisorId'),
  handler
);

app.get("/api/supervision/progress/:superviseeId",
  verifyToken,
  verifySuperviseeAccess,  // Custom middleware
  handler
);
```

### AI Endpoints (45)
```typescript
// General AI (any user)
app.post("/api/ai/analyze-session",
  express.json(),
  verifyToken,
  aiAnalysisRateLimit,
  handler
);

// User-specific AI data
app.get("/api/ai/therapy-profile/:userId",
  verifyToken,
  verifyOwnership('userId'),
  handler
);
```

### Privacy Endpoints (10)
```typescript
app.get("/api/privacy/export-data",
  verifyToken,
  verifyOwnership('userId'),  // From query param
  dataExportRateLimit,
  handler
);

app.post("/api/privacy/delete-data",
  express.json(),
  verifyToken,
  verifyOwnership('userId'),  // From body
  handler
);
```

---

## 8. Error Codes Reference

| Code | Status | Meaning | Action |
|------|--------|---------|--------|
| `NO_TOKEN` | 401 | No Authorization header | Add `Authorization: Bearer <token>` |
| `INVALID_TOKEN` | 401 | Invalid JWT signature | Get new token |
| `TOKEN_EXPIRED` | 401 | Token has expired | Refresh token |
| `AUTH_FAILED` | 401 | General auth failure | Check token |
| `FORBIDDEN` | 403 | Wrong role | Check user role |
| `NOT_OWNER` | 403 | Not resource owner | Check user ID |
| `MISSING_RESOURCE_ID` | 400 | Missing parameter | Add required param |
| `RATE_LIMITED` | 429 | Too many requests | Wait and retry |

---

## 9. Frontend Integration

### Setting Token
```typescript
// Store token after login
localStorage.setItem('authToken', response.token);

// Add to all requests
fetch('/api/clients/123', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
  }
});
```

### Axios Interceptor
```typescript
import axios from 'axios';

axios.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### React Hook
```typescript
const useAuth = () => {
  const token = localStorage.getItem('authToken');

  const authFetch = async (url: string, options = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      }
    });
  };

  return { authFetch, token };
};
```

---

## 10. Custom Middleware Templates

### Template: Client Access
```typescript
// server/middleware/client-auth.ts
export const verifyClientAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const clientId = req.params.id || req.params.clientId;
  const userId = req.user?.id;

  // Admin bypass
  if (req.user?.role === 'admin') {
    return next();
  }

  // Check if user is client
  if (userId === clientId) {
    return next();
  }

  // Check if user is therapist of this client
  const client = await db.query.clientTable.findFirst({
    where: eq(clientTable.id, clientId)
  });

  if (client && client.therapistId === userId) {
    return next();
  }

  return res.status(403).json({
    error: 'Access denied',
    code: 'NOT_AUTHORIZED'
  });
};
```

### Template: Supervision Access
```typescript
// server/middleware/supervision-auth.ts
export const verifySuperviseeAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const superviseeId = req.params.superviseeId || req.params.id;
  const userId = req.user?.id;

  // Admin bypass
  if (req.user?.role === 'admin') {
    return next();
  }

  // Check if user is the supervisee
  if (userId === superviseeId) {
    return next();
  }

  // Check if user is supervisor of this supervisee
  const relationship = await storage.getSuperviseeRelationship(superviseeId);
  if (relationship && relationship.supervisorId === userId) {
    return next();
  }

  return res.status(403).json({
    error: 'Access denied',
    code: 'NOT_AUTHORIZED'
  });
};
```

---

## 11. Environment Variables

### Required Variables
```bash
# .env
JWT_SECRET=your_very_long_secret_key_min_32_chars
JWT_EXPIRES_IN=7d  # Optional, defaults to 7 days
```

### Generate Strong Secret
```bash
# In terminal
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 12. Priority Implementation

### Week 1 (CRITICAL)
```typescript
// All admin endpoints
app.*("/api/admin/*", verifyToken, requireRole(['admin']), ...)

// All privacy endpoints
app.*("/api/privacy/*", verifyToken, verifyOwnership(...), ...)

// All client endpoints
app.*("/api/clients/*", verifyToken, verifyOwnership(...), ...)
```

### Week 2 (HIGH)
```typescript
// All supervision endpoints
app.*("/api/supervision/*", verifyToken, verifyOwnership(...), ...)

// All supervisor endpoints
app.*("/api/supervisor*", verifyToken, verifyOwnership(...), ...)
```

### Week 3 (MEDIUM)
```typescript
// All AI endpoints
app.*("/api/ai/*", verifyToken, [aiAnalysisRateLimit], ...)

// All session endpoints
app.*("/api/session*", verifyToken, ...)
```

---

## 13. Troubleshooting

### Problem: "Cannot find module './middleware/auth'"
**Solution:** Check import path is correct relative to your file

### Problem: "JWT_SECRET is not defined"
**Solution:** Add `JWT_SECRET` to your `.env` file

### Problem: "Always getting 401"
**Solution:**
1. Check token is valid: `console.log(req.headers.authorization)`
2. Check token format: Must be `Bearer <token>`
3. Check JWT_SECRET matches between token generation and verification

### Problem: "Admin can't access user data"
**Solution:** verifyOwnership middleware already allows admin bypass. Check admin role in token.

### Problem: "Rate limiting blocks all requests"
**Solution:** Rate limits should be after verifyToken to be per-user, not per-IP

---

## 14. Best Practices

### DO ✅
- Always use AuthRequest type for handlers
- Check `req.user` exists before using
- Test all 5 scenarios (no token, invalid, wrong role, not owner, valid)
- Use ownership checks for user-specific data
- Apply rate limiting to expensive operations
- Log admin actions for audit trail

### DON'T ❌
- Don't skip authentication on sensitive endpoints
- Don't trust client-provided user IDs without verification
- Don't expose internal errors to clients
- Don't use weak JWT secrets
- Don't forget to test edge cases
- Don't assume req.user always exists

---

## 15. Quick Command Reference

### Test Endpoint
```bash
# Get token
TOKEN=$(curl -X POST http://localhost:5000/api/auth/client-login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"password"}' \
  | jq -r '.token')

# Use token
curl http://localhost:5000/api/clients/123 \
  -H "Authorization: Bearer $TOKEN"
```

### Generate Test Token (in Node REPL)
```javascript
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { id: 'user123', email: 'user@test.com', role: 'therapist' },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);
console.log(token);
```

### Run Auth Analysis
```bash
cd server
ts-node scripts/apply-auth.ts --analyze
```

---

## 16. One-Page Cheat Sheet

```
┌─────────────────────────────────────────────────────────────┐
│                   AUTH QUICK REFERENCE                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Import:                                                     │
│    import { verifyToken, requireRole, verifyOwnership,      │
│             optionalAuth, AuthRequest } from './middleware/auth'; │
│                                                              │
│  Admin Only:                                                 │
│    verifyToken, requireRole(['admin'])                       │
│                                                              │
│  Own Resource:                                               │
│    verifyToken, verifyOwnership('userId')                    │
│                                                              │
│  Any User:                                                   │
│    verifyToken                                               │
│                                                              │
│  Optional:                                                   │
│    optionalAuth                                              │
│                                                              │
│  Access User:                                                │
│    req.user?.id                                              │
│    req.user?.role                                            │
│    req.user?.email                                           │
│                                                              │
│  Order:                                                      │
│    express.json() → rateLimit → verifyToken →                │
│    requireRole() → verifyOwnership() → handler               │
│                                                              │
│  Test:                                                       │
│    1. No token → 401                                         │
│    2. Invalid token → 401                                    │
│    3. Wrong role → 403                                       │
│    4. Not owner → 403                                        │
│    5. Valid → 200                                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 17. Need More Help?

- **Comprehensive Guide:** `AUTH_IMPLEMENTATION_PLAN.md`
- **Examples:** `server/examples/auth-endpoint-examples.ts`
- **Testing:** `AUTH_TESTING_CHECKLIST.md`
- **Automation:** `server/scripts/apply-auth.ts`
- **Middleware Source:** `server/middleware/auth.ts`

---

**Last Updated:** 2025-10-28
**Version:** 1.0
**Print this page and keep it handy while implementing!**
