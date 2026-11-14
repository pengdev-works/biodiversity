/**
 * src/routes/contributors.js
 * Contributor management endpoints for BSIT and BTLED student teams.
 */

import { Router } from 'express';
import { query } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { handleUpload, uploadContributorPhoto } from '../middleware/upload.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/contributors/reorder (protected) – must come BEFORE /:id
// ─────────────────────────────────────────────────────────────────────────────
router.put('/reorder', authenticateToken, async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Expected array of { id, sort_order }' });
    }

    for (const item of items) {
      await query(
        "UPDATE contributors SET sort_order = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        [item.sort_order, item.id]
      );
    }

    return res.json({ message: 'Contributor display order updated' });
  } catch (err) {
    console.error('[PUT /api/contributors/reorder]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/contributors (protected) – get all contributors
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { course } = req.query;
    let sql = 'SELECT * FROM contributors';
    const params = [];

    if (course && (course === 'BSIT' || course === 'BTLED')) {
      params.push(course);
      sql += ' WHERE course = $1';
    }

    sql += ' ORDER BY sort_order ASC, id ASC';

    const result = await query(sql, params);
    return res.json({ contributors: result.rows || [] });
  } catch (err) {
    console.error('[GET /api/contributors]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/contributors/:id (protected)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM contributors WHERE id = $1', [id]);
    if (!result.rows || !result.rows[0]) {
      return res.status(404).json({ error: 'Contributor not found' });
    }
    return res.json({ contributor: result.rows[0] });
  } catch (err) {
    console.error('[GET /api/contributors/:id]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/contributors (protected) – add contributor with photo upload
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', authenticateToken, handleUpload(uploadContributorPhoto), async (req, res) => {
  try {
    const {
      full_name,
      course,
      role,
      contribution_description,
      sort_order
    } = req.body;

    // Validation
    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ error: 'Full name is required.' });
    }

    const cleanCourse = (course || 'BSIT').trim().toUpperCase();
    if (cleanCourse !== 'BSIT' && cleanCourse !== 'BTLED') {
      return res.status(400).json({ error: 'Course must be either "BSIT" or "BTLED".' });
    }

    if (!role || !role.trim()) {
      return res.status(400).json({ error: 'Role / position is required.' });
    }

    const uploadedFile = req.file || (Array.isArray(req.files) ? req.files[0] : (req.files?.photo?.[0] || req.files?.profile_image?.[0]));
    let profile_image = req.body.profile_image || null;
    if (uploadedFile) {
      profile_image = `/uploads/${uploadedFile.filename}`;
    }

    // Determine sort_order if not provided
    let orderVal = sort_order !== undefined && sort_order !== '' ? parseInt(sort_order, 10) : null;
    if (orderVal === null || isNaN(orderVal)) {
      const maxRes = await query('SELECT MAX(sort_order) as max_order FROM contributors WHERE course = $1', [cleanCourse]);
      orderVal = (maxRes.rows[0]?.max_order || 0) + 1;
    }

    const now = new Date().toISOString();

    const insertRes = await query(
      `INSERT INTO contributors
        (full_name, profile_image, course, role, contribution_description, sort_order, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        full_name.trim(),
        profile_image,
        cleanCourse,
        role.trim(),
        contribution_description ? contribution_description.trim() : null,
        orderVal,
        now,
        now,
      ]
    );

    let contributor;
    if (insertRes.rows && insertRes.rows[0]) {
      contributor = insertRes.rows[0];
    } else {
      const fetchNew = await query('SELECT * FROM contributors WHERE id = $1', [insertRes.lastInsertRowid]);
      contributor = fetchNew.rows[0];
    }

    return res.status(201).json({
      message: 'Student contributor added successfully',
      contributor,
    });
  } catch (err) {
    console.error('[POST /api/contributors]', err);
    return res.status(500).json({ error: 'Failed to add student contributor' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT / POST /api/contributors/:id (protected) – edit contributor
// ─────────────────────────────────────────────────────────────────────────────
const updateContributorHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await query('SELECT * FROM contributors WHERE id = $1', [id]);
    if (!existing.rows || !existing.rows[0]) {
      return res.status(404).json({ error: 'Contributor not found' });
    }

    const ex = existing.rows[0];
    const full_name = req.body.full_name !== undefined && req.body.full_name !== null && String(req.body.full_name).trim() !== ''
      ? String(req.body.full_name).trim()
      : ex.full_name;

    const role = req.body.role !== undefined && req.body.role !== null && String(req.body.role).trim() !== ''
      ? String(req.body.role).trim()
      : ex.role;

    const contribution_description = req.body.contribution_description !== undefined
      ? (req.body.contribution_description ? String(req.body.contribution_description).trim() : null)
      : ex.contribution_description;

    let course = ex.course;
    if (req.body.course) {
      const cleanCourse = String(req.body.course).trim().toUpperCase();
      if (cleanCourse === 'BSIT' || cleanCourse === 'BTLED') {
        course = cleanCourse;
      }
    }

    const uploadedFile = req.file || (Array.isArray(req.files) ? req.files[0] : (req.files?.photo?.[0] || req.files?.profile_image?.[0]));
    let profile_image = ex.profile_image;
    if (uploadedFile) {
      profile_image = `/uploads/${uploadedFile.filename}`;
    } else if (req.body.profile_image !== undefined && req.body.profile_image !== '') {
      profile_image = req.body.profile_image;
    }

    const sort_order = req.body.sort_order !== undefined && req.body.sort_order !== '' && !isNaN(parseInt(req.body.sort_order, 10))
      ? parseInt(req.body.sort_order, 10)
      : ex.sort_order;

    const now = new Date().toISOString();

    await query(
      `UPDATE contributors
       SET full_name = $1, profile_image = $2, course = $3, role = $4,
           contribution_description = $5, sort_order = $6, updated_at = $7
       WHERE id = $8`,
      [
        full_name,
        profile_image,
        course,
        role,
        contribution_description,
        sort_order,
        now,
        id,
      ]
    );

    const updated = await query('SELECT * FROM contributors WHERE id = $1', [id]);
    return res.json({
      message: 'Contributor information updated successfully',
      contributor: updated.rows[0],
    });
  } catch (err) {
    console.error('[UPDATE /api/contributors/:id]', err);
    return res.status(500).json({ error: 'Failed to update contributor' });
  }
};

router.put('/:id', authenticateToken, handleUpload(uploadContributorPhoto), updateContributorHandler);
router.post('/:id', authenticateToken, handleUpload(uploadContributorPhoto), updateContributorHandler);

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/contributors/:id (protected) – delete contributor
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await query('SELECT * FROM contributors WHERE id = $1', [id]);
    if (!existing.rows || !existing.rows[0]) {
      return res.status(404).json({ error: 'Contributor not found' });
    }

    const photoToDelete = existing.rows[0].profile_image;

    await query('DELETE FROM contributors WHERE id = $1', [id]);

    // Clean up local uploaded file if exists
    if (photoToDelete && photoToDelete.startsWith('/uploads/')) {
      const { default: fs } = await import('fs');
      const { default: path } = await import('path');
      const { fileURLToPath } = await import('url');
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const fullPath = path.join(__dirname, '..', '..', photoToDelete.replace(/^\//, ''));
      try {
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      } catch (_) {}
    }

    return res.json({ message: 'Contributor deleted successfully' });
  } catch (err) {
    console.error('[DELETE /api/contributors/:id]', err);
    return res.status(500).json({ error: 'Failed to delete contributor' });
  }
});

export default router;

