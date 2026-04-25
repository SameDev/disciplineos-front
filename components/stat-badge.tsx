import { Pressable, Text, StyleSheet } from 'react-native';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import type { ReactNode } from 'react';

interface StatBadgeProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  color?: string;
  delay?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function StatBadge({
  icon,
  label,
  value,
  color = colors.text,
  delay = 0,
}: StatBadgeProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify().damping(14)}
      style={animatedStyle}
    >
      <AnimatedPressable
        style={[styles.container, { borderColor: color + '30' }]}
        onPressIn={() => { scale.value = withSpring(0.93, { damping: 15 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 12 }); }}
      >
        <Animated.View style={[styles.iconWrap, { backgroundColor: color + '18' }]}>
          {icon}
        </Animated.View>
        <Animated.View>
          <Text style={[styles.value, { color }]}>{value}</Text>
          <Text style={styles.label}>{label}</Text>
        </Animated.View>
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bgCard,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: fontSize.lg,
    fontWeight: '800',
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.textDim,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
