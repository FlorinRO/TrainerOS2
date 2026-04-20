import type { Plan } from '@prisma/client';

type MaybeUnlimited = number | null;

export type PlanLimits = {
  ideaSetsPerMonth: number;
  structuredIdeasPerMonth: number;
  emailsPerMonth: number;
  nutritionPerMonth: number;
  chatQuestionsPerMonth: number;
  contentReviewsPerMonth: MaybeUnlimited;
};

const PRO_LIMITS: PlanLimits = {
  ideaSetsPerMonth: 100,
  structuredIdeasPerMonth: 90,
  emailsPerMonth: 60,
  nutritionPerMonth: 10,
  chatQuestionsPerMonth: 300,
  contentReviewsPerMonth: 60,
};

const MAX_LIMITS: PlanLimits = {
  ideaSetsPerMonth: 400,
  structuredIdeasPerMonth: 450,
  emailsPerMonth: 150,
  nutritionPerMonth: 30,
  chatQuestionsPerMonth: 900,
  contentReviewsPerMonth: null,
};

const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  FREE_TRIAL: PRO_LIMITS,
  STARTER: PRO_LIMITS,
  PRO: PRO_LIMITS,
  ELITE: MAX_LIMITS,
  MAX: MAX_LIMITS,
};

export function getPlanLimits(plan: Plan): PlanLimits {
  return PLAN_LIMITS[plan] ?? PRO_LIMITS;
}
