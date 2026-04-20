import { Router } from 'express';
import { authenticate, requirePlan } from '../middleware/auth.middleware.js';
import * as nutritionController from '../controllers/nutrition.controller.js';

const router = Router();

router.post(
  '/generate',
  authenticate,
  requirePlan('FREE_TRIAL', 'STARTER', 'PRO', 'ELITE', 'MAX'),
  nutritionController.generateNutritionPlan
);

router.post(
  '/report',
  authenticate,
  requirePlan('FREE_TRIAL', 'STARTER', 'PRO', 'ELITE', 'MAX'),
  nutritionController.generateNutritionReportPdfAndEmail
);

export default router;
