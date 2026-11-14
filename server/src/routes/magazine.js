/**
 * src/routes/magazine.js
 * Magazine publication management and public magazine reader endpoints.
 */

import { Router } from 'express';
import { query } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { handleUpload, uploadCover } from '../middleware/upload.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/magazine/public – latest published magazine with all pages
// ─────────────────────────────────────────────────────────────────────────────
router.get('/public', async (req, res) => {
  try {
    const pubRes = await query(`
      SELECT * FROM magazine_publications
      WHERE status = 'published'
      ORDER BY updated_at DESC
      LIMIT 1
    `);

    if (pubRes.rows.length === 0) {
      return res.json({ publication: null, pages: [] });
    }

    const publication = pubRes.rows[0];

    const pagesRes = await query(`
      SELECT * FROM magazine_pages
      WHERE publication_id = $1
      ORDER BY sort_order ASC, page_number ASC
    `, [publication.id]);

    return res.json({
      publication,
      pages: pagesRes.rows
    });
  } catch (err) {
    console.error('[GET /api/magazine/public]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/magazine/stats – overall publication & biodiversity stats (protected)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const [speciesRes, catRes, photoRes, modelRes, pubRes, teamRes] = await Promise.all([
      query('SELECT COUNT(*) as count FROM species'),
      query('SELECT COUNT(*) as count FROM categories'),
      query('SELECT COUNT(*) as count FROM species_photos'),
      query('SELECT COUNT(*) as count FROM species_3d_models'),
      query("SELECT COUNT(*) as count FROM magazine_publications WHERE status = 'published'"),
      query('SELECT COUNT(*) as count FROM contributors'),
    ]);

    return res.json({
      species_count: parseInt(speciesRes.rows[0]?.count || 0, 10),
      category_count: parseInt(catRes.rows[0]?.count || 0, 10),
      photo_count: parseInt(photoRes.rows[0]?.count || 0, 10),
      model_count: parseInt(modelRes.rows[0]?.count || 0, 10),
      published_magazines: parseInt(pubRes.rows[0]?.count || 0, 10),
      contributor_count: parseInt(teamRes.rows[0]?.count || 0, 10),
      team_count: parseInt(teamRes.rows[0]?.count || 0, 10),
    });
  } catch (err) {
    console.error('[GET /api/magazine/stats]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/magazine/all – list all publications (protected)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/all', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT p.*,
        (SELECT COUNT(*) FROM magazine_pages WHERE publication_id = p.id) AS page_count
      FROM magazine_publications p
      ORDER BY p.updated_at DESC
    `);
    return res.json({ publications: result.rows });
  } catch (err) {
    console.error('[GET /api/magazine/all]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/magazine/:id – get publication with pages (protected)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const pubRes = await query('SELECT * FROM magazine_publications WHERE id = $1', [id]);
    if (pubRes.rows.length === 0) {
      return res.status(404).json({ error: 'Publication not found' });
    }

    const pagesRes = await query(
      'SELECT * FROM magazine_pages WHERE publication_id = $1 ORDER BY sort_order ASC, page_number ASC',
      [id]
    );

    return res.json({ publication: pubRes.rows[0], pages: pagesRes.rows });
  } catch (err) {
    console.error('[GET /api/magazine/:id]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/magazine – create publication (protected)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, subtitle, edition, volume, cover_photo_url, intro_title, intro_body } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Publication title is required' });
    }

    const result = await query(`
      INSERT INTO magazine_publications
        (title, subtitle, edition, volume, cover_photo_url, status, intro_title, intro_body)
      VALUES ($1, $2, $3, $4, $5, 'draft', $6, $7)
      RETURNING *
    `, [title, subtitle || null, edition || null, volume || null, cover_photo_url || null, intro_title || null, intro_body || null]);

    const publication = result.rows[0];

    // Create default Cover and Back-Cover pages automatically
    await query(`
      INSERT INTO magazine_pages (publication_id, page_number, template_type, sort_order, content_json)
      VALUES ($1, 1, 'cover', 1, $2)
    `, [publication.id, JSON.stringify({ title: publication.title, subtitle: publication.subtitle })]);

    await query(`
      INSERT INTO magazine_pages (publication_id, page_number, template_type, sort_order, content_json)
      VALUES ($1, 2, 'back-cover', 2, $2)
    `, [publication.id, JSON.stringify({ closing: 'Preserving biodiversity for future generations.' })]);

    return res.status(201).json({ message: 'Publication created', publication });
  } catch (err) {
    console.error('[POST /api/magazine]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/magazine/:id – update publication details (protected)
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subtitle, edition, volume, cover_photo_url, intro_title, intro_body, status } = req.body;

    const result = await query(`
      UPDATE magazine_publications
      SET title = COALESCE($1, title),
          subtitle = COALESCE($2, subtitle),
          edition = COALESCE($3, edition),
          volume = COALESCE($4, volume),
          cover_photo_url = COALESCE($5, cover_photo_url),
          intro_title = COALESCE($6, intro_title),
          intro_body = COALESCE($7, intro_body),
          status = COALESCE($8, status),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *
    `, [title, subtitle, edition, volume, cover_photo_url, intro_title, intro_body, status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Publication not found' });
    }

    return res.json({ message: 'Publication updated', publication: result.rows[0] });
  } catch (err) {
    console.error('[PUT /api/magazine/:id]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/magazine/:id/publish – toggle publish status
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id/publish', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const current = await query('SELECT status FROM magazine_publications WHERE id = $1', [id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Publication not found' });
    }

    const nextStatus = current.rows[0].status === 'published' ? 'draft' : 'published';

    // If publishing, optionally unpublish other publications so one is active
    if (nextStatus === 'published') {
      await query("UPDATE magazine_publications SET status = 'draft' WHERE id != $1", [id]);
    }

    const result = await query(
      "UPDATE magazine_publications SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
      [nextStatus, id]
    );

    return res.json({ message: `Publication ${nextStatus}`, publication: result.rows[0] });
  } catch (err) {
    console.error('[PUT /api/magazine/:id/publish]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/magazine/:id – delete publication
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM magazine_publications WHERE id = $1', [id]);
    return res.json({ message: 'Publication deleted' });
  } catch (err) {
    console.error('[DELETE /api/magazine/:id]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/magazine/:id/cover – upload magazine cover photo
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/cover', authenticateToken, handleUpload(uploadCover), async (req, res) => {
  try {
    const pubId = parseInt(req.params.id, 10);
    if (isNaN(pubId)) {
      return res.status(400).json({ error: 'Invalid publication ID' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No cover image file provided' });
    }

    const coverUrl = `/uploads/${req.file.filename}`;

    const result = await query(`
      UPDATE magazine_publications
      SET cover_photo_url = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [coverUrl, pubId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Publication not found' });
    }

    return res.json({
      message: 'Cover image updated successfully',
      cover_photo_url: coverUrl,
      publication: result.rows[0]
    });
  } catch (err) {
    console.error('[POST /api/magazine/:id/cover]', err);
    return res.status(500).json({ error: err.message || 'Failed to upload cover photo' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/magazine/:id/auto-generate – auto-generate complete flipbook from species
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/auto-generate', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Verify publication exists
    const pubRes = await query('SELECT * FROM magazine_publications WHERE id = $1', [id]);
    if (pubRes.rows.length === 0) {
      return res.status(404).json({ error: 'Publication not found' });
    }
    const pub = pubRes.rows[0];

    // 2. Fetch all published species
    const speciesRes = await query(`
      SELECT s.*, c.name AS category_name, c.color AS category_color
      FROM species s
      LEFT JOIN categories c ON c.id = s.category_id
      WHERE s.is_published = 1
      ORDER BY s.is_featured DESC, s.sort_order ASC, s.created_at DESC
      LIMIT 8
    `);

    const speciesList = speciesRes.rows || [];

    // 3. Fetch approved gallery photos
    const photosRes = await query(`
      SELECT p.*, s.common_name as species_name
      FROM species_photos p
      LEFT JOIN species s ON s.id = p.species_id
      ORDER BY p.is_cover DESC, p.created_at DESC
      LIMIT 4
    `);
    const galleryPhotos = photosRes.rows.map(p => ({
      url: p.url,
      caption: p.caption || p.species_name || 'Specimen Photo'
    }));

    // 4. Clear existing pages
    await query('DELETE FROM magazine_pages WHERE publication_id = $1', [id]);

    const pagesToInsert = [];
    let pageNum = 1;

    // Page 1: Cover
    pagesToInsert.push({
      page_number: pageNum++,
      template_type: 'cover',
      content_json: {
        title: pub.title || 'BIODIVERSITY',
        subtitle: pub.subtitle || 'An Interactive Journey Through Living Nature',
        edition: pub.edition || 'Inaugural Issue',
        volume: pub.volume || 'Vol. 1'
      }
    });

    // We'll prepare TOC entries
    const tocEntries = [];
    let curTocPage = 3; // Intro starts on page 3
    tocEntries.push({ page: '03', title: 'Editorial: ' + (pub.intro_title || 'Living Heritage') });

    speciesList.forEach((sp, idx) => {
      const spPageNum = curTocPage + 1 + (idx * 2);
      tocEntries.push({
        page: spPageNum < 10 ? `0${spPageNum}` : `${spPageNum}`,
        title: `${sp.common_name} (${sp.scientific_name})`
      });
    });

    if (galleryPhotos.length > 0) {
      const galPageNum = curTocPage + 1 + (speciesList.length * 2);
      tocEntries.push({
        page: galPageNum < 10 ? `0${galPageNum}` : `${galPageNum}`,
        title: 'Field Research Photo Gallery'
      });
    }

    // Page 2: Table of Contents
    pagesToInsert.push({
      page_number: pageNum++,
      template_type: 'toc',
      content_json: {
        entries: tocEntries
      }
    });

    // Page 3: Editorial Introduction
    pagesToInsert.push({
      page_number: pageNum++,
      template_type: 'intro',
      content_json: {
        title: pub.intro_title || 'Celebrating Earth’s Living Heritage',
        body: pub.intro_body || 'Welcome to BIODIVERSITY — an interactive journal celebrating the complexity, beauty, and fragility of our living ecosystems. Through meticulous field observations, scientific taxonomic dossiers, high-fidelity 3D structural models, and photographic documentation, we invite you into an immersive exploration of the species that define our natural heritage.'
      }
    });

    // Inner Pages: Species Spreads (Feature + Detail)
    for (const sp of speciesList) {
      pagesToInsert.push({
        page_number: pageNum++,
        template_type: 'species-feature',
        content_json: {
          species: sp
        }
      });

      pagesToInsert.push({
        page_number: pageNum++,
        template_type: 'species-detail',
        content_json: {
          species: sp
        }
      });
    }

    // Photo Gallery Page if photos available
    if (galleryPhotos.length > 0) {
      pagesToInsert.push({
        page_number: pageNum++,
        template_type: 'gallery',
        content_json: {
          photos: galleryPhotos
        }
      });
    }

    // Final Page: Back Cover
    pagesToInsert.push({
      page_number: pageNum++,
      template_type: 'back-cover',
      content_json: {
        closing: 'Preserving biodiversity for future generations. Field archives, habitat documentation, and ecological conservation.',
        credits: 'BIODIVERSITY Editorial Team & Field Research Naturalists'
      }
    });

    // Insert all pages sequentially
    for (let i = 0; i < pagesToInsert.length; i++) {
      const p = pagesToInsert[i];
      await query(`
        INSERT INTO magazine_pages (publication_id, page_number, template_type, sort_order, content_json)
        VALUES ($1, $2, $3, $4, $5)
      `, [id, p.page_number, p.template_type, i + 1, JSON.stringify(p.content_json)]);
    }

    // Update publication timestamp
    await query("UPDATE magazine_publications SET updated_at = CURRENT_TIMESTAMP WHERE id = $1", [id]);

    const createdPages = await query(
      'SELECT * FROM magazine_pages WHERE publication_id = $1 ORDER BY sort_order ASC',
      [id]
    );

    return res.json({
      message: `Successfully assembled ${createdPages.rows.length}-page flipbook edition`,
      pages: createdPages.rows
    });
  } catch (err) {
    console.error('[POST /api/magazine/:id/auto-generate]', err);
    return res.status(500).json({ error: 'Failed to auto-generate magazine issue' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/magazine/:id/pages – add page
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/pages', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { template_type, content_json, sort_order } = req.body;

    const countRes = await query('SELECT COUNT(*) as count FROM magazine_pages WHERE publication_id = $1', [id]);
    const nextOrder = sort_order ?? (parseInt(countRes.rows[0].count, 10) + 1);

    const result = await query(`
      INSERT INTO magazine_pages (publication_id, page_number, template_type, sort_order, content_json)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [id, nextOrder, template_type || 'blank', nextOrder, typeof content_json === 'string' ? content_json : JSON.stringify(content_json || {})]);

    return res.status(201).json({ message: 'Page added', page: result.rows[0] });
  } catch (err) {
    console.error('[POST /api/magazine/:id/pages]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/magazine/pages/:pageId – update page
// ─────────────────────────────────────────────────────────────────────────────
router.put('/pages/:pageId', authenticateToken, async (req, res) => {
  try {
    const { pageId } = req.params;
    const { template_type, content_json, sort_order } = req.body;

    const result = await query(`
      UPDATE magazine_pages
      SET template_type = COALESCE($1, template_type),
          content_json = COALESCE($2, content_json),
          sort_order = COALESCE($3, sort_order)
      WHERE id = $4
      RETURNING *
    `, [
      template_type,
      content_json ? (typeof content_json === 'string' ? content_json : JSON.stringify(content_json)) : null,
      sort_order,
      pageId
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Page not found' });
    }

    return res.json({ message: 'Page updated', page: result.rows[0] });
  } catch (err) {
    console.error('[PUT /api/magazine/pages/:pageId]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/magazine/pages/:pageId – remove page
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/pages/:pageId', authenticateToken, async (req, res) => {
  try {
    const { pageId } = req.params;
    await query('DELETE FROM magazine_pages WHERE id = $1', [pageId]);
    return res.json({ message: 'Page deleted' });
  } catch (err) {
    console.error('[DELETE /api/magazine/pages/:pageId]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/magazine/:id/pages/reorder – batch reorder pages
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id/pages/reorder', authenticateToken, async (req, res) => {
  try {
    const { pages } = req.body; // array of { id, sort_order, page_number }
    if (!Array.isArray(pages)) {
      return res.status(400).json({ error: 'Expected array of pages' });
    }

    for (const p of pages) {
      await query(
        'UPDATE magazine_pages SET sort_order = $1, page_number = $2 WHERE id = $3',
        [p.sort_order, p.page_number || p.sort_order, p.id]
      );
    }

    return res.json({ message: 'Pages reordered' });
  } catch (err) {
    console.error('[PUT /api/magazine/:id/pages/reorder]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

