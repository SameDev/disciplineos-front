import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { colors, fontSize, radius, spacing } from '@/constants/theme';

interface XPBarProps {
  currentXP: number;
  maxXP: number;
  level: number;
}

export function XPBar({ currentXP, maxXP, level }: XPBarProps) {
  const progress = useSharedValue(0);
  const shimmerX = useSharedValue(-120);
  const percentage = Math.min(currentXP / maxXP, 1);

  useEffect(() => {
    progress.value = withTiming(percentage, { duration: 900, easing: Easing.out(Easing.exp) });
  }, [percentage, progress]);

  useEffect(() => {
    shimmerX.value = withRepeat(
      withTiming(260, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
  }, [shimmerX]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>LVL {level}</Text>
        </View>
        <Text style={styles.xpText}>
          {currentXP} / {maxXP} XP
        </Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, fillStyle]}>
          <Animated.View style={[styles.shimmer, shimmerStyle]} />
        </Animated.View>
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
  levelBadge: {
    backgroundColor: colors.levelGold + '20',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.levelGold + '40',
  },
  levelText: {
    color: colors.levelGold,
    fontSize: fontSize.sm,
    fontWeight: '800',
    letterSpacing: 1,
  },
  xpText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '500',
  },
  track: {
    height: 10,
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
    overflow: 'hidden',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 60,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: radius.full,
    transform: [{ skewX: '-20deg' }],
  },
});
