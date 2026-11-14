/**
 * src/routes/categories.js
 * CRUD + reorder for species categories.
 * GET /api/categories is public; all others require auth.
 */

import { Router } from 'express';
import { query } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/categories  (public)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (_req, res) => {
  try {
    const result = await query(
      `SELECT c.*,
         (SELECT COUNT(*) FROM species WHERE category_id = c.id) AS species_count
       FROM categories c
       ORDER BY c.sort_order ASC, c.name ASC`
    );
    return res.json({ categories: result.rows });
  } catch (err) {
    console.error('[GET /categories]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/categories  (protected)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, color } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    // Determine next sort_order
    const countRes = await query('SELECT COUNT(*) AS cnt FROM categories');
    const nextOrder = parseInt(countRes.rows[0]?.cnt ?? countRes.rows[0]?.CNT ?? 0, 10);

    const result = await query(
      `INSERT INTO categories (name, description, color, sort_order)
       VALUES ($1, $2, $3, $4)`,
      [name, description || null, color || null, nextOrder]
    );

    // Fetch the newly created category
    let category;
    if (result.rows && result.rows[0]) {
      category = result.rows[0];
    } else {
      // SQLite: fetch by lastInsertRowid
      const sel = await query(
        'SELECT * FROM categories WHERE id = $1',
        [result.lastInsertRowid]
      );
      category = sel.rows[0];
    }

    return res.status(201).json({ category });
  } catch (err) {
    if (err.message?.includes('UNIQUE') || err.code === '23505') {
      return res.status(409).json({ error: 'A category with that name already exists' });
    }
    console.error('[POST /categories]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/categories/reorder  (protected) – must come BEFORE /:id routes
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
        'UPDATE categories SET sort_order = $1 WHERE id = $2',
        [item.sort_order, item.id]
      );
    }

    const result = await query('SELECT * FROM categories ORDER BY sort_order ASC, name ASC');
    return res.json({ categories: result.rows });
  } catch (err) {
    console.error('[PUT /categories/reorder]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/categories/:id  (protected)
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color, sort_order } = req.body;

    // Check exists
    const existing = await query('SELECT * FROM categories WHERE id = $1', [id]);
    if (!existing.rows[0]) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const updated = {
      name: name ?? existing.rows[0].name,
      description: description !== undefined ? description : existing.rows[0].description,
      color: color !== undefined ? color : existing.rows[0].color,
      sort_order: sort_order !== undefined ? sort_order : existing.rows[0].sort_order,
    };

    await query(
      `UPDATE categories
       SET name = $1, description = $2, color = $3, sort_order = $4
       WHERE id = $5`,
      [updated.name, updated.description, updated.color, updated.sort_order, id]
    );

    const result = await query('SELECT * FROM categories WHERE id = $1', [id]);
    return res.json({ category: result.rows[0] });
  } catch (err) {
    if (err.message?.includes('UNIQUE') || err.code === '23505') {
      return res.status(409).json({ error: 'A category with that name already exists' });
    }
    console.error('[PUT /categories/:id]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/categories/:id  (protected)
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check exists
    const existing = await query('SELECT * FROM categories WHERE id = $1', [id]);
    if (!existing.rows[0]) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if any species use this category
    const usageRes = await query(
      'SELECT COUNT(*) AS cnt FROM species WHERE category_id = $1',
      [id]
    );
    const count = parseInt(usageRes.rows[0]?.cnt ?? usageRes.rows[0]?.CNT ?? 0, 10);
    if (count > 0) {
      return res.status(409).json({
        error: `Cannot delete: ${count} species are assigned to this category`,
      });
    }

    await query('DELETE FROM categories WHERE id = $1', [id]);
    return res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    console.error('[DELETE /categories/:id]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
