import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import * as feedbackController from '../controllers/feedback.controller.js';
import { authenticate, requirePlan } from '../middleware/auth.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || './uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '524288000'), // 500MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = /\.(jpeg|jpg|png|gif|mp4|mov|avi|webm|mkv)$/i;
    const ext = allowedExtensions.test(file.originalname.toLowerCase());
    
    // Allow image/* and video/* mimetypes
    const isImage = file.mimetype.startsWith('image/');
    const isVideo = file.mimetype.startsWith('video/');
    
    if (ext && (isImage || isVideo)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images (jpg, png, gif) and videos (mp4, mov, avi, webm) allowed.'));
    }
  },
});

const router = Router();

router.post(
  '/analyze',
  authenticate,
  requirePlan('FREE_TRIAL', 'STARTER', 'PRO', 'ELITE', 'MAX'),
  upload.single('file'),
  feedbackController.analyze
);

router.post(
  '/analyze-text',
  authenticate,
  requirePlan('FREE_TRIAL', 'STARTER', 'PRO', 'ELITE', 'MAX'),
  feedbackController.analyzeText
);

router.get(
  '/history',
  authenticate,
  requirePlan('FREE_TRIAL', 'STARTER', 'PRO', 'ELITE', 'MAX'),
  feedbackController.getHistory
);

router.get(
  '/:id',
  authenticate,
  requirePlan('FREE_TRIAL', 'STARTER', 'PRO', 'ELITE', 'MAX'),
  feedbackController.getById
);

export default router;
