/**
 * scripts/create-admin.mjs
 * Standalone CLI script to create an authorized Administrator account.
 * Usage:
 *   node scripts/create-admin.mjs --username admin --password MyPassword123! --email admin@example.com
 */

import bcrypt from 'bcryptjs';
import 'dotenv/config';
import { initializeDatabase, query } from '../src/db.js';

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
      parsed[key] = val;
    }
  }
  return parsed;
}

async function main() {
  const args = parseArgs();
  const username = args.username || 'admin';
  const password = args.password || 'admin123';
  const email = args.email || 'admin@biodiversity.local';

  console.log(`\n--- ABRAVENTURE / BIODIVERSITY Administrator Setup ---`);
  console.log(`Connecting to database...`);
  await initializeDatabase();

  try {
    const existing = await query('SELECT id, username FROM admin_users WHERE username = $1 OR email = $2', [username, email]);
    const hash = await bcrypt.hash(password, 10);

    if (existing.rows.length > 0) {
      console.log(`Updating existing admin account "${username}"...`);
      await query(`
        UPDATE admin_users
        SET password_hash = $1, email = $2, role = 'admin'
        WHERE username = $3
      `, [hash, email, username]);
      console.log(`✓ Admin account "${username}" password successfully updated!`);
    } else {
      console.log(`Creating new admin account "${username}"...`);
      await query(`
        INSERT INTO admin_users (username, email, password_hash, role)
        VALUES ($1, $2, $3, 'admin')
      `, [username, email, hash]);
      console.log(`✓ Administrator account "${username}" successfully created!`);
    }

    console.log(`Username: ${username}`);
    console.log(`Email:    ${email}`);
    console.log(`Portal:   /secure-admin-portal/login\n`);
    process.exit(0);
  } catch (err) {
    console.error('✗ Failed to create admin user:', err);
    process.exit(1);
  }
}

main();

