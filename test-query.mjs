
import { initializeDatabase, query } from './server/src/db.js';

async function test() {
  await initializeDatabase();
  try {
    await query('UPDATE species SET is_published = $1, updated_at = $2 WHERE id = $3', [false, new Date().toISOString(), 1]);
    console.log('Query succeeded');
  } catch (e) {
    console.error('Query failed with:', e);
  }
}
test();
