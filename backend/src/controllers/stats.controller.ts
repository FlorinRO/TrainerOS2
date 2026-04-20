import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

export async function getDashboardStats(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userId = req.user.id;

    // Get current month date range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    // Parallel queries for performance
    const [
      totalIdeas,
      ideasThisMonth,
      ideasThisWeek,
      totalFeedbacks,
      feedbacksThisMonth,
      recentIdeas,
      recentFeedbacks,
      averageScores,
    ] = await Promise.all([
      // Total ideas generated
      prisma.idea.count({
        where: { userId },
      }),

      // Ideas this month
      prisma.idea.count({
        where: {
          userId,
          createdAt: { gte: startOfMonth },
        },
      }),

      // Ideas this week
      prisma.idea.count({
        where: {
          userId,
          createdAt: { gte: startOfWeek },
        },
      }),

      // Total feedbacks
      prisma.feedback.count({
        where: { userId },
      }),

      // Feedbacks this month
      prisma.feedback.count({
        where: {
          userId,
          createdAt: { gte: startOfMonth },
        },
      }),

      // Recent ideas (last 5)
      prisma.idea.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          format: true,
          hook: true,
          objective: true,
          conversionRate: true,
          createdAt: true,
          used: true,
        },
      }),

      // Recent feedbacks (last 5)
      prisma.feedback.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          fileName: true,
          overallScore: true,
          clarityScore: true,
          ctaScore: true,
          createdAt: true,
        },
      }),

      // Average feedback scores
      prisma.feedback.aggregate({
        where: { userId },
        _avg: {
          overallScore: true,
          clarityScore: true,
          relevanceScore: true,
          trustScore: true,
          ctaScore: true,
        },
      }),
    ]);

    // Calculate average conversion rate from ideas
    const ideasWithConversion = await prisma.idea.findMany({
      where: {
        userId,
        conversionRate: { not: null },
      },
      select: { conversionRate: true },
    });

    const avgConversionRate = ideasWithConversion.length > 0
      ? ideasWithConversion.reduce((sum, idea) => sum + (idea.conversionRate || 0), 0) / ideasWithConversion.length
      : 0;

    // Calculate streak (consecutive days with ideas generated)
    let streak = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);
    
    // Check if today has ideas
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const hasIdeasToday = await prisma.idea.count({
      where: {
        userId,
        createdAt: {
          gte: checkDate,
          lte: todayEnd,
        },
      },
    });

    // If no ideas today, start from yesterday
    if (hasIdeasToday === 0) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    // Count consecutive days going backwards
    for (let i = 0; i < 365; i++) {
      const dayStart = new Date(checkDate);
      const dayEnd = new Date(checkDate);
      dayEnd.setHours(23, 59, 59, 999);
      
      const ideasThisDay = await prisma.idea.count({
        where: {
          userId,
          createdAt: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
      });
      
      if (ideasThisDay > 0) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1); // Go back one day
      } else {
        break; // Streak broken
      }
    }

    res.json({
      stats: {
        totalIdeas,
        ideasThisMonth,
        ideasThisWeek,
        totalFeedbacks,
        feedbacksThisMonth,
        avgConversionRate: Math.round(avgConversionRate * 10) / 10,
        avgOverallScore: Math.round((averageScores._avg.overallScore || 0) * 10) / 10,
        avgClarityScore: Math.round((averageScores._avg.clarityScore || 0) * 10) / 10,
        avgRelevanceScore: Math.round((averageScores._avg.relevanceScore || 0) * 10) / 10,
        avgTrustScore: Math.round((averageScores._avg.trustScore || 0) * 10) / 10,
        avgCtaScore: Math.round((averageScores._avg.ctaScore || 0) * 10) / 10,
        streak,
      },
      recentActivity: {
        ideas: recentIdeas,
        feedbacks: recentFeedbacks,
      },
      profile: {
        niche: req.user.niche,
        icpProfile: req.user.icpProfile,
        positioningMessage: req.user.positioningMessage,
        hasIcpProfile: !!req.user.icpProfile,
        hasContentPreferences: !!(req.user.contentPreferences as any)?.brandVoice,
        hasContentCreationPreferences: !!(req.user.contentPreferences as any)?.contentCreation,
        plan: req.user.plan,
        trialEndsAt: req.user.trialEndsAt,
      },
    });
  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: error.message || 'Failed to get dashboard stats' });
  }
}

export default {
  getDashboardStats,
};
