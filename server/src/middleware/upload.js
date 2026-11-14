/**
 * src/middleware/upload.js
 * Multer upload middleware for images and 3D model files.
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ─────────────────────────────────────────────────────────────────────────────
// Storage engine – flat uploads/ directory, preserve original extension
// ─────────────────────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, uploadsDir);
  },
  filename(_req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// File filters
// ─────────────────────────────────────────────────────────────────────────────
const IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const MODEL_MIME_TYPES = new Set([
  'model/gltf-binary',
  'model/gltf+json',
  'application/octet-stream', // GLB often arrives as this
]);

const MODEL_EXTENSIONS = new Set(['.glb', '.gltf']);
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const ALL_EXTENSIONS = new Set([...IMAGE_EXTENSIONS, ...MODEL_EXTENSIONS]);

function imageFileFilter(_req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (IMAGE_MIME_TYPES.has(file.mimetype) || IMAGE_EXTENSIONS.has(ext)) {
    cb(null, true);
  } else {
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only JPEG, PNG, WebP and GIF images are allowed'));
  }
}

function modelFileFilter(_req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (MODEL_EXTENSIONS.has(ext)) {
    cb(null, true);
  } else {
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only GLB and GLTF 3D model files are allowed'));
  }
}

function allFileFilter(_req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALL_EXTENSIONS.has(ext)) {
    cb(null, true);
  } else {
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Unsupported file type'));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Multer instances
// ─────────────────────────────────────────────────────────────────────────────
const imageUploader = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

const modelUploader = multer({
  storage,
  fileFilter: modelFileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

// ─────────────────────────────────────────────────────────────────────────────
// Exported middleware helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Single image field named "photo" */
export const uploadImage = imageUploader.single('photo');

/** Image uploader accepting any field name for images (prevents Unexpected field error) */
export const uploadContributorPhoto = imageUploader.any();

/** Single image field named "cover" for magazine covers */
export const uploadCover = imageUploader.single('cover');

/** Single image field named "image" for 3D model generation */
export const uploadGenerateImage = imageUploader.single('image');

/** Multiple image fields named "photos" (max 10) */
export const uploadImages = imageUploader.array('photos', 10);

/** Single 3D model field named "model" */
export const uploadModel = modelUploader.single('model');

/**
 * Error-handling wrapper that converts Multer errors into clean JSON responses.
 * Usage: router.post('/path', handleUpload(uploadImage), handler)
 */
export function handleUpload(multerMiddleware) {
  return (req, res, next) => {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      return next();
    }
    multerMiddleware(req, res, (err) => {
      if (!err) return next();
      if (err instanceof multer.MulterError) {
        const messages = {
          LIMIT_FILE_SIZE: 'File is too large (max 10MB).',
          LIMIT_FILE_COUNT: 'Too many files.',
          LIMIT_UNEXPECTED_FILE: err.message || 'Unexpected file field.',
        };
        return res.status(400).json({ error: messages[err.code] || err.message });
      }
      next(err);
    });
  };
}
