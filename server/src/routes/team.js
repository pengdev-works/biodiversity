/**
 * src/routes/team.js
 * Admin and team management endpoints.
 */

import { Router } from 'express';
import { query } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { handleUpload, uploadImage } from '../middleware/upload.js';
import { processUploadedImage } from '../utils/imageStorage.js';

const router = Router();

function normaliseMember(row) {
  if (!row) return null;
  return {
    ...row,
    is_active: row.is_active === 1 || row.is_active === true,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/team/reorder (protected) – must come BEFORE /:id
// ─────────────────────────────────────────────────────────────────────────────
router.put('/reorder', authenticateToken, async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Expected array of { id, sort_order }' });
    }

    for (const item of items) {
      await query(
        "UPDATE team_members SET sort_order = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        [item.sort_order, item.id]
      );
    }

    return res.json({ message: 'Team order updated successfully' });
  } catch (err) {
    console.error('[PUT /api/team/reorder]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/team (protected) – get all team members for admin studio
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM team_members ORDER BY sort_order ASC, id ASC'
    );
    const members = (result.rows || []).map(normaliseMember);
    return res.json({ members });
  } catch (err) {
    console.error('[GET /api/team]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/team (protected) – create team member
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', authenticateToken, handleUpload(uploadImage), async (req, res) => {
  try {
    const {
      name,
      role,
      bio,
      email,
      github_url,
      linkedin_url,
      sort_order,
      is_active,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!role || !role.trim()) {
      return res.status(400).json({ error: 'Role is required' });
    }

    let photo_url = req.body.photo_url || null;
    if (req.file) {
      photo_url = await processUploadedImage(req.file, { maxWidth: 500, maxHeight: 500, quality: 82, folder: 'biodiversity/team' });
    }

    const orderVal = sort_order !== undefined ? parseInt(sort_order, 10) : 0;
    const activeVal = is_active === undefined || is_active === 'true' || is_active === true || is_active === 1 || is_active === '1' ? 1 : 0;
    const now = new Date().toISOString();

    const insertResult = await query(
      `INSERT INTO team_members
        (name, role, bio, photo_url, email, github_url, linkedin_url, sort_order, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        name.trim(),
        role.trim(),
        bio ? bio.trim() : null,
        photo_url,
        email ? email.trim() : null,
        github_url ? github_url.trim() : null,
        linkedin_url ? linkedin_url.trim() : null,
        orderVal,
        activeVal,
        now,
        now,
      ]
    );

    let member;
    if (insertResult.rows && insertResult.rows[0]) {
      member = insertResult.rows[0];
    } else {
      const fetchNew = await query('SELECT * FROM team_members WHERE id = $1', [insertResult.lastInsertRowid]);
      member = fetchNew.rows[0];
    }

    return res.status(201).json({
      message: 'Team member added successfully',
      member: normaliseMember(member),
    });
  } catch (err) {
    console.error('[POST /api/team]', err);
    return res.status(500).json({ error: 'Failed to create team member' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/team/:id (protected) – update team member
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id', authenticateToken, handleUpload(uploadImage), async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await query('SELECT * FROM team_members WHERE id = $1', [id]);
    if (!existing.rows || !existing.rows[0]) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    const ex = existing.rows[0];
    const name = req.body.name !== undefined ? req.body.name.trim() : ex.name;
    const role = req.body.role !== undefined ? req.body.role.trim() : ex.role;
    const bio = req.body.bio !== undefined ? (req.body.bio ? req.body.bio.trim() : null) : ex.bio;
    const email = req.body.email !== undefined ? (req.body.email ? req.body.email.trim() : null) : ex.email;
    const github_url = req.body.github_url !== undefined ? (req.body.github_url ? req.body.github_url.trim() : null) : ex.github_url;
    const linkedin_url = req.body.linkedin_url !== undefined ? (req.body.linkedin_url ? req.body.linkedin_url.trim() : null) : ex.linkedin_url;
    const sort_order = req.body.sort_order !== undefined ? parseInt(req.body.sort_order, 10) : ex.sort_order;

    let is_active = ex.is_active;
    if (req.body.is_active !== undefined) {
      is_active = req.body.is_active === true || req.body.is_active === 'true' || req.body.is_active === 1 || req.body.is_active === '1' ? 1 : 0;
    }

    let photo_url = ex.photo_url;
    if (req.file) {
      photo_url = await processUploadedImage(req.file, { maxWidth: 500, maxHeight: 500, quality: 82, folder: 'biodiversity/team' });
    } else if (req.body.photo_url !== undefined) {
      photo_url = req.body.photo_url;
    }

    const now = new Date().toISOString();

    await query(
      `UPDATE team_members
       SET name = $1, role = $2, bio = $3, photo_url = $4, email = $5,
           github_url = $6, linkedin_url = $7, sort_order = $8, is_active = $9, updated_at = $10
       WHERE id = $11`,
      [
        name,
        role,
        bio,
        photo_url,
        email,
        github_url,
        linkedin_url,
        sort_order,
        is_active,
        now,
        id,
      ]
    );

    const updated = await query('SELECT * FROM team_members WHERE id = $1', [id]);
    return res.json({
      message: 'Team member updated successfully',
      member: normaliseMember(updated.rows[0]),
    });
  } catch (err) {
    console.error('[PUT /api/team/:id]', err);
    return res.status(500).json({ error: 'Failed to update team member' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/team/:id/toggle (protected) – toggle is_active
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id/toggle', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await query('SELECT * FROM team_members WHERE id = $1', [id]);
    if (!existing.rows || !existing.rows[0]) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    const currentVal = existing.rows[0].is_active;
    const newVal = currentVal === 1 || currentVal === true ? 0 : 1;
    const now = new Date().toISOString();

    await query(
      'UPDATE team_members SET is_active = $1, updated_at = $2 WHERE id = $3',
      [newVal, now, id]
    );

    const updated = await query('SELECT * FROM team_members WHERE id = $1', [id]);
    return res.json({
      message: 'Status updated',
      member: normaliseMember(updated.rows[0]),
    });
  } catch (err) {
    console.error('[PUT /api/team/:id/toggle]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/team/:id (protected)
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM team_members WHERE id = $1', [id]);
    return res.json({ message: 'Team member removed successfully' });
  } catch (err) {
    console.error('[DELETE /api/team/:id]', err);
    return res.status(500).json({ error: 'Failed to delete team member' });
  }
});

export default router;

