import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();
const PRO_MONTHLY_PRICE_EUR = 19.9;
const MAX_MONTHLY_PRICE_EUR = 39.99;
const LAUNCH_PROMO_MONTHLY_PRICE_EUR = 12.99;

// Validate promo code
router.post('/validate', async (req, res) => {
  try {
    const { code, plan } = req.body as { code?: string; plan?: 'PRO' | 'MAX' };

    if (!code) {
      return res.status(400).json({ error: 'Promo code required' });
    }

    const promoCode = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promoCode) {
      return res.status(404).json({ error: 'Invalid promo code' });
    }

    if (!promoCode.isActive) {
      return res.status(400).json({ error: 'Promo code is no longer active' });
    }

    if (promoCode.expiresAt && new Date() > promoCode.expiresAt) {
      return res.status(400).json({ error: 'Promo code has expired' });
    }

    if (promoCode.maxUses && promoCode.usedCount >= promoCode.maxUses) {
      return res.status(400).json({ error: 'Promo code has reached maximum uses' });
    }

    // Calculate final price
    const selectedPlan = plan === 'MAX' ? 'MAX' : 'PRO';
    const basePrice = selectedPlan === 'MAX' ? MAX_MONTHLY_PRICE_EUR : PRO_MONTHLY_PRICE_EUR;
    let finalPrice = basePrice;

    if (promoCode.discountType === 'PERCENTAGE') {
      finalPrice = basePrice * (1 - promoCode.discountValue / 100);
    } else if (promoCode.discountType === 'FIXED') {
      finalPrice = basePrice - promoCode.discountValue;
    } else if (promoCode.discountType === 'OVERRIDE' && promoCode.finalPrice) {
      finalPrice = promoCode.finalPrice;
    }

    // Keep promo validation aligned with checkout business rule.
    if (selectedPlan === 'PRO' && code.toUpperCase() === 'LAUNCH2026') {
      finalPrice = LAUNCH_PROMO_MONTHLY_PRICE_EUR;
    }

    finalPrice = Math.max(0, finalPrice); // Ensure not negative

    return res.json({
      valid: true,
      code: promoCode.code,
      plan: selectedPlan,
      discountType: promoCode.discountType,
      discountValue: promoCode.discountValue,
      originalPrice: basePrice,
      finalPrice: parseFloat(finalPrice.toFixed(2)),
      savings: parseFloat((basePrice - finalPrice).toFixed(2)),
    });
  } catch (error: any) {
    console.error('Promo validation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
