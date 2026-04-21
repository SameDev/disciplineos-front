import { View, Text, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';
import { colors, fontSize, radius, spacing } from '@/constants/theme';

interface XPBarProps {
  currentXP: number;
  maxXP: number;
  level: number;
}

/**
 * @description Animated XP progress bar with level indicator.
 */
export function XPBar({ currentXP, maxXP, level }: XPBarProps) {
  const progress = useSharedValue(0);
  const percentage = Math.min(currentXP / maxXP, 1);

  useEffect(() => {
    progress.value = withTiming(percentage, { duration: 800 });
  }, [percentage, progress]);

  const animatedWidth = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.levelText}>LVL {level}</Text>
        <Text style={styles.xpText}>
          {currentXP} / {maxXP} XP
        </Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, animatedWidth]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelText: {
    color: colors.levelGold,
    fontSize: fontSize.lg,
    fontWeight: '800',
    letterSpacing: 1,
  },
  xpText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  track: {
    height: 12,
    backgroundColor: colors.bgCard,
    borderRadius: radius.full,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  fill: {
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.accent,
  },
});
