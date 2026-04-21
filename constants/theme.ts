export const colors = {
  bgPrimary: '#0F0F1A',
  bgCard: '#1A1A2E',
  bgInput: '#16162B',

  accent: '#7C3AED',
  accentGlow: '#A78BFA',
  accentPink: '#EC4899',

  easy: '#10B981',
  medium: '#F59E0B',
  hard: '#EF4444',

  text: '#E2E8F0',
  textMuted: '#64748B',
  textDim: '#475569',

  streakFire: '#F97316',
  levelGold: '#FBBF24',

  border: '#2D2D48',
  success: '#10B981',
  danger: '#EF4444',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
} as const;

export const difficultyColors: Record<string, string> = {
  easy: colors.easy,
  medium: colors.medium,
  hard: colors.hard,
};

export const difficultyLabels: Record<string, string> = {
  easy: 'Fácil',
  medium: 'Médio',
  hard: 'Difícil',
};
