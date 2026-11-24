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

const NEON_DEFAULT_URL = 'postgresql://neondb_owner:npg_n8WtJ5KIdowQ@ep-little-cherry-aok5bhbb-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

const connectionString = process.env.DATABASE_URL || NEON_DEFAULT_URL;

const pgPool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

pgPool.on('error', (err) => {
  console.error('[Neon Postgres Pool Error]', err);
});

console.log('✓ Initialized Neon PostgreSQL Pool');

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
  const result = await pgPool.query(sql, params);
  return result;
}

export async function initializeDatabase() {
  await pgPool.query(pgSchema);
  console.log('✓ Neon PostgreSQL database connected & tables verified');
}
