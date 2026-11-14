/**
 * src/utils/imageStorage.js
 * Permanent image storage utility.
 *
 * If CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME is configured:
 *   Uploads to Cloudinary REST API and returns permanent HTTPS CDN URL.
 * Otherwise:
 *   Optimizes image with Sharp (compresses to ~20-50KB) and returns a permanent
 *   Data URI (data:image/jpeg;base64,...) stored directly in Neon PostgreSQL.
 *   This guarantees uploaded images are NEVER lost when Render redeploys.
 */

import fs from 'fs';
import crypto from 'crypto';
import sharp from 'sharp';

export async function processUploadedImage(file, options = {}) {
  if (!file) return null;
  const filePath = file.path;
  const maxWidth = options.maxWidth || 800;
  const maxHeight = options.maxHeight || 800;
  const quality = options.quality || 80;

  try {
    // 1. Check for Cloudinary configuration
    const cloudinaryUrl = process.env.CLOUDINARY_URL;
    let cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    let apiKey = process.env.CLOUDINARY_API_KEY;
    let apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (cloudinaryUrl && !cloudName) {
      try {
        // format: cloudinary://api_key:api_secret@cloud_name
        const parsed = new URL(cloudinaryUrl);
        cloudName = parsed.hostname;
        apiKey = parsed.username;
        apiSecret = parsed.password;
      } catch (e) {
        console.warn('[imageStorage] Invalid CLOUDINARY_URL format:', e.message);
      }
    }

    if (cloudName && apiKey && apiSecret) {
      try {
        const timestamp = Math.round(Date.now() / 1000);
        const folder = options.folder || 'biodiversity';
        const signatureStr = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
        const signature = crypto.createHash('sha1').update(signatureStr).digest('hex');

        const fileBuffer = await fs.promises.readFile(filePath);
        const formData = new FormData();
        formData.append('file', new Blob([fileBuffer]));
        formData.append('api_key', apiKey);
        formData.append('timestamp', timestamp.toString());
        formData.append('folder', folder);
        formData.append('signature', signature);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const json = await res.json();
          fs.unlink(filePath, () => {});
          return json.secure_url;
        } else {
          const errText = await res.text();
          console.warn('[imageStorage] Cloudinary API upload failed, falling back to permanent DB storage:', errText);
        }
      } catch (cErr) {
        console.warn('[imageStorage] Cloudinary upload error:', cErr.message);
      }
    }

    // 2. Default: Optimize with Sharp and store as permanent Data URI in PostgreSQL
    const buffer = await sharp(filePath)
      .resize(maxWidth, maxHeight, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality, progressive: true })
      .toBuffer();

    fs.unlink(filePath, () => {});
    const base64 = buffer.toString('base64');
    return `data:image/jpeg;base64,${base64}`;
  } catch (err) {
    console.error('[imageStorage] Error processing image:', err);
    return file.filename ? `/uploads/${file.filename}` : null;
  }
}
