import { Router } from 'express';
import * as statsController from '../controllers/stats.controller.js';
import { authenticate, requirePlan } from '../middleware/auth.middleware.js';

const router = Router();

router.get(
  '/dashboard',
  authenticate,
  requirePlan('FREE_TRIAL', 'STARTER', 'PRO', 'ELITE', 'MAX'),
  statsController.getDashboardStats
);

export default router;
