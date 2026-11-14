/**
 * server/scripts/seed-team.mjs
 * Seeds default team members into the database if none exist.
 */

import { initializeDatabase, query } from '../src/db.js';

async function seedTeam() {
  await initializeDatabase();

  const countRes = await query('SELECT COUNT(*) as count FROM team_members');
  const count = parseInt(countRes.rows[0]?.count || 0, 10);

  if (count === 0) {
    console.log('Seeding default group team members...');
    const now = new Date().toISOString();

    const sampleTeam = [
      {
        name: 'Alex Rivera',
        role: 'Project Lead & System Architect',
        bio: 'Coordinated system architecture, backend RESTful APIs, SQLite integration, and the digital magazine compilation engine.',
        email: 'alex.rivera@univ.edu.ph',
        photo_url: null,
        github_url: 'https://github.com',
        linkedin_url: 'https://linkedin.com',
        sort_order: 1,
        is_active: 1
      },
      {
        name: 'Camille Del Rosario',
        role: 'Biodiversity & Field Research Lead',
        bio: 'Curated scientific taxonomy records, IUCN status classifications, habitat distribution coordinates, and field specimen documentation.',
        email: 'camille.delrosario@univ.edu.ph',
        photo_url: null,
        github_url: 'https://github.com',
        linkedin_url: 'https://linkedin.com',
        sort_order: 2,
        is_active: 1
      },
      {
        name: 'Joshua Mendoza',
        role: '3D Graphics & Interactive Media Specialist',
        bio: 'Built real-time Three.js 3D specimen rendering pipeline, procedural animation, GLB model optimization, and leaf-turn physics.',
        email: 'joshua.mendoza@univ.edu.ph',
        photo_url: null,
        github_url: 'https://github.com',
        linkedin_url: 'https://linkedin.com',
        sort_order: 3,
        is_active: 1
      },
      {
        name: 'Bea Clarisse Tan',
        role: 'UI/UX & Editorial Flipbook Designer',
        bio: 'Designed the luxury dark-forest aesthetic, responsive typography, flipbook layout templates, and administrative studio workflows.',
        email: 'bea.tan@univ.edu.ph',
        photo_url: null,
        github_url: 'https://github.com',
        linkedin_url: 'https://linkedin.com',
        sort_order: 4,
        is_active: 1
      }
    ];

    for (const m of sampleTeam) {
      await query(`
        INSERT INTO team_members
          (name, role, bio, photo_url, email, github_url, linkedin_url, sort_order, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [m.name, m.role, m.bio, m.photo_url, m.email, m.github_url, m.linkedin_url, m.sort_order, m.is_active, now, now]);
    }
    console.log('✓ 4 default team members seeded successfully.');
  } else {
    console.log(`Team members table already has ${count} records.`);
  }

  process.exit(0);
}

seedTeam().catch(err => {
  console.error('Failed to seed team:', err);
  process.exit(1);
});

