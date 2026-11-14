/**
 * src/routes/public.js
 * Public endpoints for visitors exploring biodiversity.
 * No authentication required.
 */

import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/public/featured – featured published species (max 6)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/featured', async (req, res) => {
  try {
    // 1. Try to fetch explicitly starred/featured published species first
    let result = await query(`
      SELECT s.*, c.name AS category_name, c.color AS category_color
      FROM species s
      LEFT JOIN categories c ON c.id = s.category_id
      WHERE s.is_published = 1 AND s.is_featured = 1
      ORDER BY s.sort_order ASC, s.created_at DESC
      LIMIT 6
    `);

    // 2. If no species are starred as featured yet, show any published species
    if (!result.rows || result.rows.length === 0) {
      result = await query(`
        SELECT s.*, c.name AS category_name, c.color AS category_color
        FROM species s
        LEFT JOIN categories c ON c.id = s.category_id
        WHERE s.is_published = 1
        ORDER BY s.sort_order ASC, s.created_at DESC
        LIMIT 6
      `);
    }

    return res.json({ species: result.rows || [] });
  } catch (err) {
    console.error('[GET /api/public/featured]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/public/species – paginated published species with filters
// Query: ?page=1&limit=12&category=&search=&location=
// ─────────────────────────────────────────────────────────────────────────────
router.get('/species', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || 1, 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || 12, 10)));
    const offset = (page - 1) * limit;

    const { category, search, location } = req.query;

    const conditions = ['s.is_published = 1'];
    const params = [];

    if (category) {
      params.push(category);
      conditions.push(`(s.category_id = $${params.length} OR c.name = $${params.length})`);
    }

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      const pIdx = params.length;
      conditions.push(`(
        LOWER(s.common_name) LIKE $${pIdx}
        OR LOWER(COALESCE(s.scientific_name, '')) LIKE $${pIdx}
        OR LOWER(COALESCE(s.description, '')) LIKE $${pIdx}
        OR LOWER(COALESCE(s.location, '')) LIKE $${pIdx}
      )`);
    }

    if (location && location.trim()) {
      params.push(`%${location.trim().toLowerCase()}%`);
      conditions.push(`LOWER(COALESCE(s.location, '')) LIKE $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count query
    const countRes = await query(`
      SELECT COUNT(*) AS total
      FROM species s
      LEFT JOIN categories c ON c.id = s.category_id
      ${whereClause}
    `, params);

    const total = parseInt(countRes.rows[0]?.total || 0, 10);

    // Data query
    const dataParams = [...params, limit, offset];
    const dataRes = await query(`
      SELECT s.*, c.name AS category_name, c.color AS category_color
      FROM species s
      LEFT JOIN categories c ON c.id = s.category_id
      ${whereClause}
      ORDER BY s.sort_order ASC, s.created_at DESC
      LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}
    `, dataParams);

    return res.json({
      species: dataRes.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('[GET /api/public/species]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/public/species/:id – single published species detail with photos & models
// ─────────────────────────────────────────────────────────────────────────────
router.get('/species/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const speciesRes = await query(`
      SELECT s.*, c.name AS category_name, c.color AS category_color
      FROM species s
      LEFT JOIN categories c ON c.id = s.category_id
      WHERE s.id = $1 AND s.is_published = 1
    `, [id]);

    if (speciesRes.rows.length === 0) {
      return res.status(404).json({ error: 'Species not found or not published' });
    }

    const species = speciesRes.rows[0];

    const [photosRes, modelsRes] = await Promise.all([
      query('SELECT * FROM species_photos WHERE species_id = $1 ORDER BY sort_order ASC, id ASC', [id]),
      query("SELECT * FROM species_3d_models WHERE species_id = $1 AND status = 'approved' ORDER BY created_at DESC", [id])
    ]);

    return res.json({
      species: {
        ...species,
        photos: photosRes.rows,
        models: modelsRes.rows
      }
    });
  } catch (err) {
    console.error('[GET /api/public/species/:id]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/public/locations – distinct locations with count
// ─────────────────────────────────────────────────────────────────────────────
router.get('/locations', async (req, res) => {
  try {
    const result = await query(`
      SELECT location, COUNT(*) as species_count
      FROM species
      WHERE is_published = 1 AND location IS NOT NULL AND TRIM(location) != ''
      GROUP BY location
      ORDER BY species_count DESC, location ASC
    `);
    return res.json({ locations: result.rows });
  } catch (err) {
    console.error('[GET /api/public/locations]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/public/categories – categories that have published species
// ─────────────────────────────────────────────────────────────────────────────
router.get('/categories', async (req, res) => {
  try {
    const result = await query(`
      SELECT c.*, COUNT(s.id) as published_species_count
      FROM categories c
      INNER JOIN species s ON s.category_id = c.id AND s.is_published = 1
      GROUP BY c.id
      ORDER BY c.sort_order ASC, c.name ASC
    `);
    return res.json({ categories: result.rows });
  } catch (err) {
    console.error('[GET /api/public/categories]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/public/contributors – student contributors grouped by BSIT & BTLED
// ─────────────────────────────────────────────────────────────────────────────
router.get('/contributors', async (req, res) => {
  try {
    const result = await query(`
      SELECT id, full_name, profile_image, course, role, contribution_description, sort_order
      FROM contributors
      ORDER BY sort_order ASC, id ASC
    `);

    const all = result.rows || [];
    const bsit = all.filter(c => c.course === 'BSIT');
    const btled = all.filter(c => c.course === 'BTLED');

    return res.json({
      contributors: all,
      bsit,
      btled,
      counts: {
        total: all.length,
        bsit: bsit.length,
        btled: btled.length
      }
    });
  } catch (err) {
    console.error('[GET /api/public/contributors]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

