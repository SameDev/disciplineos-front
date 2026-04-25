import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { colors, fontSize } from '@/constants/theme';
import type { PomodoroPhase } from '@/hooks/use-pomodoro';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SIZE = 260;
const STROKE = 14;
const GLOW_STROKE = 28;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const PHASE_COLORS: Record<PomodoroPhase, string> = {
  focus: colors.accent,
  short_break: colors.streakFire,
  long_break: '#10B981',
};

interface RingTimerProps {
  progress: number;
  timeDisplay: string;
  phase: PomodoroPhase;
  phaseLabel: string;
  phaseEmoji: string;
  round: number;
  roundsTotal: number;
  isRunning?: boolean;
}

export function RingTimer({
  progress,
  timeDisplay,
  phase,
  phaseLabel,
  phaseEmoji,
  round,
  roundsTotal,
  isRunning = false,
}: RingTimerProps) {
  const animatedProgress = useSharedValue(progress);
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.15);
  const color = PHASE_COLORS[phase];

  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: 600,
      easing: Easing.out(Easing.quad),
    });
  }, [progress, animatedProgress]);

  useEffect(() => {
    if (isRunning) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.015, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 1200 }),
          withTiming(0.12, { duration: 1200 }),
        ),
        -1,
        false,
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 300 });
      glowOpacity.value = withTiming(0.12, { duration: 300 });
    }
  }, [isRunning, pulseScale, glowOpacity]);

  const animatedProgressProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - animatedProgress.value),
  }));

  const glowProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - animatedProgress.value),
    strokeOpacity: glowOpacity.value,
  }));

  const timeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <View style={styles.container}>
      <Svg width={SIZE} height={SIZE} style={styles.svg}>
        {/* Track */}
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={colors.bgCard}
          strokeWidth={STROKE}
          fill="none"
        />
        {/* Glow arc */}
        <AnimatedCircle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={color}
          strokeWidth={GLOW_STROKE}
          fill="none"
          strokeDasharray={CIRCUMFERENCE}
          animatedProps={glowProps}
          strokeLinecap="round"
          rotation="-90"
          origin={`${SIZE / 2}, ${SIZE / 2}`}
        />
        {/* Progress arc */}
        <AnimatedCircle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={color}
          strokeWidth={STROKE}
          fill="none"
          strokeDasharray={CIRCUMFERENCE}
          animatedProps={animatedProgressProps}
          strokeLinecap="round"
          rotation="-90"
          origin={`${SIZE / 2}, ${SIZE / 2}`}
        />
      </Svg>

      <View style={styles.inner}>
        <Text style={styles.emoji}>{phaseEmoji}</Text>
        <Animated.Text style={[styles.time, { color }, timeStyle]}>
          {timeDisplay}
        </Animated.Text>
        <Text style={[styles.phaseLabel, { color: color + 'CC' }]}>{phaseLabel}</Text>
        <View style={styles.roundsRow}>
          {Array.from({ length: roundsTotal }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.roundDot,
                i < round
                  ? { backgroundColor: color, shadowColor: color, shadowOpacity: 0.8, shadowRadius: 4, elevation: 3 }
                  : { backgroundColor: colors.border },
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: SIZE,
    height: SIZE,
  },
  svg: {
    position: 'absolute',
  },
  inner: {
    alignItems: 'center',
    gap: 4,
  },
  emoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  time: {
    fontSize: 52,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: -2,
  },
  phaseLabel: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  roundsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  roundDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
});
