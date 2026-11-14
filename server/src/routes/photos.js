/**
 * src/routes/photos.js
 * Photo upload, cover assignment, deletion, and reorder.
 *
 * Routes mounted at:
 *   POST   /api/species/:id/photos   → upload
 *   PUT    /api/photos/:id/cover     → set cover
 *   DELETE /api/photos/:id           → delete
 *   PUT    /api/photos/reorder       → batch reorder
 *
 * The species sub-routes (/api/species/:id/photos) are mounted in index.js
 * using the speciesPhotosRouter export; the standalone /api/photos routes
 * use the photosRouter export.
 */

import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { query } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { uploadImages, uploadImage, handleUpload } from '../middleware/upload.js';
import { processUploadedImage } from '../utils/imageStorage.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

// ─────────────────────────────────────────────────────────────────────────────
// Router for sub-routes under /api/species/:speciesId/photos
// (must be mounted with mergeParams: true)
// ─────────────────────────────────────────────────────────────────────────────
export const speciesPhotosRouter = Router({ mergeParams: true });

speciesPhotosRouter.post(
  '/',
  authenticateToken,
  handleUpload(uploadImages),
  async (req, res) => {
    try {
      const { speciesId } = req.params;

      // Verify species exists
      const speciesRes = await query('SELECT id FROM species WHERE id = $1', [speciesId]);
      if (!speciesRes.rows[0]) {
        // Clean up uploaded files
        for (const f of req.files || []) {
          fs.unlink(f.path, () => {});
        }
        return res.status(404).json({ error: 'Species not found' });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      // Count existing photos to determine sort_order
      const countRes = await query(
        'SELECT COUNT(*) AS cnt FROM species_photos WHERE species_id = $1',
        [speciesId]
      );
      let nextOrder = parseInt(countRes.rows[0]?.cnt ?? countRes.rows[0]?.CNT ?? 0, 10);

      const savedPhotos = [];

      for (const file of req.files) {
        const relativeUrl = await processUploadedImage(file, { maxWidth: 1400, maxHeight: 1400, quality: 85, folder: 'biodiversity/species' });
        const caption = req.body.caption || null;

        const result = await query(
          `INSERT INTO species_photos (species_id, url, caption, sort_order)
           VALUES ($1, $2, $3, $4)`,
          [speciesId, relativeUrl, caption, nextOrder]
        );

        let photo;
        if (result.rows && result.rows[0]) {
          photo = result.rows[0];
        } else {
          const sel = await query(
            'SELECT * FROM species_photos WHERE id = $1',
            [result.lastInsertRowid]
          );
          photo = sel.rows[0];
        }

        savedPhotos.push(photo);
        nextOrder++;
      }

      // If this species has no cover photo yet, set the first uploaded photo as cover
      const speciesFull = await query('SELECT cover_photo_url FROM species WHERE id = $1', [speciesId]);
      if (!speciesFull.rows[0]?.cover_photo_url && savedPhotos.length > 0) {
        const firstPhoto = savedPhotos[0];
        await query(
          'UPDATE species SET cover_photo_url = $1, updated_at = $2 WHERE id = $3',
          [firstPhoto.url, new Date().toISOString(), speciesId]
        );
        await query(
          'UPDATE species_photos SET is_cover = $1 WHERE id = $2',
          [true, firstPhoto.id]
        );
      }

      return res.status(201).json({ photos: savedPhotos });
    } catch (err) {
      console.error('[POST /species/:id/photos]', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Router for standalone /api/photos routes
// ─────────────────────────────────────────────────────────────────────────────
export const photosRouter = Router();

// GET /api/photos – list all photos
photosRouter.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT p.*, s.common_name AS species_common_name
      FROM species_photos p
      LEFT JOIN species s ON s.id = p.species_id
      ORDER BY p.sort_order ASC, p.id DESC
    `);
    return res.json({ photos: result.rows });
  } catch (err) {
    console.error('[GET /api/photos]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/photos/species/:speciesId
photosRouter.get('/species/:speciesId', async (req, res) => {
  try {
    const { speciesId } = req.params;
    const result = await query(
      'SELECT * FROM species_photos WHERE species_id = $1 ORDER BY sort_order ASC, id ASC',
      [speciesId]
    );
    return res.json({ photos: result.rows });
  } catch (err) {
    console.error('[GET /api/photos/species/:speciesId]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/photos/species/:speciesId
photosRouter.post('/species/:speciesId', authenticateToken, handleUpload(uploadImages), async (req, res) => {
  try {
    const { speciesId } = req.params;
    const files = req.files || [];
    if (files.length === 0) {
      return res.status(400).json({ error: 'No photo files uploaded' });
    }

    const countRes = await query('SELECT COUNT(*) as count FROM species_photos WHERE species_id = $1', [speciesId]);
    let nextOrder = parseInt(countRes.rows[0]?.count || 0, 10) + 1;

    const savedPhotos = [];
    for (const f of files) {
      const photoUrl = `/uploads/${f.filename}`;
      const isFirst = nextOrder === 1 ? 1 : 0;
      const insertRes = await query(`
        INSERT INTO species_photos (species_id, url, caption, is_cover, sort_order)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [speciesId, photoUrl, f.originalname, isFirst, nextOrder]);

      const photo = insertRes.rows[0];
      savedPhotos.push(photo);

      if (isFirst) {
        await query('UPDATE species SET cover_photo_url = $1 WHERE id = $2', [photoUrl, speciesId]);
      }
      nextOrder++;
    }

    return res.status(201).json({ photos: savedPhotos });
  } catch (err) {
    console.error('[POST /api/photos/species/:speciesId]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/photos/reorder – must come before /:id routes
photosRouter.put('/reorder', authenticateToken, async (req, res) => {
  try {
    const items = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Expected a non-empty array of { id, sort_order }' });
    }

    for (const item of items) {
      await query(
        'UPDATE species_photos SET sort_order = $1 WHERE id = $2',
        [item.sort_order, item.id]
      );
    }

    return res.json({ message: 'Photo order updated' });
  } catch (err) {
    console.error('[PUT /photos/reorder]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/photos/:id/cover – set photo as cover for its species
photosRouter.put('/:id/cover', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const photoRes = await query('SELECT * FROM species_photos WHERE id = $1', [id]);
    const photo = photoRes.rows[0];
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    const { species_id, url } = photo;

    // Unset all covers for this species
    await query(
      'UPDATE species_photos SET is_cover = $1 WHERE species_id = $2',
      [false, species_id]
    );

    // Set new cover
    await query(
      'UPDATE species_photos SET is_cover = $1 WHERE id = $2',
      [true, id]
    );

    // Update species cover_photo_url
    await query(
      'UPDATE species SET cover_photo_url = $1, updated_at = $2 WHERE id = $3',
      [url, new Date().toISOString(), species_id]
    );

    const updatedPhoto = await query('SELECT * FROM species_photos WHERE id = $1', [id]);
    return res.json({ photo: updatedPhoto.rows[0] });
  } catch (err) {
    console.error('[PUT /photos/:id/cover]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/photos/:id
photosRouter.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const photoRes = await query('SELECT * FROM species_photos WHERE id = $1', [id]);
    const photo = photoRes.rows[0];
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    // Delete from DB
    await query('DELETE FROM species_photos WHERE id = $1', [id]);

    // If this was the cover, clear species cover_photo_url and assign next photo
    if (photo.is_cover === true || photo.is_cover === 1) {
      const nextRes = await query(
        'SELECT * FROM species_photos WHERE species_id = $1 ORDER BY sort_order ASC LIMIT 1',
        [photo.species_id]
      );

      if (nextRes.rows[0]) {
        const next = nextRes.rows[0];
        await query('UPDATE species_photos SET is_cover = $1 WHERE id = $2', [true, next.id]);
        await query(
          'UPDATE species SET cover_photo_url = $1, updated_at = $2 WHERE id = $3',
          [next.url, new Date().toISOString(), photo.species_id]
        );
      } else {
        await query(
          'UPDATE species SET cover_photo_url = NULL, updated_at = $1 WHERE id = $2',
          [new Date().toISOString(), photo.species_id]
        );
      }
    }

    // Delete file from disk (only local paths)
    if (photo.url && photo.url.startsWith('/uploads/')) {
      const filePath = path.join(uploadsDir, path.basename(photo.url));
      fs.unlink(filePath, () => {});
    }

    return res.json({ message: 'Photo deleted successfully' });
  } catch (err) {
    console.error('[DELETE /photos/:id]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default photosRouter;
