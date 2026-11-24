/**
 * src/db.js
 * Pure Neon PostgreSQL database connection layer.
 * SQLite has been completely removed per requirements.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { Pool } = pg;

const LOCAL_DEFAULT_URL = 'postgresql://postgres:paragas2001@localhost:5432/bio';

const connectionString = process.env.DATABASE_URL || LOCAL_DEFAULT_URL;
const isLocalhost = Boolean(connectionString && (connectionString.includes('localhost') || connectionString.includes('127.0.0.1')));

const pgPool = new Pool({
  connectionString,
  ssl: isLocalhost ? false : { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

pgPool.on('error', (err) => {
  console.error('[PostgreSQL Pool Error]', err);
});

console.log(`✓ Initialized PostgreSQL Pool (${isLocalhost ? 'Localhost / pgAdmin 4' : 'Cloud / Neon'})`);
console.log(`✓ Database Target: ${connectionString.split('@')[1] || 'localhost'}`);

const pgSchema = `
CREATE TABLE IF NOT EXISTS admin_users (
  id            SERIAL PRIMARY KEY,
  username      TEXT UNIQUE NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'admin',
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id          SERIAL PRIMARY KEY,
  name        TEXT UNIQUE NOT NULL,
  description TEXT,
  color       TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS species (
  id                  SERIAL PRIMARY KEY,
  common_name         TEXT NOT NULL,
  scientific_name     TEXT NOT NULL,
  category_id         INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  description         TEXT,
  habitat             TEXT,
  conservation_status TEXT CHECK (conservation_status IN (
    'Least Concern','Near Threatened','Vulnerable',
    'Endangered','Critically Endangered','Data Deficient','Not Evaluated'
  )),
  location            TEXT,
  is_published        BOOLEAN NOT NULL DEFAULT FALSE,
  is_featured         BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order          INTEGER NOT NULL DEFAULT 0,
  cover_photo_url     TEXT,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS species_photos (
  id          SERIAL PRIMARY KEY,
  species_id  INTEGER NOT NULL REFERENCES species(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  caption     TEXT,
  is_cover    BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS species_3d_models (
  id          SERIAL PRIMARY KEY,
  species_id  INTEGER NOT NULL REFERENCES species(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  format      TEXT NOT NULL DEFAULT 'glb',
  filename    TEXT,
  file_size   INTEGER,
  status      TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('uploaded','approved','failed')),
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS magazine_publications (
  id              SERIAL PRIMARY KEY,
  title           TEXT NOT NULL,
  subtitle        TEXT,
  edition         TEXT,
  volume          TEXT,
  cover_photo_url TEXT,
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  intro_title     TEXT,
  intro_body      TEXT,
  settings_json   JSONB,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS magazine_pages (
  id              SERIAL PRIMARY KEY,
  publication_id  INTEGER NOT NULL REFERENCES magazine_publications(id) ON DELETE CASCADE,
  page_number     INTEGER,
  template_type   TEXT,
  sort_order      INTEGER,
  content_json    JSONB,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contributors (
  id                        SERIAL PRIMARY KEY,
  full_name                 TEXT NOT NULL,
  profile_image             TEXT,
  course                    TEXT NOT NULL CHECK (course IN ('BSIT', 'BTLED')),
  role                      TEXT NOT NULL,
  contribution_description  TEXT,
  sort_order                INTEGER NOT NULL DEFAULT 0,
  created_at                TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at                TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`;

export async function query(sql, params = []) {
  try {
    const result = await pgPool.query(sql, params);
    return result;
  } catch (err) {
    console.error('[Database Query Error]:', err.message);
    if (err.message && err.message.includes('quota')) {
      return { rows: [], rowCount: 0, quotaExceeded: true };
    }
    throw err;
  }
}

export async function initializeDatabase() {
  try {
    await pgPool.query(pgSchema);
    console.log('✓ PostgreSQL database connected & tables verified');

    // Ensure default admin user with valid admin123 password exists
    const adminHash = '$2a$10$HmWwgLq3dJ.F92ZvYYSSf.fyNg.iI0Eld3Vj21d73RjraCA4yuDi2';
    await pgPool.query(`
      INSERT INTO admin_users (username, email, password_hash, role)
      VALUES ('admin', 'admin@example.com', $1, 'admin')
      ON CONFLICT (username) DO UPDATE SET password_hash = $1;
    `, [adminHash]);
    console.log('✓ Admin user verified (username: admin)');
  } catch (err) {
    console.warn('⚠️ [PostgreSQL Warning] Could not verify schema on startup:', err.message);
  }
}
