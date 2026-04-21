import { View, Text, StyleSheet } from 'react-native';
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import type { ReactNode } from 'react';

interface StatBadgeProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  color?: string;
}

export function StatBadge({ icon, label, value, color = colors.text }: StatBadgeProps) {
  return (
    <View style={styles.container}>
      {icon}
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
