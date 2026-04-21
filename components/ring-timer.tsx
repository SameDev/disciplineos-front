import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, fontSize } from '@/constants/theme';
import type { PomodoroPhase } from '@/hooks/use-pomodoro';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SIZE = 260;
const STROKE = 14;
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
}

export function RingTimer({
  progress,
  timeDisplay,
  phase,
  phaseLabel,
  phaseEmoji,
  round,
  roundsTotal,
}: RingTimerProps) {
  const animatedProgress = useSharedValue(progress);
  const color = PHASE_COLORS[phase];

  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: 600,
      easing: Easing.out(Easing.quad),
    });
  }, [progress, animatedProgress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - animatedProgress.value),
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
        {/* Progress arc */}
        <AnimatedCircle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={color}
          strokeWidth={STROKE}
          fill="none"
          strokeDasharray={CIRCUMFERENCE}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation="-90"
          origin={`${SIZE / 2}, ${SIZE / 2}`}
        />
      </Svg>

      <View style={styles.inner}>
        <Text style={styles.emoji}>{phaseEmoji}</Text>
        <Text style={[styles.time, { color }]}>{timeDisplay}</Text>
        <Text style={styles.phaseLabel}>{phaseLabel}</Text>
        <View style={styles.roundsRow}>
          {Array.from({ length: roundsTotal }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.roundDot,
                { backgroundColor: i < round ? color : colors.border },
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
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  roundsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  roundDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
