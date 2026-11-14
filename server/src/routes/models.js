/**
 * src/routes/models.js
 * 3D Model management routes (GLB/GLTF).
 */

import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { query } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { uploadModel, uploadGenerateImage } from '../middleware/upload.js';
import { generateSpecimen3D } from '../utils/glbGenerator.js';
import { generateWithTripo3D } from '../utils/tripoService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/models/tripo-config – check if Tripo3D API key is configured
// ─────────────────────────────────────────────────────────────────────────────
router.get('/tripo-config', authenticateToken, (req, res) => {
  const key = process.env.TRIPO_API_KEY || '';
  return res.json({
    configured: key.length > 5,
    keyPreview: key.length > 5 ? `${key.slice(0, 4)}...${key.slice(-4)}` : null
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/models/tripo-config – save or update Tripo3D API key
// ─────────────────────────────────────────────────────────────────────────────
router.post('/tripo-config', authenticateToken, (req, res) => {
  const { apiKey } = req.body || {};
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 5) {
    return res.status(400).json({ error: 'Valid Tripo3D API key is required' });
  }

  process.env.TRIPO_API_KEY = apiKey.trim();

  // Try saving to server/.env so it persists across server restarts
  try {
    const envPath = path.join(__dirname, '..', '..', '.env');
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    if (envContent.includes('TRIPO_API_KEY=')) {
      envContent = envContent.replace(/TRIPO_API_KEY=.*(\r?\n|$)/, `TRIPO_API_KEY=${apiKey.trim()}$1`);
    } else {
      envContent += `\nTRIPO_API_KEY=${apiKey.trim()}\n`;
    }
    fs.writeFileSync(envPath, envContent, 'utf8');
  } catch (err) {
    console.warn('[TripoConfig] Could not write to .env:', err.message);
  }

  return res.json({ message: 'Tripo3D API key saved successfully', configured: true });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/models – list all 3D models with species info (protected / admin)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT m.*, s.common_name AS species_common_name, s.scientific_name AS species_scientific_name
      FROM species_3d_models m
      LEFT JOIN species s ON s.id = m.species_id
      ORDER BY m.created_at DESC
    `);
    return res.json({ models: result.rows });
  } catch (err) {
    console.error('[GET /api/models]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/models/species/:speciesId – list models for specific species
// ─────────────────────────────────────────────────────────────────────────────
router.get('/species/:speciesId', async (req, res) => {
  try {
    const { speciesId } = req.params;
    const result = await query(
      'SELECT * FROM species_3d_models WHERE species_id = $1 ORDER BY created_at DESC',
      [speciesId]
    );
    return res.json({ models: result.rows });
  } catch (err) {
    console.error('[GET /api/models/species/:speciesId]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/models/species/:speciesId – upload GLB/GLTF model
// ─────────────────────────────────────────────────────────────────────────────
router.post('/species/:speciesId', authenticateToken, (req, res) => {
  uploadModel(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'File upload error' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No 3D model file provided' });
    }

    try {
      const { speciesId } = req.params;
      const fileUrl = `/uploads/${req.file.filename}`;
      const ext = path.extname(req.file.originalname).replace('.', '').toLowerCase() || 'glb';

      const insertResult = await query(
        `INSERT INTO species_3d_models (species_id, url, format, filename, file_size, status)
         VALUES ($1, $2, $3, $4, $5, 'uploaded')
         RETURNING *`,
        [speciesId, fileUrl, ext, req.file.originalname, req.file.size]
      );

      const model = insertResult.rows[0];
      return res.status(201).json({ message: '3D model uploaded successfully', model });
    } catch (dbErr) {
      console.error('[POST /api/models/species/:speciesId]', dbErr);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/models/species/:speciesId/generate – generate 3D model from image
// Accepts optional multipart image upload in field "image", or uses existing photo
// ─────────────────────────────────────────────────────────────────────────────
router.post('/species/:speciesId/generate', authenticateToken, (req, res) => {
  uploadGenerateImage(req, res, async (uploadErr) => {
    if (uploadErr) {
      return res.status(400).json({ error: uploadErr.message || 'Image upload error' });
    }

    try {
      const { speciesId } = req.params;
      const { style = 'relief' } = req.body || {};

      // 1. Fetch species information
      const speciesRes = await query(
        `SELECT s.*, c.name AS category_name
         FROM species s
         LEFT JOIN categories c ON c.id = s.category_id
         WHERE s.id = $1`,
        [speciesId]
      );

      if (speciesRes.rows.length === 0) {
        return res.status(404).json({ error: 'Species not found' });
      }

      const species = speciesRes.rows[0];

      // 2. Resolve image buffer:
      // Option A: Direct uploaded image in this request (req.file)
      // Option B: Existing species cover photo or gallery photo
      let imageBuffer = null;
      let uploadedFileUrl = null;

      if (req.file) {
        uploadedFileUrl = `/uploads/${req.file.filename}`;
        const localPath = path.join(uploadsDir, req.file.filename);
        if (fs.existsSync(localPath)) {
          imageBuffer = fs.readFileSync(localPath);
        }

        // Also save to species photos if species has no photo yet
        if (!species.cover_photo_url) {
          await query('UPDATE species SET cover_photo_url = $1 WHERE id = $2', [uploadedFileUrl, speciesId]);
        }
        await query(
          'INSERT INTO species_photos (species_id, url, caption, is_cover) VALUES ($1, $2, $3, 0)',
          [speciesId, uploadedFileUrl, req.file.originalname]
        );
      } else {
        let photoUrl = species.cover_photo_url;
        if (!photoUrl) {
          const photoRes = await query(
            `SELECT url FROM species_photos WHERE species_id = $1 ORDER BY is_cover DESC, created_at DESC LIMIT 1`,
            [speciesId]
          );
          if (photoRes.rows.length > 0) {
            photoUrl = photoRes.rows[0].url;
          }
        }

        if (photoUrl) {
          if (photoUrl.startsWith('/uploads/')) {
            const localPath = path.join(uploadsDir, path.basename(photoUrl));
            if (fs.existsSync(localPath)) {
              imageBuffer = fs.readFileSync(localPath);
            }
          } else if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
            try {
              const resp = await fetch(photoUrl);
              if (resp.ok) {
                imageBuffer = Buffer.from(await resp.arrayBuffer());
              }
            } catch (fetchErr) {
              console.warn('[Generate 3D] Failed to fetch remote photo:', fetchErr.message);
            }
          }
        }
      }

      // 3. Generate 3D specimen GLB buffer
      let glbBuffer;
      if (style === 'tripo3d') {
        if (!imageBuffer || imageBuffer.length === 0) {
          return res.status(400).json({
            error: 'An image is required to generate a true 3D species model with Tripo3D AI.'
          });
        }
        const mimeType = req.file?.mimetype || 'image/jpeg';
        const apiKey = req.body?.apiKey || process.env.TRIPO_API_KEY;
        glbBuffer = await generateWithTripo3D({
          imageBuffer,
          mimeType,
          apiKey
        });
      } else {
        glbBuffer = await generateSpecimen3D({
          commonName: species.common_name,
          scientificName: species.scientific_name,
          categoryName: species.category_name,
          conservationStatus: species.conservation_status,
          imageBuffer,
          style
        });
      }

      // 4. Save to uploads directory
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const safeName = (species.common_name || 'Specimen').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `specimen-${speciesId}-${Date.now()}.glb`;
      const filePath = path.join(uploadsDir, filename);
      fs.writeFileSync(filePath, glbBuffer);
      const fileUrl = `/uploads/${filename}`;

      // 5. Store record in database with approved status
      const insertResult = await query(
        `INSERT INTO species_3d_models (species_id, url, format, filename, file_size, status)
         VALUES ($1, $2, 'glb', $3, $4, 'approved')
         RETURNING *`,
        [speciesId, fileUrl, `${safeName}_3D_${style}.glb`, glbBuffer.length]
      );

      const model = insertResult.rows[0];

      return res.status(201).json({
        message: '3D model generated from image successfully',
        model: {
          ...model,
          species_common_name: species.common_name,
          species_scientific_name: species.scientific_name
        }
      });
    } catch (err) {
      console.error('[POST /api/models/species/:speciesId/generate]', err);
      return res.status(500).json({ error: err.message || 'Failed to generate 3D model' });
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/models/:id/approve – approve a 3D model
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id/approve', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `UPDATE species_3d_models SET status = 'approved' WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '3D model not found' });
    }

    return res.json({ message: 'Model approved', model: result.rows[0] });
  } catch (err) {
    console.error('[PUT /api/models/:id/approve]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/models/:id/status – update status (uploaded, approved, failed)
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['uploaded', 'approved', 'failed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await query(
      `UPDATE species_3d_models SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '3D model not found' });
    }

    return res.json({ message: 'Status updated', model: result.rows[0] });
  } catch (err) {
    console.error('[PUT /api/models/:id/status]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/models/:id – delete 3D model
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const findRes = await query('SELECT * FROM species_3d_models WHERE id = $1', [id]);

    if (findRes.rows.length === 0) {
      return res.status(404).json({ error: '3D model not found' });
    }

    const model = findRes.rows[0];

    // Remove physical file if on disk
    if (model.url && model.url.startsWith('/uploads/')) {
      const filename = path.basename(model.url);
      const filePath = path.join(uploadsDir, filename);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch {}
      }
    }

    await query('DELETE FROM species_3d_models WHERE id = $1', [id]);
    return res.json({ message: '3D model deleted' });
  } catch (err) {
    console.error('[DELETE /api/models/:id]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

