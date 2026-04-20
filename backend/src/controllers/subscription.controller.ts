import type { Request, Response } from 'express';
import Stripe from 'stripe';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey)
  : null;

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const SUBSCRIPTION_PLANS = ['PRO', 'MAX'] as const;
type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number];
type BillingCycle = 'monthly' | 'yearly';

const PRO_MONTHLY_PRICE_EUR = 19.9;
const PRO_YEARLY_PRICE_EUR = 190;
const MAX_MONTHLY_PRICE_EUR = 39.99;
const MAX_YEARLY_PRICE_EUR = 379.99;
const LAUNCH_PROMO_MONTHLY_PRICE_EUR = 12.99;

const stripeProductFallbacks: Record<SubscriptionPlan, Record<BillingCycle, string>> = {
  PRO: {
    monthly: process.env.STRIPE_MONTHLY_PRODUCT_ID || '',
    yearly: process.env.STRIPE_YEARLY_PRODUCT_ID || '',
  },
  MAX: {
    monthly: process.env.STRIPE_MAX_MONTHLY_PRODUCT_ID || 'prod_U4IXeud1AHKlgq',
    yearly: process.env.STRIPE_MAX_YEARLY_PRODUCT_ID || 'prod_U4IZWJc92Bl3YU',
  },
};

const checkoutPayloadSchema = z.object({
  billingCycle: z.enum(['monthly', 'yearly']),
  plan: z.enum(SUBSCRIPTION_PLANS).default('PRO'),
  promoCode: z.string().trim().max(64).optional(),
  successUrl: z.string().trim().min(1).max(512).optional(),
  cancelUrl: z.string().trim().min(1).max(512).optional(),
});

function getBasePrice(plan: SubscriptionPlan, billingCycle: BillingCycle): number {
  if (plan === 'MAX') {
    return billingCycle === 'yearly' ? MAX_YEARLY_PRICE_EUR : MAX_MONTHLY_PRICE_EUR;
  }

  return billingCycle === 'yearly' ? PRO_YEARLY_PRICE_EUR : PRO_MONTHLY_PRICE_EUR;
}

function getPlanDisplayName(plan: SubscriptionPlan): string {
  return plan === 'MAX' ? 'TrainerOS Max' : 'TrainerOS Pro';
}

async function resolveStripePriceId(
  stripeClient: Stripe,
  plan: SubscriptionPlan,
  billingCycle: BillingCycle
): Promise<string> {
  const isUsablePriceId = (value: string | undefined): value is string =>
    !!value &&
    value.startsWith('price_') &&
    !value.toLowerCase().includes('placeholder');

  const explicitPriceId = plan === 'MAX'
    ? billingCycle === 'yearly'
      ? process.env.STRIPE_MAX_YEARLY_PRICE_ID
      : process.env.STRIPE_MAX_MONTHLY_PRICE_ID
    : billingCycle === 'yearly'
      ? process.env.STRIPE_YEARLY_PRICE_ID
      : process.env.STRIPE_MONTHLY_PRICE_ID;

  if (isUsablePriceId(explicitPriceId)) {
    return explicitPriceId;
  }

  const productId = stripeProductFallbacks[plan][billingCycle];

  if (!productId?.startsWith('prod_')) {
    throw new Error(`Missing Stripe ${plan} ${billingCycle} price/product configuration`);
  }

  const interval = billingCycle === 'yearly' ? 'year' : 'month';
  const recurringPrices = await stripeClient.prices.list({
    product: productId,
    active: true,
    type: 'recurring',
    limit: 100,
  });

  const matchedPrice = recurringPrices.data.find(
    (price) => price.recurring?.interval === interval
  );

  if (!matchedPrice) {
    throw new Error(`No active ${plan} ${billingCycle} recurring price found for product ${productId}`);
  }

  return matchedPrice.id;
}

export async function createCheckoutSession(req: Request, res: Response): Promise<void> {
  try {
    if (!stripe) {
      res.status(500).json({ error: 'Stripe is not configured on server' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { billingCycle, plan, promoCode, successUrl, cancelUrl } = checkoutPayloadSchema.parse(req.body);

    const priceId = await resolveStripePriceId(stripe, plan, billingCycle);

    let appliedPromoCode: string | null = null;
    let discountedAmountCents: number | null = null;

    if (promoCode) {
      const code = promoCode.toUpperCase().trim();
      if (!code) {
        res.status(400).json({ error: 'Promo code required' });
        return;
      }

      const promo = await prisma.promoCode.findUnique({
        where: { code },
      });

      if (!promo) {
        res.status(404).json({ error: 'Invalid promo code' });
        return;
      }

      if (!promo.isActive) {
        res.status(400).json({ error: 'Promo code is no longer active' });
        return;
      }

      if (promo.expiresAt && new Date() > promo.expiresAt) {
        res.status(400).json({ error: 'Promo code has expired' });
        return;
      }

      if (promo.maxUses && promo.usedCount >= promo.maxUses) {
        res.status(400).json({ error: 'Promo code has reached maximum uses' });
        return;
      }

      const basePrice = getBasePrice(plan, billingCycle);
      let finalPrice = basePrice;

      if (promo.discountType === 'PERCENTAGE') {
        finalPrice = basePrice * (1 - promo.discountValue / 100);
      } else if (promo.discountType === 'FIXED') {
        finalPrice = basePrice - promo.discountValue;
      } else if (promo.discountType === 'OVERRIDE' && promo.finalPrice) {
        finalPrice = promo.finalPrice;
      }

      // Business rule: LAUNCH2026 monthly promo is first month at €12.99 for PRO only.
      if (plan === 'PRO' && billingCycle === 'monthly' && code === 'LAUNCH2026') {
        finalPrice = LAUNCH_PROMO_MONTHLY_PRICE_EUR;
      }

      finalPrice = Math.max(0.5, finalPrice); // Stripe minimums
      discountedAmountCents = Math.round(finalPrice * 100);
      appliedPromoCode = promo.code;
    }

    const recurringInterval: Stripe.PriceCreateParams.Recurring.Interval =
      billingCycle === 'yearly' ? 'year' : 'month';

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      discountedAmountCents !== null
        ? [
            {
              price_data: {
                currency: 'eur',
                unit_amount: discountedAmountCents,
                recurring: {
                  interval: recurringInterval,
                },
                product_data: {
                  name: getPlanDisplayName(plan),
                },
              },
              quantity: 1,
            },
          ]
        : [
            {
              price: priceId,
              quantity: 1,
            },
          ];

    const session = await stripe.checkout.sessions.create({
      customer_email: req.user.email,
      client_reference_id: req.user.id,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: lineItems,
      success_url: successUrl || `${FRONTEND_URL}/dashboard?payment=success`,
      cancel_url: cancelUrl || `${FRONTEND_URL}/pricing?payment=cancelled`,
      metadata: {
        userId: req.user.id,
        billingCycle,
        plan,
        promoCode: appliedPromoCode || '',
      },
      subscription_data: {
        metadata: {
          userId: req.user.id,
        },
      },
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }

    console.error('Stripe checkout error:', error);
    res.status(500).json({ error: error.message || 'Failed to create checkout session' });
  }
}

export async function handleWebhook(req: Request, res: Response): Promise<void> {
  if (!stripe) {
    res.status(500).json({ error: 'Stripe is not configured on server' });
    return;
  }

  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const billingCycle = session.metadata?.billingCycle as BillingCycle | undefined;
        const selectedPlan = session.metadata?.plan as SubscriptionPlan | undefined;
        const promoCode = session.metadata?.promoCode;

        if (userId) {
          const effectivePlan = selectedPlan && SUBSCRIPTION_PLANS.includes(selectedPlan)
            ? selectedPlan
            : 'PRO';

          const expiresAt = new Date();
          if (billingCycle === 'yearly') {
            expiresAt.setFullYear(expiresAt.getFullYear() + 1);
          } else {
            expiresAt.setMonth(expiresAt.getMonth() + 1);
          }

          await prisma.user.update({
            where: { id: userId },
            data: {
              plan: effectivePlan,
              planExpiresAt: expiresAt,
              promoCode: promoCode || null,
            },
          });

          if (promoCode) {
            await prisma.promoCode.update({
              where: { code: promoCode },
              data: { usedCount: { increment: 1 } },
            });
          }

          console.log(`✅ User ${userId} upgraded to ${effectivePlan} (${billingCycle || 'monthly'})`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              plan: 'FREE_TRIAL',
              planExpiresAt: null,
            },
          });

          console.log(`❌ User ${userId} subscription cancelled`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`💰 Payment succeeded for invoice ${invoice.id}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`❌ Payment failed for invoice ${invoice.id}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}

export async function getSubscriptionStatus(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    res.json({
      plan: req.user.plan,
      planExpiresAt: req.user.planExpiresAt,
      trialEndsAt: req.user.trialEndsAt,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get subscription status' });
  }
}

export default {
  createCheckoutSession,
  handleWebhook,
  getSubscriptionStatus,
};
