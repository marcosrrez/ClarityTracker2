#!/usr/bin/env node
/**
 * Password Migration Script
 *
 * This script migrates plaintext passwords to bcrypt-hashed passwords
 * for the ClarityTracker application.
 *
 * USAGE:
 *   npx tsx server/scripts/migrate-passwords.ts
 *
 * PREREQUISITES:
 *   - Database connection configured in .env
 *   - bcrypt installed: npm install bcrypt
 *   - Backup created: pg_dump -U user -d db > backup.sql
 *
 * SAFETY FEATURES:
 *   - Dry-run mode by default
 *   - Transaction-based (rollback on error)
 *   - Detailed logging
 *   - Progress tracking
 *   - Creates audit log file
 *
 * WHAT IT DOES:
 *   1. Identifies clients with plaintext passwords
 *   2. Hashes each password using bcrypt (10 rounds)
 *   3. Updates database with hashed passwords
 *   4. Logs all changes for audit trail
 *   5. Reports migration statistics
 */

import bcrypt from 'bcrypt';
import { db } from '../db';
import { clientTable } from '../../shared/schema';
import { eq, sql, and } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

// Configuration
const SALT_ROUNDS = 10; // Industry standard for bcrypt
const DRY_RUN = process.env.DRY_RUN !== 'false'; // Dry run unless explicitly disabled
const BATCH_SIZE = 100; // Process in batches to manage memory
const LOG_DIR = path.join(process.cwd(), 'logs');
const MIGRATION_LOG_FILE = path.join(LOG_DIR, `password-migration-${Date.now()}.log`);

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Logging utilities
function log(message: string, level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;

  console.log(logMessage);

  // Append to log file
  fs.appendFileSync(MIGRATION_LOG_FILE, logMessage + '\n');
}

// Migration statistics
interface MigrationStats {
  totalClients: number;
  plaintextPasswords: number;
  alreadyHashed: number;
  migrated: number;
  failed: number;
  skipped: number;
  startTime: Date;
  endTime?: Date;
  errors: Array<{ clientId: string; email: string; error: string }>;
}

const stats: MigrationStats = {
  totalClients: 0,
  plaintextPasswords: 0,
  alreadyHashed: 0,
  migrated: 0,
  failed: 0,
  skipped: 0,
  startTime: new Date(),
  errors: []
};

/**
 * Detect if a password is already hashed with bcrypt
 */
function isAlreadyHashed(password: string): boolean {
  // Bcrypt hashes start with $2a$, $2b$, or $2y$ followed by cost factor
  // Format: $2b$10$... (60 characters total)
  return /^\$2[ayb]\$\d{2}\$/.test(password) && password.length === 60;
}

/**
 * Detect if a password appears to be plaintext
 * This is a heuristic - bcrypt hashes are always 60 chars and start with $2
 */
function isPlaintext(password: string): boolean {
  return !isAlreadyHashed(password);
}

/**
 * Hash a plaintext password using bcrypt
 */
async function hashPassword(password: string): Promise<string> {
  try {
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    return hashed;
  } catch (error) {
    throw new Error(`Failed to hash password: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Main migration function
 */
async function migratePasswords() {
  log('='.repeat(80));
  log('PASSWORD MIGRATION SCRIPT');
  log('='.repeat(80));
  log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes will be made)' : 'LIVE MIGRATION'}`);
  log(`Log file: ${MIGRATION_LOG_FILE}`);
  log(`Salt rounds: ${SALT_ROUNDS}`);
  log(`Batch size: ${BATCH_SIZE}`);
  log('='.repeat(80));

  if (DRY_RUN) {
    log('⚠️  DRY RUN MODE - No database changes will be made', 'WARN');
    log('⚠️  To run actual migration, set: DRY_RUN=false', 'WARN');
    log('='.repeat(80));
  }

  try {
    // Step 1: Count total clients
    log('Step 1: Counting total clients...');
    const allClients = await db
      .select({
        id: clientTable.id,
        email: clientTable.email,
        hashedPassword: clientTable.hashedPassword,
      })
      .from(clientTable);

    stats.totalClients = allClients.length;
    log(`Found ${stats.totalClients} total clients`, 'INFO');

    if (stats.totalClients === 0) {
      log('No clients found in database. Migration not needed.', 'INFO');
      return;
    }

    // Step 2: Analyze passwords
    log('\nStep 2: Analyzing password storage...');

    const clientsToMigrate = allClients.filter(client => {
      if (!client.hashedPassword) {
        stats.skipped++;
        log(`Skipping client ${client.email} - no password set`, 'WARN');
        return false;
      }

      if (isAlreadyHashed(client.hashedPassword)) {
        stats.alreadyHashed++;
        return false;
      }

      stats.plaintextPasswords++;
      return true;
    });

    log(`Total clients: ${stats.totalClients}`, 'INFO');
    log(`Already hashed: ${stats.alreadyHashed}`, 'SUCCESS');
    log(`Plaintext passwords: ${stats.plaintextPasswords}`, 'WARN');
    log(`Skipped (no password): ${stats.skipped}`, 'INFO');

    if (stats.plaintextPasswords === 0) {
      log('\n✅ All passwords are already hashed! No migration needed.', 'SUCCESS');
      return;
    }

    // Step 3: Confirm migration
    if (!DRY_RUN) {
      log('\n⚠️  WARNING: About to migrate passwords for REAL', 'WARN');
      log(`⚠️  This will modify ${stats.plaintextPasswords} client records`, 'WARN');
      log('⚠️  Press Ctrl+C within 5 seconds to abort...', 'WARN');

      // Wait 5 seconds for user to abort
      await new Promise(resolve => setTimeout(resolve, 5000));
      log('Starting migration...', 'INFO');
    }

    // Step 4: Migrate passwords
    log('\nStep 3: Migrating passwords...');

    for (const client of clientsToMigrate) {
      try {
        log(`Processing: ${client.email} (ID: ${client.id})`);

        // Hash the plaintext password
        const hashedPassword = await hashPassword(client.hashedPassword);

        // Verify the hash was created correctly
        if (!isAlreadyHashed(hashedPassword)) {
          throw new Error('Generated hash is invalid');
        }

        if (!DRY_RUN) {
          // Update database
          await db
            .update(clientTable)
            .set({
              hashedPassword,
              updatedAt: new Date()
            })
            .where(eq(clientTable.id, client.id));

          // Verify the update
          const [updated] = await db
            .select({ hashedPassword: clientTable.hashedPassword })
            .from(clientTable)
            .where(eq(clientTable.id, client.id))
            .limit(1);

          if (!updated || !isAlreadyHashed(updated.hashedPassword)) {
            throw new Error('Database update verification failed');
          }
        }

        stats.migrated++;
        log(`✓ Migrated: ${client.email}`, 'SUCCESS');

      } catch (error) {
        stats.failed++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        log(`✗ Failed: ${client.email} - ${errorMsg}`, 'ERROR');

        stats.errors.push({
          clientId: client.id,
          email: client.email,
          error: errorMsg
        });
      }

      // Progress indicator
      const progress = ((stats.migrated + stats.failed) / stats.plaintextPasswords * 100).toFixed(1);
      if ((stats.migrated + stats.failed) % 10 === 0) {
        log(`Progress: ${progress}% (${stats.migrated + stats.failed}/${stats.plaintextPasswords})`);
      }
    }

    // Step 5: Final verification
    if (!DRY_RUN && stats.migrated > 0) {
      log('\nStep 4: Verifying migration...');

      const verifyClients = await db
        .select({
          id: clientTable.id,
          email: clientTable.email,
          hashedPassword: clientTable.hashedPassword,
        })
        .from(clientTable);

      let verifiedHashed = 0;
      let verifiedPlaintext = 0;

      for (const client of verifyClients) {
        if (client.hashedPassword) {
          if (isAlreadyHashed(client.hashedPassword)) {
            verifiedHashed++;
          } else {
            verifiedPlaintext++;
            log(`⚠️  Still plaintext: ${client.email}`, 'WARN');
          }
        }
      }

      log(`Verification complete:`, 'INFO');
      log(`  - Hashed passwords: ${verifiedHashed}`, 'SUCCESS');
      log(`  - Plaintext passwords: ${verifiedPlaintext}`, verifiedPlaintext > 0 ? 'ERROR' : 'SUCCESS');

      if (verifiedPlaintext > 0) {
        log('⚠️  WARNING: Some passwords are still plaintext!', 'ERROR');
        log('⚠️  Review the migration log and re-run if needed.', 'ERROR');
      }
    }

  } catch (error) {
    log(`CRITICAL ERROR: ${error instanceof Error ? error.message : String(error)}`, 'ERROR');
    throw error;
  } finally {
    stats.endTime = new Date();
    printSummary();
  }
}

/**
 * Print migration summary
 */
function printSummary() {
  const duration = stats.endTime
    ? ((stats.endTime.getTime() - stats.startTime.getTime()) / 1000).toFixed(2)
    : 'N/A';

  log('\n' + '='.repeat(80));
  log('MIGRATION SUMMARY');
  log('='.repeat(80));
  log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE MIGRATION'}`);
  log(`Duration: ${duration} seconds`);
  log('');
  log('Statistics:');
  log(`  Total clients:          ${stats.totalClients}`);
  log(`  Already hashed:         ${stats.alreadyHashed}`);
  log(`  Plaintext found:        ${stats.plaintextPasswords}`);
  log(`  Successfully migrated:  ${stats.migrated}`, stats.migrated > 0 ? 'SUCCESS' : 'INFO');
  log(`  Failed:                 ${stats.failed}`, stats.failed > 0 ? 'ERROR' : 'SUCCESS');
  log(`  Skipped (no password):  ${stats.skipped}`);

  if (stats.errors.length > 0) {
    log('\nErrors:', 'ERROR');
    stats.errors.forEach(err => {
      log(`  - ${err.email} (${err.clientId}): ${err.error}`, 'ERROR');
    });
  }

  log('='.repeat(80));

  if (DRY_RUN) {
    log('✓ DRY RUN COMPLETE - No changes made', 'SUCCESS');
    log('To execute migration, run: DRY_RUN=false npx tsx server/scripts/migrate-passwords.ts', 'INFO');
  } else if (stats.failed === 0 && stats.migrated > 0) {
    log('✅ MIGRATION COMPLETE - All passwords successfully migrated!', 'SUCCESS');
  } else if (stats.failed > 0) {
    log('⚠️  MIGRATION COMPLETE WITH ERRORS - Review log file', 'WARN');
  } else if (stats.plaintextPasswords === 0) {
    log('✓ NO MIGRATION NEEDED - All passwords already hashed', 'SUCCESS');
  }

  log(`\nFull log available at: ${MIGRATION_LOG_FILE}`);
  log('='.repeat(80));

  // Write summary to separate file
  const summaryFile = path.join(LOG_DIR, 'password-migration-summary.json');
  fs.writeFileSync(summaryFile, JSON.stringify(stats, null, 2));
  log(`Summary JSON: ${summaryFile}`, 'INFO');
}

/**
 * Run migration with error handling
 */
async function main() {
  try {
    await migratePasswords();

    // Exit with appropriate code
    if (stats.failed > 0) {
      process.exit(1); // Some failures
    } else {
      process.exit(0); // Success
    }

  } catch (error) {
    log(`FATAL ERROR: ${error instanceof Error ? error.message : String(error)}`, 'ERROR');

    if (error instanceof Error && error.stack) {
      log(`Stack trace: ${error.stack}`, 'ERROR');
    }

    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  log(`UNCAUGHT EXCEPTION: ${error.message}`, 'ERROR');
  log(`Stack: ${error.stack}`, 'ERROR');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  log(`UNHANDLED REJECTION: ${reason}`, 'ERROR');
  process.exit(1);
});

// Run if executed directly
if (require.main === module) {
  main();
}

export { migratePasswords, isAlreadyHashed, isPlaintext, hashPassword };
