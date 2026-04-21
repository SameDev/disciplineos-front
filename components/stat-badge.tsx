import { View, Text, StyleSheet } from 'react-native';
import { colors, fontSize, radius, spacing } from '@/constants/theme';

interface StatBadgeProps {
  icon: string;
  label: string;
  value: string | number;
  color?: string;
}

/**
 * @description Compact stat badge with emoji icon (Level, Streak, etc).
 */
export function StatBadge({ icon, label, value, color = colors.text }: StatBadgeProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <View>
        <Text style={[styles.value, { color }]}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bgCard,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: {
    fontSize: fontSize.xl,
  },
  value: {
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
