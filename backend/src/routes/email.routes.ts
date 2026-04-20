import { Router } from 'express';
import { authenticate, requirePlan } from '../middleware/auth.middleware.js';
import * as emailController from '../controllers/email.controller.js';

const router = Router();

router.post(
  '/generate',
  authenticate,
  requirePlan('FREE_TRIAL', 'STARTER', 'PRO', 'ELITE', 'MAX'),
  emailController.generateEmail
);

export default router;
