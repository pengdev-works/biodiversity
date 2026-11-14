/**
 * server/scripts/seed-contributors.mjs
 * Seeds student contributors for BSIT (System Development) and BTLED (Educational Content).
 */

import { initializeDatabase, query } from '../src/db.js';

async function seedContributors() {
  await initializeDatabase();
  console.log('Seeding student contributors...');

  // Ensure table exists
  await query(`
    CREATE TABLE IF NOT EXISTS contributors (
      id                        INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name                 TEXT NOT NULL,
      profile_image             TEXT,
      course                    TEXT NOT NULL CHECK (course IN ('BSIT', 'BTLED')),
      role                      TEXT NOT NULL,
      contribution_description  TEXT,
      sort_order                INTEGER NOT NULL DEFAULT 0,
      created_at                DATETIME DEFAULT (datetime('now')),
      updated_at                DATETIME DEFAULT (datetime('now'))
    )
  `);

  // Clear existing to ensure clean seed
  await query('DELETE FROM contributors');

  const now = new Date().toISOString();

  const students = [
    // BSIT – System Development Team
    {
      full_name: 'Christian Dave Ramos',
      course: 'BSIT',
      role: 'Full-Stack Developer & Lead Architect',
      contribution_description: 'Engineered the backend RESTful API architecture, SQLite database integration, and the digital magazine compilation engine.',
      profile_image: null,
      sort_order: 1
    },
    {
      full_name: 'Althea Grace Bernardo',
      course: 'BSIT',
      role: 'Frontend & Interactive 3D Specialist',
      contribution_description: 'Built the responsive React user interface, Three.js 3D specimen rendering canvas, and flipbook physics.',
      profile_image: null,
      sort_order: 2
    },
    {
      full_name: 'Mark Joseph Gonzales',
      course: 'BSIT',
      role: 'UI/UX & Administrative Tools Designer',
      contribution_description: 'Designed the luxury dark-forest aesthetic, admin management dashboards, and responsive layout systems.',
      profile_image: null,
      sort_order: 3
    },
    {
      full_name: 'Angelo Gabriel Reyes',
      course: 'BSIT',
      role: 'Database Administrator & System Analyst',
      contribution_description: 'Structured relational tables, asset storage architecture, and data validation layers for the system.',
      profile_image: null,
      sort_order: 4
    },

    // BTLED – Educational Content Team
    {
      full_name: 'Mary Joyce Villanueva',
      course: 'BTLED',
      role: 'Lead Biodiversity Researcher & Content Writer',
      contribution_description: 'Researched and authored in-depth taxonomic descriptions, habitat characteristics, and ecological importance notes.',
      profile_image: null,
      sort_order: 1
    },
    {
      full_name: 'Hannah Mae Santos',
      course: 'BTLED',
      role: 'Educational Content & Curriculum Developer',
      contribution_description: 'Created educational learning materials, species dossiers, and interactive conservation trivia for students.',
      profile_image: null,
      sort_order: 2
    },
    {
      full_name: 'John Paul Bautista',
      course: 'BTLED',
      role: 'Species Information & Taxonomy Editor',
      contribution_description: 'Verified IUCN conservation red-list statuses, scientific nomenclature, and geographical coordinates.',
      profile_image: null,
      sort_order: 3
    },
    {
      full_name: 'Princess Diane Flores',
      course: 'BTLED',
      role: 'Learning Materials & Media Curator',
      contribution_description: 'Curated high-resolution field photography, visual learning aids, and educational flipbook spreads.',
      profile_image: null,
      sort_order: 4
    }
  ];

  for (const s of students) {
    await query(`
      INSERT INTO contributors
        (full_name, profile_image, course, role, contribution_description, sort_order, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [s.full_name, s.profile_image, s.course, s.role, s.contribution_description, s.sort_order, now, now]);
  }

  const result = await query('SELECT course, count(*) as count FROM contributors GROUP BY course');
  console.log('✓ Contributors seeded successfully:');
  for (const row of result.rows) {
    console.log(`  - ${row.course}: ${row.count} students`);
  }

  process.exit(0);
}

seedContributors().catch(err => {
  console.error('Seeding contributors failed:', err);
  process.exit(1);
});

