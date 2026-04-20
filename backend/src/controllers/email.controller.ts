import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import * as openaiService from '../services/openai.service.js';
import { getPlanLimits } from '../config/planLimits.js';

const generateEmailSchema = z.object({
  topic: z.string().min(5).max(300),
  objective: z.enum(['lead-magnet', 'nurture', 'sales', 'reengagement']).default('nurture'),
  emailType: z.enum(['single', 'welcome', 'promo', 'newsletter']).default('single'),
  tone: z.enum(['direct', 'empathetic', 'authoritative', 'friendly']).default('friendly'),
  offer: z.string().max(400).optional().default(''),
  audiencePain: z.string().max(400).optional().default(''),
  ctaGoal: z.string().max(200).optional().default(''),
  language: z.enum(['ro', 'en']).default('ro'),
});

export async function generateEmail(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const payload = generateEmailSchema.parse(req.body);

    if (!req.user.isAdmin) {
      const monthlyEmailLimit = getPlanLimits(req.user.plan).emailsPerMonth;
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const nextMonthStart = new Date(monthStart);
      nextMonthStart.setMonth(nextMonthStart.getMonth() + 1);

      const emailsGeneratedThisMonth = await prisma.emailGeneration.count({
        where: {
          userId: req.user.id,
          createdAt: {
            gte: monthStart,
            lt: nextMonthStart,
          },
        },
      });

      if (emailsGeneratedThisMonth >= monthlyEmailLimit) {
        res.status(429).json({
          error: 'Monthly email limit reached',
          message: `Ai atins limita de ${monthlyEmailLimit} emailuri generate pe luna curentă.`,
          generatedThisMonth: emailsGeneratedThisMonth,
          limit: monthlyEmailLimit,
        });
        return;
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        name: true,
        niche: true,
        icpProfile: true,
        positioningMessage: true,
        contentPreferences: true,
      },
    });

    const result = await openaiService.generateMarketingEmail({
      topic: payload.topic,
      objective: payload.objective,
      emailType: payload.emailType,
      tone: payload.tone,
      offer: payload.offer,
      audiencePain: payload.audiencePain,
      ctaGoal: payload.ctaGoal,
      language: payload.language,
      userContext: {
        name: user?.name || req.user.name || '',
        niche: user?.niche || req.user.niche || '',
        icpProfile: user?.icpProfile || req.user.icpProfile || '',
        positioningMessage: user?.positioningMessage || req.user.positioningMessage || '',
        contentPreferences: user?.contentPreferences || req.user.contentPreferences || null,
      },
    });

    await prisma.emailGeneration.create({
      data: {
        userId: req.user.id,
        topic: payload.topic,
        objective: payload.objective,
        emailType: payload.emailType,
        tone: payload.tone,
        language: payload.language,
      },
    });

    res.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }

    res.status(500).json({ error: error.message || 'Failed to generate email' });
  }
}

export default {
  generateEmail,
};
