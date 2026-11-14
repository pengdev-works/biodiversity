/**
 * src/db.js
 * Database abstraction layer.
 * - If DATABASE_URL is set → use pg (PostgreSQL / Neon)
 * - Otherwise           → use node:sqlite (Node.js built-in, no extra deps)
 *
 * Exports:
 *   query(sql, params)        – unified async query function
 *   initializeDatabase()      – creates all tables on startup
 */

import 'dotenv/config';

// ─────────────────────────────────────────────────────────────────────────────
// Placeholder conversion helper (PostgreSQL $1 → SQLite ?)
// Handles repeated placeholders: $1,$2,$1 → ?,?,? with expanded params array.
// Also converts boolean values to 1/0 and undefined to null for node:sqlite compatibility.
// ─────────────────────────────────────────────────────────────────────────────
function convertToSQLite(sql, params = []) {
  const expanded = [];
  const converted = sql.replace(/\$(\d+)/g, (_, n) => {
    let val = params[parseInt(n, 10) - 1];
    if (typeof val === 'boolean') {
      val = val ? 1 : 0;
    } else if (val === undefined) {
      val = null;
    }
    expanded.push(val);
    return '?';
  });

  const finalParams = (expanded.length > 0 ? expanded : params).map((val) => {
    if (typeof val === 'boolean') return val ? 1 : 0;
    if (val === undefined) return null;
    return val;
  });

  return { sql: converted, params: finalParams };
}

// ─────────────────────────────────────────────────────────────────────────────
// PostgreSQL path (pg / Neon)
// ─────────────────────────────────────────────────────────────────────────────
let pgPool = null;

async function initPg() {
  const { default: pg } = await import('pg');
  const { Pool } = pg;
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  console.log('✓ Using PostgreSQL (Neon)');
}

async function queryPg(sql, params = []) {
  const result = await pgPool.query(sql, params);
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// SQLite path (node:sqlite built-in)
// ─────────────────────────────────────────────────────────────────────────────
let sqliteDb = null;

async function initSqlite() {
  // node:sqlite is available from Node 22.5.0+
  const { DatabaseSync } = await import('node:sqlite');
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');

  const __dirname = path.default.dirname(fileURLToPath(import.meta.url));
  const dataDir = path.default.join(__dirname, '..', 'data');

  if (!fs.default.existsSync(dataDir)) {
    fs.default.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.default.join(dataDir, 'biodiversity.sqlite');
  sqliteDb = new DatabaseSync(dbPath);
  // Enable WAL mode for better concurrent read performance
  sqliteDb.exec('PRAGMA journal_mode=WAL;');
  sqliteDb.exec('PRAGMA foreign_keys=ON;');
  console.log(`✓ Using SQLite (${dbPath})`);
}

/**
 * Unified async query function.
 * Returns an object shaped like a pg result:
 *   { rows: [...], rowCount: number }
 */
export async function query(sql, params = []) {
  if (pgPool) {
    return queryPg(sql, params);
  }

  // SQLite
  const { sql: convertedSql, params: convertedParams } = convertToSQLite(sql, params);

  // Determine if this is a SELECT-like statement or statement with RETURNING
  const trimmed = convertedSql.trimStart().toUpperCase();
  const hasReturning = /RETURNING/i.test(convertedSql);
  const isSelect =
    trimmed.startsWith('SELECT') ||
    trimmed.startsWith('WITH') ||
    trimmed.startsWith('PRAGMA') ||
    trimmed.startsWith('EXPLAIN') ||
    hasReturning;

  try {
    if (isSelect) {
      const stmt = sqliteDb.prepare(convertedSql);
      const rows = stmt.all(...convertedParams);
      return { rows, rowCount: rows.length };
    } else {
      const stmt = sqliteDb.prepare(convertedSql);
      const info = stmt.run(...convertedParams);
      return {
        rows: [],
        rowCount: info.changes ?? 0,
        lastInsertRowid: info.lastInsertRowid,
      };
    }
  } catch (err) {
    console.error('[SQLite query error]', err.message);
    console.error('SQL:', convertedSql);
    console.error('Params:', convertedParams);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Schema DDL – two flavours
// ─────────────────────────────────────────────────────────────────────────────
const pgSchema = `
CREATE TABLE IF NOT EXISTS admin_users (
  id              SERIAL PRIMARY KEY,
  username        TEXT UNIQUE NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'admin',
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
  status      TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded','approved','failed')),
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
  settings_json   TEXT,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS magazine_pages (
  id              SERIAL PRIMARY KEY,
  publication_id  INTEGER NOT NULL REFERENCES magazine_publications(id) ON DELETE CASCADE,
  page_number     INTEGER,
  template_type   TEXT,
  sort_order      INTEGER,
  content_json    TEXT,
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

const sqliteSchema = `
CREATE TABLE IF NOT EXISTS admin_users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT UNIQUE NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'admin',
  created_at    DATETIME DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT UNIQUE NOT NULL,
  description TEXT,
  color       TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  DATETIME DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS species (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
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
  is_published        INTEGER NOT NULL DEFAULT 0,
  is_featured         INTEGER NOT NULL DEFAULT 0,
  sort_order          INTEGER NOT NULL DEFAULT 0,
  cover_photo_url     TEXT,
  created_at          DATETIME DEFAULT (datetime('now')),
  updated_at          DATETIME DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS species_photos (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  species_id  INTEGER NOT NULL REFERENCES species(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  caption     TEXT,
  is_cover    INTEGER NOT NULL DEFAULT 0,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  DATETIME DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS species_3d_models (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  species_id  INTEGER NOT NULL REFERENCES species(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  format      TEXT NOT NULL DEFAULT 'glb',
  filename    TEXT,
  file_size   INTEGER,
  status      TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded','approved','failed')),
  created_at  DATETIME DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS magazine_publications (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  title           TEXT NOT NULL,
  subtitle        TEXT,
  edition         TEXT,
  volume          TEXT,
  cover_photo_url TEXT,
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  intro_title     TEXT,
  intro_body      TEXT,
  settings_json   TEXT,
  created_at      DATETIME DEFAULT (datetime('now')),
  updated_at      DATETIME DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS magazine_pages (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  publication_id  INTEGER NOT NULL REFERENCES magazine_publications(id) ON DELETE CASCADE,
  page_number     INTEGER,
  template_type   TEXT,
  sort_order      INTEGER,
  content_json    TEXT,
  created_at      DATETIME DEFAULT (datetime('now'))
);

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
);
`;

// ─────────────────────────────────────────────────────────────────────────────
// initializeDatabase – called once at server startup
// ─────────────────────────────────────────────────────────────────────────────
export async function initializeDatabase() {
  if (process.env.DATABASE_URL) {
    await initPg();
    await pgPool.query(pgSchema);
  } else {
    await initSqlite();
    sqliteDb.exec(sqliteSchema);
  }
  console.log('✓ Database tables verified / created');
}
