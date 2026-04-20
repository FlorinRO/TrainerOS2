import { Router } from 'express';
import express from 'express';
import * as subscriptionController from '../controllers/subscription.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Create checkout session
router.post(
  '/create-checkout',
  authenticate,
  subscriptionController.createCheckoutSession
);

// Get subscription status
router.get(
  '/status',
  authenticate,
  subscriptionController.getSubscriptionStatus
);

// Stripe webhook (raw body needed for signature verification)
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  subscriptionController.handleWebhook
);

export default router;
