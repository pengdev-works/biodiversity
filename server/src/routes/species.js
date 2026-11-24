/**
 * src/routes/species.js
 * Full CRUD + toggles + reorder for species.
 */

import { Router } from 'express';
import { query } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Fetch photos and 3D models for a species id */
async function fetchSpeciesExtras(speciesId) {
  const [photosRes, modelsRes] = await Promise.all([
    query(
      'SELECT * FROM species_photos WHERE species_id = $1 ORDER BY sort_order ASC, id ASC',
      [speciesId]
    ),
    query(
      'SELECT * FROM species_3d_models WHERE species_id = $1 ORDER BY created_at DESC',
      [speciesId]
    ),
  ]);
  return {
    photos: photosRes.rows,
    models: modelsRes.rows,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/species/reorder  (protected) – must come BEFORE /:id routes
// Body: [{ id, sort_order }, ...]
// ─────────────────────────────────────────────────────────────────────────────
router.put('/reorder', authenticateToken, async (req, res) => {
  try {
    const items = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Expected a non-empty array of { id, sort_order }' });
    }

    for (const item of items) {
      await query(
        'UPDATE species SET sort_order = $1, updated_at = $2 WHERE id = $3',
        [item.sort_order, new Date().toISOString(), item.id]
      );
    }

    return res.json({ message: 'Species order updated' });
  } catch (err) {
    console.error('[PUT /species/reorder]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/species  (public list with optional filters)
// ?category_id= &search= &status=published|all &featured=true
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { category_id, search, status, featured } = req.query;

    const conditions = [];
    const params = [];

    if (status !== 'all') {
      params.push(true);
      conditions.push(`s.is_published = $${params.length}`);
    }

    if (category_id) {
      params.push(parseInt(category_id, 10));
      conditions.push(`s.category_id = $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      params.push(`%${search}%`);
      conditions.push(
        `(s.common_name ILIKE $${params.length - 1} OR s.scientific_name ILIKE $${params.length})`
      );
    }

    if (featured === 'true') {
      params.push(true);
      conditions.push(`s.is_featured = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // For SQLite ILIKE → LIKE (case-insensitive via PRAGMA case_sensitive_like)
    // We normalise by using LIKE which SQLite handles case-insensitively for ASCII
    const sqlTemplate = `
      SELECT
        s.*,
        c.name AS category_name,
        c.color AS category_color
      FROM species s
      LEFT JOIN categories c ON s.category_id = c.id
      ${whereClause}
      ORDER BY s.sort_order ASC, s.created_at DESC
    `;

    // SQLite doesn't support ILIKE – patch it
    const isPostgres = !!process.env.DATABASE_URL;
    const finalSql = isPostgres ? sqlTemplate : sqlTemplate.replace(/ILIKE/g, 'LIKE');

    const result = await query(finalSql, params);

    // Normalise booleans for SQLite (stored as 0/1)
    const species = result.rows.map(normaliseSpecies);

    return res.json({ species });
  } catch (err) {
    console.error('[GET /species]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/species/:id
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT s.*, c.name AS category_name, c.color AS category_color
       FROM species s
       LEFT JOIN categories c ON s.category_id = c.id
       WHERE s.id = $1`,
      [id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Species not found' });
    }

    const species = normaliseSpecies(result.rows[0]);
    const extras = await fetchSpeciesExtras(id);

    return res.json({ species: { ...species, ...extras } });
  } catch (err) {
    console.error('[GET /species/:id]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/species  (protected)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      common_name,
      scientific_name,
      category_id,
      description,
      habitat,
      conservation_status,
      location,
      cover_photo_url,
      is_published,
      is_featured,
    } = req.body;

    if (!common_name || !scientific_name) {
      return res.status(400).json({ error: 'common_name and scientific_name are required' });
    }

    const now = new Date().toISOString();
    const pubVal = is_published === true || is_published === 1 || is_published === '1';
    const featVal = is_featured === true || is_featured === 1 || is_featured === '1';

    const result = await query(
      `INSERT INTO species
         (common_name, scientific_name, category_id, description, habitat,
          conservation_status, location, cover_photo_url, is_published, is_featured, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        common_name,
        scientific_name,
        category_id || null,
        description || null,
        habitat || null,
        conservation_status || null,
        location || null,
        cover_photo_url || null,
        pubVal,
        featVal,
        now,
        now,
      ]
    );

    let species;
    if (result.rows && result.rows[0]) {
      species = result.rows[0];
    } else {
      const sel = await query('SELECT * FROM species WHERE id = $1', [result.lastInsertRowid]);
      species = sel.rows[0];
    }

    return res.status(201).json({ species: normaliseSpecies(species) });
  } catch (err) {
    console.error('[POST /species]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/species/:id  (protected)
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await query('SELECT * FROM species WHERE id = $1', [id]);
    if (!existing.rows[0]) {
      return res.status(404).json({ error: 'Species not found' });
    }

    const ex = existing.rows[0];
    const {
      common_name = ex.common_name,
      scientific_name = ex.scientific_name,
      category_id = ex.category_id,
      description = ex.description,
      habitat = ex.habitat,
      conservation_status = ex.conservation_status,
      location = ex.location,
      cover_photo_url = ex.cover_photo_url,
      sort_order = ex.sort_order,
      is_published,
      is_featured,
    } = req.body;

    const pubVal = is_published !== undefined
      ? (is_published === true || is_published === 1 || is_published === '1')
      : ex.is_published;
    const featVal = is_featured !== undefined
      ? (is_featured === true || is_featured === 1 || is_featured === '1')
      : ex.is_featured;

    const now = new Date().toISOString();

    await query(
      `UPDATE species
       SET common_name = $1, scientific_name = $2, category_id = $3,
           description = $4, habitat = $5, conservation_status = $6,
           location = $7, cover_photo_url = $8, sort_order = $9,
           is_published = $10, is_featured = $11, updated_at = $12
       WHERE id = $13`,
      [
        common_name, scientific_name, category_id,
        description, habitat, conservation_status,
        location, cover_photo_url, sort_order,
        pubVal, featVal, now, id,
      ]
    );

    const result = await query(
      `SELECT s.*, c.name AS category_name, c.color AS category_color
       FROM species s LEFT JOIN categories c ON s.category_id = c.id
       WHERE s.id = $1`,
      [id]
    );

    return res.json({ species: normaliseSpecies(result.rows[0]) });
  } catch (err) {
    console.error('[PUT /species/:id]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/species/:id  (protected) – cascade photos + models
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await query('SELECT * FROM species WHERE id = $1', [id]);
    if (!existing.rows[0]) {
      return res.status(404).json({ error: 'Species not found' });
    }

    // Gather file paths before deletion for cleanup
    const photosRes = await query('SELECT url FROM species_photos WHERE species_id = $1', [id]);
    const modelsRes = await query('SELECT url FROM species_3d_models WHERE species_id = $1', [id]);
    const filesToDelete = [
      ...photosRes.rows.map((r) => r.url),
      ...modelsRes.rows.map((r) => r.url),
    ];

    // DB deletion (FK ON DELETE CASCADE handles child rows if FK enforcement is on)
    await query('DELETE FROM species_photos WHERE species_id = $1', [id]);
    await query('DELETE FROM species_3d_models WHERE species_id = $1', [id]);
    await query('DELETE FROM species WHERE id = $1', [id]);

    // Best-effort file cleanup
    const { default: fs } = await import('fs');
    for (const filePath of filesToDelete) {
      if (filePath && !filePath.startsWith('http')) {
        try {
          fs.unlinkSync(filePath);
        } catch (_) { /* ignore */ }
      }
    }

    return res.json({ message: 'Species deleted successfully' });
  } catch (err) {
    console.error('[DELETE /species/:id]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/species/:id/publish  (protected) – toggle is_published
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id/publish', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await query('SELECT * FROM species WHERE id = $1', [id]);
    if (!existing.rows[0]) {
      return res.status(404).json({ error: 'Species not found' });
    }

    const currentVal = existing.rows[0].is_published;
    // Normalise SQLite 0/1 or PG true/false
    const newVal = currentVal === true || currentVal === 1 ? false : true;
    const now = new Date().toISOString();

    await query(
      'UPDATE species SET is_published = $1, updated_at = $2 WHERE id = $3',
      [newVal, now, id]
    );

    const result = await query('SELECT * FROM species WHERE id = $1', [id]);
    return res.json({ species: normaliseSpecies(result.rows[0]) });
  } catch (err) {
    console.error('[PUT /species/:id/publish]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/species/:id/feature  (protected) – toggle is_featured
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id/feature', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await query('SELECT * FROM species WHERE id = $1', [id]);
    if (!existing.rows[0]) {
      return res.status(404).json({ error: 'Species not found' });
    }

    const currentVal = existing.rows[0].is_featured;
    const newVal = currentVal === true || currentVal === 1 ? false : true;
    const now = new Date().toISOString();

    await query(
      'UPDATE species SET is_featured = $1, updated_at = $2 WHERE id = $3',
      [newVal, now, id]
    );

    const result = await query('SELECT * FROM species WHERE id = $1', [id]);
    return res.json({ species: normaliseSpecies(result.rows[0]) });
  } catch (err) {
    console.error('[PUT /species/:id/feature]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Helper: normalise SQLite boolean integers to JS booleans
// ─────────────────────────────────────────────────────────────────────────────
function normaliseSpecies(s) {
  if (!s) return s;
  return {
    ...s,
    is_published: s.is_published === 1 || s.is_published === true,
    is_featured: s.is_featured === 1 || s.is_featured === true,
  };
}

export default router;
