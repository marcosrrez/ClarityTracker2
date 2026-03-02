import { readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';

/**
 * One-time migration endpoint
 * Call this once to run migrations: POST /api/migrate
 * 
 * SECURITY: Add authentication before using in production!
 */

const migrationsDir = join(process.cwd(), 'server', 'migrations');
const migrations = [
  '001_add_user_roles.sql',
  '002_add_performance_indices.sql',
  '003_add_foreign_keys.sql',
];

export default async function handler(req: any, res: any) {
  // SECURITY: Add authentication check here!
  // if (!req.headers.authorization || req.headers.authorization !== 'Bearer YOUR_SECRET_TOKEN') {
  //   return res.status(401).json({ error: 'Unauthorized' });
  // }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    return res.status(500).json({ error: 'DATABASE_URL not configured' });
  }

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
  });

  const results: any[] = [];

  try {
    // Test connection
    await pool.query('SELECT 1');

    // Run migrations
    for (const migration of migrations) {
      try {
        const filePath = join(migrationsDir, migration);
        const sql = readFileSync(filePath, 'utf-8');
        await pool.query(sql);
        results.push({ migration, status: 'success' });
      } catch (error: any) {
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          results.push({ migration, status: 'skipped', reason: 'already applied' });
        } else {
          results.push({ migration, status: 'failed', error: error.message });
          throw error;
        }
      }
    }

    await pool.end();

    return res.status(200).json({
      success: true,
      message: 'Migrations completed',
      results,
    });
  } catch (error: any) {
    await pool.end();
    return res.status(500).json({
      success: false,
      error: error.message,
      results,
    });
  }
}
