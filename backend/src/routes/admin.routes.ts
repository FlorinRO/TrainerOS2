import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { adminRateLimiter, adminAuditLog } from '../middleware/security.middleware.js';

const router = Router();

router.use(authenticate, requireAdmin, adminRateLimiter, adminAuditLog);

router.get('/overview', adminController.getOverview);
router.get('/users', adminController.listUsers);
router.get('/users/:userId/profile', adminController.getUserProfile);
router.patch('/users/:userId', adminController.updateUser);
router.get('/billing', adminController.getBillingSummary);

export default router;
