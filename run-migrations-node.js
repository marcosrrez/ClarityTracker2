#!/usr/bin/env node
/**
 * Run database migrations using Node.js
 * This works better with Neon's connection pooling
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pkg from 'pg';
const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set');
  console.error('Set it with: export DATABASE_URL="postgresql://..."');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
});

const migrationsDir = join(__dirname, 'server', 'migrations');
const migrations = [
  '001_add_user_roles.sql',
  '002_add_performance_indices.sql',
  '003_add_foreign_keys.sql',
];

async function runMigration(filename) {
  const filePath = join(migrationsDir, filename);
  const sql = readFileSync(filePath, 'utf-8');
  
  console.log(`\n📄 Running ${filename}...`);
  
  try {
    await pool.query(sql);
    console.log(`✅ ${filename} - SUCCESS`);
    return true;
  } catch (error) {
    console.error(`❌ ${filename} - FAILED`);
    console.error(`   Error: ${error.message}`);
    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      console.log(`   ⚠️  This is okay - migration already applied`);
      return true;
    }
    throw error;
  }
}

async function main() {
  console.log('🚀 Running Database Migrations');
  console.log('================================\n');
  
  try {
    // Test connection
    console.log('🔍 Testing database connection...');
    await pool.query('SELECT 1');
    console.log('✅ Connection successful\n');
    
    // Run migrations
    for (const migration of migrations) {
      await runMigration(migration);
    }
    
    console.log('\n✅ All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
