import bcrypt from 'bcrypt';
import { generateToken } from '../middleware/auth';
import { db } from '../db';
import { clientTable } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { logger, logAuth } from '../lib/logger';

/**
 * FIXED: Client Signup with Secure Password Hashing
 *
 * SECURITY IMPROVEMENTS:
 * - Passwords hashed using bcrypt with 10 salt rounds (industry standard)
 * - JWT token generation for stateless authentication
 * - Comprehensive error handling and logging
 * - Input validation for all required fields
 * - Proper HTTP status codes
 * - Security logging for audit trails
 *
 * Replace the code in routes.ts starting at line 5923 (app.post('/api/auth/client-signup'...))
 * through line 5970 (the closing bracket of the route handler)
 */
export async function handleClientSignup(req: any, res: any) {
  try {
    const { firstName, lastName, email, password, communicationConsent } = req.body;

    // Validate input
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        code: 'MISSING_FIELDS'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
        code: 'INVALID_EMAIL'
      });
    }

    // Validate password strength (minimum 8 characters)
    if (password.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long',
        code: 'WEAK_PASSWORD'
      });
    }

    // Check if user already exists
    const existingClient = await db
      .select()
      .from(clientTable)
      .where(eq(clientTable.email, email.toLowerCase()))
      .limit(1);

    if (existingClient.length > 0) {
      return res.status(409).json({
        error: 'Email already registered',
        code: 'EMAIL_EXISTS'
      });
    }

    // SECURITY FIX: Hash password with bcrypt (10 rounds)
    // This replaces the plaintext storage vulnerability
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new client with hashed password
    const [newClient] = await db
      .insert(clientTable)
      .values({
        firstName,
        lastName,
        email: email.toLowerCase(), // Normalize email
        hashedPassword,  // FIXED: Store hashed password instead of plaintext
        accountType: 'standalone',
        communicationConsent: communicationConsent || false,
        onboardingCompleted: false,
      })
      .returning();

    // Generate JWT token for automatic login after signup
    const token = generateToken({
      id: newClient.id,
      email: newClient.email,
      role: 'client'
    });

    // Log successful signup for security audit
    logAuth('signup', {
      userId: newClient.id,
      email: newClient.email,
      ip: req.ip
    });

    logger.info('Client signup successful', {
      userId: newClient.id,
      email: newClient.email
    });

    res.status(201).json({
      success: true,
      client: {
        id: newClient.id,
        firstName: newClient.firstName,
        lastName: newClient.lastName,
        email: newClient.email,
      },
      token
    });
  } catch (error) {
    logger.error('Client signup failed', {
      error: error instanceof Error ? error.message : String(error),
      email: req.body.email
    });

    res.status(500).json({
      error: 'Signup failed',
      code: 'SIGNUP_ERROR'
    });
  }
}

/**
 * FIXED: Client Login with Secure Password Comparison
 *
 * SECURITY IMPROVEMENTS:
 * - Uses bcrypt.compare() for secure password verification
 * - Timing-safe password comparison (prevents timing attacks)
 * - JWT token generation for session management
 * - Generic error messages (doesn't reveal if email exists)
 * - Comprehensive security logging for failed attempts
 * - Proper HTTP status codes
 *
 * Replace the code in routes.ts starting at line 6038 (app.post('/api/auth/client-login'...))
 * through line 6078 (the closing bracket of the route handler)
 */
export async function handleClientLogin(req: any, res: any) {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Find client by email (normalize to lowercase)
    const [client] = await db
      .select()
      .from(clientTable)
      .where(eq(clientTable.email, email.toLowerCase()))
      .limit(1);

    if (!client) {
      // Security best practice: Don't reveal whether email exists
      logAuth('auth_failed', {
        email: email.toLowerCase(),
        ip: req.ip,
        reason: 'user_not_found'
      });

      // Generic error message to prevent user enumeration
      return res.status(401).json({
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // SECURITY FIX: Compare password with bcrypt
    // This replaces the insecure plaintext comparison
    const isValidPassword = await bcrypt.compare(password, client.hashedPassword);

    if (!isValidPassword) {
      logAuth('auth_failed', {
        userId: client.id,
        email: client.email,
        ip: req.ip,
        reason: 'invalid_password'
      });

      // Generic error message to prevent timing attacks
      return res.status(401).json({
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Generate JWT token for session
    const token = generateToken({
      id: client.id,
      email: client.email,
      role: client.role || 'client'
    });

    // Log successful login for security audit
    logAuth('login', {
      userId: client.id,
      email: client.email,
      ip: req.ip
    });

    logger.info('Client login successful', {
      userId: client.id,
      email: client.email
    });

    res.json({
      success: true,
      client: {
        id: client.id,
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        onboardingCompleted: client.onboardingCompleted,
      },
      token
    });
  } catch (error) {
    logger.error('Client login failed', {
      error: error instanceof Error ? error.message : String(error),
      email: req.body.email
    });

    res.status(500).json({
      error: 'Login failed',
      code: 'LOGIN_ERROR'
    });
  }
}

/**
 * USAGE INSTRUCTIONS:
 *
 * 1. Install bcrypt dependency:
 *    npm install bcrypt
 *    npm install --save-dev @types/bcrypt
 *
 * 2. In routes.ts, replace the signup route handler (lines 5923-5970) with:
 *    app.post('/api/auth/client-signup', express.json(), handleClientSignup);
 *
 * 3. In routes.ts, replace the login route handler (lines 6038-6078) with:
 *    app.post('/api/auth/client-login', express.json(), handleClientLogin);
 *
 * 4. Add import at the top of routes.ts:
 *    import { handleClientSignup, handleClientLogin } from './routes/auth-fixes';
 *
 * 5. Run the password migration script for existing users (see migrate-passwords.ts)
 *
 * 6. Test thoroughly before deploying to production
 */
