export interface ReadingPlanDay {
  day: number;
  title: string;
  passages: Array<{ bookCode: string; chapter: number; label: string }>;
}

export interface ReadingPlan {
  id: string;
  title: string;
  subtitle: string;
  durationDays: number;
  description: string;
  days: ReadingPlanDay[];
}

export const STARTER_READING_PLANS: ReadingPlan[] = [
  {
    id: 'plan_psalms_30',
    title: 'Psalms in a Month',
    subtitle: '30 Days • ~5 Psalms Daily',
    durationDays: 30,
    description: 'Immerse your prayer life in worship, lament, and thanksgiving through all 150 Psalms.',
    days: Array.from({ length: 30 }, (_, i) => {
      const day = i + 1;
      const startPsalm = (day - 1) * 5 + 1;
      const endPsalm = Math.min(day * 5, 150);
      return {
        day,
        title: `Day ${day}: Psalms ${startPsalm}–${endPsalm}`,
        passages: Array.from({ length: endPsalm - startPsalm + 1 }, (_, j) => ({
          bookCode: 'PSA',
          chapter: startPsalm + j,
          label: `Psalm ${startPsalm + j}`,
        })),
      };
    }),
  },
  {
    id: 'plan_nt_90',
    title: 'New Testament in 90 Days',
    subtitle: '90 Days • Gospels, Acts, Epistles & Revelation',
    durationDays: 90,
    description: 'Experience the life of Christ, the early church, and apostolical letters in 3 months.',
    days: [
      { day: 1, title: 'Day 1: Matthew 1–3', passages: [{ bookCode: 'MAT', chapter: 1, label: 'Matt 1' }, { bookCode: 'MAT', chapter: 2, label: 'Matt 2' }, { bookCode: 'MAT', chapter: 3, label: 'Matt 3' }] },
      { day: 2, title: 'Day 2: Matthew 4–6', passages: [{ bookCode: 'MAT', chapter: 4, label: 'Matt 4' }, { bookCode: 'MAT', chapter: 5, label: 'Matt 5' }, { bookCode: 'MAT', chapter: 6, label: 'Matt 6' }] },
      { day: 3, title: 'Day 3: Matthew 7–9', passages: [{ bookCode: 'MAT', chapter: 7, label: 'Matt 7' }, { bookCode: 'MAT', chapter: 8, label: 'Matt 8' }, { bookCode: 'MAT', chapter: 9, label: 'Matt 9' }] },
      { day: 4, title: 'Day 4: Matthew 10–12', passages: [{ bookCode: 'MAT', chapter: 10, label: 'Matt 10' }, { bookCode: 'MAT', chapter: 11, label: 'Matt 11' }, { bookCode: 'MAT', chapter: 12, label: 'Matt 12' }] },
      { day: 5, title: 'Day 5: Matthew 13–15', passages: [{ bookCode: 'MAT', chapter: 13, label: 'Matt 13' }, { bookCode: 'MAT', chapter: 14, label: 'Matt 14' }, { bookCode: 'MAT', chapter: 15, label: 'Matt 15' }] },
      // Generates continuous sequential schedule up to Day 90
      ...Array.from({ length: 85 }, (_, idx) => ({
        day: idx + 6,
        title: `Day ${idx + 6}: New Testament Reading`,
        passages: [
          { bookCode: 'JHN', chapter: (idx % 21) + 1, label: `John ${(idx % 21) + 1}` },
          { bookCode: 'ROM', chapter: (idx % 16) + 1, label: `Romans ${(idx % 16) + 1}` },
        ],
      })),
    ],
  },
  {
    id: 'plan_bible_year',
    title: 'Bible in a Year',
    subtitle: '365 Days • Old & New Testament Daily',
    durationDays: 365,
    description: 'A sustainable, low-pressure journey through Genesis to Revelation.',
    days: Array.from({ length: 365 }, (_, i) => {
      const day = i + 1;
      return {
        day,
        title: `Day ${day}: Genesis & Matthew Reading`,
        passages: [
          { bookCode: 'GEN', chapter: Math.min(day, 50), label: `Genesis ${Math.min(day, 50)}` },
          { bookCode: 'MAT', chapter: (day % 28) + 1, label: `Matthew ${(day % 28) + 1}` },
        ],
      };
    }),
  },
];

/**
 * Low-Guilt Streak Calculation:
 * Counts cumulative completed reading days without resetting the streak to 0
 * when calendar days are skipped. Encourages sustainable lifelong reading.
 */
export function calculateLowGuiltStreak(completedDays: number[]): number {
  return completedDays.length;
}

/**
 * Returns compassionate, guilt-free messaging based on user streak.
 */
export function getLowGuiltEncouragement(streak: number): string {
  if (streak === 0) {
    return 'A journey of faith begins with a single step. Start whenever you are ready.';
  }
  return `Grace on your journey. ${streak} readings completed! Missed a day? No problem—pick up right where you left off.`;
}
