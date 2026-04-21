import type { Difficulty } from '@/types/database';

const XP_MAP: Record<Difficulty, number> = {
  easy: 10,
  medium: 25,
  hard: 50,
};

/**
 * @returns XP reward for a given difficulty level
 */
export function getXPByDifficulty(difficulty: Difficulty): number {
  return XP_MAP[difficulty];
}

/**
 * @returns the level based on total accumulated XP.
 * Formula: each level costs `level * 100` XP.
 * Level 1: 0–99, Level 2: 100–299, Level 3: 300–599...
 */
export function calculateLevel(xp: number): number {
  let level = 1;
  let threshold = 0;

  while (threshold + level * 100 <= xp) {
    threshold += level * 100;
    level++;
  }

  return level;
}

/**
 * @returns the total XP needed to reach the given level from level 1.
 */
export function xpForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += i * 100;
  }
  return total;
}

/**
 * @returns XP required for the *current* level to the *next* level.
 */
export function xpToNextLevel(level: number): number {
  return level * 100;
}

/**
 * @returns XP progress within the current level (0 to xpToNextLevel).
 */
export function xpProgressInLevel(xp: number): number {
  const level = calculateLevel(xp);
  return xp - xpForLevel(level);
}

/**
 * @returns updated streak and whether it was reset.
 */
export function updateStreak(
  lastCompletionDate: string | null,
  currentStreak: number,
): { streak: number; wasReset: boolean } {
  if (!lastCompletionDate) {
    return { streak: 1, wasReset: false };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const last = new Date(lastCompletionDate);
  last.setHours(0, 0, 0, 0);

  const diffMs = today.getTime() - last.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { streak: currentStreak, wasReset: false };
  }

  if (diffDays === 1) {
    return { streak: currentStreak + 1, wasReset: false };
  }

  return { streak: 1, wasReset: true };
}
