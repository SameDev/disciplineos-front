import { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { Pencil, Trash2, Repeat2, Check, Play } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { colors, fontSize, radius, spacing, difficultyColors, difficultyLabels } from '@/constants/theme';
import { getXPByDifficulty } from '@/lib/gamification';
import type { TaskWithCompletion, Difficulty } from '@/types/database';

interface TaskCardProps {
  task: TaskWithCompletion;
  onComplete: (task: TaskWithCompletion) => void;
  onEdit: (task: TaskWithCompletion) => void;
  onDelete: (task: TaskWithCompletion) => void;
  isCompleting: boolean;
}

const SWIPE_THRESHOLD = 60;
const ACTION_WIDTH = 130;

export function TaskCard({ task, onComplete, onEdit, onDelete, isCompleting }: TaskCardProps) {
  const [showXP, setShowXP] = useState(false);
  const xpOpacity = useSharedValue(0);
  const xpTranslateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);

  const diffColor = difficultyColors[task.difficulty] ?? colors.textMuted;
  const diffLabel = difficultyLabels[task.difficulty] ?? task.difficulty;
  const xpReward = getXPByDifficulty(task.difficulty as Difficulty);
  const isHabit = task.type === 'daily';

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      if (e.translationX < 0) {
        translateX.value = Math.max(e.translationX, -ACTION_WIDTH);
      } else {
        translateX.value = Math.min(e.translationX, ACTION_WIDTH);
      }
    })
    .onEnd(() => {
      if (translateX.value > -SWIPE_THRESHOLD && translateX.value < SWIPE_THRESHOLD) {
        translateX.value = withSpring(0);
      }
    });

  const closeSwipe = useCallback(() => {
    translateX.value = withSpring(0);
  }, [translateX]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { scale: scale.value }],
  }));

  const leftActionOpacity = useAnimatedStyle(() => ({
    opacity: translateX.value > 20 ? 1 : 0,
  }));

  const rightActionOpacity = useAnimatedStyle(() => ({
    opacity: translateX.value < -20 ? 1 : 0,
  }));

  const handleComplete = useCallback(() => {
    if (task.completed_today || isCompleting) return;
    closeSwipe();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    setShowXP(true);
    xpOpacity.value = withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(1, { duration: 600 }),
      withTiming(0, { duration: 400 }),
    );
    xpTranslateY.value = withSequence(
      withTiming(0, { duration: 0 }),
      withTiming(-40, { duration: 1200 }),
    );
    scale.value = withSequence(withSpring(0.95), withSpring(1));
    setTimeout(() => runOnJS(setShowXP)(false), 1400);

    onComplete(task);
  }, [task, isCompleting, onComplete, closeSwipe, xpOpacity, xpTranslateY, scale]);

  const handleEdit = useCallback(() => {
    closeSwipe();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onEdit(task);
  }, [task, onEdit, closeSwipe]);

  const handleDelete = useCallback(() => {
    closeSwipe();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Excluir tarefa',
      `"${task.title}" será removida permanentemente.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => onDelete(task),
        },
      ],
    );
  }, [task, onDelete, closeSwipe]);

  const xpAnimStyle = useAnimatedStyle(() => ({
    opacity: xpOpacity.value,
    transform: [{ translateY: xpTranslateY.value }],
  }));

  return (
    <View style={styles.wrapper}>
      {/* Left action (swipe right → edit) */}
      <Animated.View style={[styles.actionLeft, leftActionOpacity]}>
        <Pressable style={styles.editAction} onPress={handleEdit}>
          <Pencil size={22} color={colors.accent} />
          <Text style={styles.actionLabel}>Editar</Text>
        </Pressable>
      </Animated.View>

      {/* Right action (swipe left → delete) */}
      <Animated.View style={[styles.actionRight, rightActionOpacity]}>
        <Pressable style={styles.deleteAction} onPress={handleDelete}>
          <Trash2 size={22} color={colors.danger} />
          <Text style={styles.actionLabelDanger}>Excluir</Text>
        </Pressable>
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.card, cardStyle]}>
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.titleRow}>
                {isHabit && <Repeat2 size={14} color={colors.textMuted} />}
                <Text
                  style={[styles.title, task.completed_today && styles.titleDone]}
                  numberOfLines={2}
                >
                  {task.title}
                </Text>
              </View>
              <View style={[styles.diffBadge, { backgroundColor: diffColor + '20', borderColor: diffColor }]}>
                <Text style={[styles.diffText, { color: diffColor }]}>{diffLabel}</Text>
              </View>
            </View>
            <View style={styles.metaRow}>
              <Text style={[styles.xpLabel, task.completed_today && styles.xpDone]}>
                +{xpReward} XP
              </Text>
              {isHabit && (
                <Text style={styles.monthCount}>
                  {task.month_completions ?? 0} este mês
                </Text>
              )}
              {task.completed_today && (
                <Text style={styles.doneTag}>✓ feito hoje</Text>
              )}
            </View>
          </View>

          <Pressable
            style={[styles.completeBtn, task.completed_today && styles.completedBtn]}
            onPress={handleComplete}
            disabled={task.completed_today || isCompleting}
          >
            {task.completed_today
              ? <Check size={20} color={colors.success} />
              : <Play size={18} color="#FFF" />}
          </Pressable>

          {showXP && (
            <Animated.View style={[styles.xpPopup, xpAnimStyle]}>
              <Text style={styles.xpPopupText}>+{xpReward} XP</Text>
            </Animated.View>
          )}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  actionLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: ACTION_WIDTH,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: spacing.md,
  },
  actionRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: ACTION_WIDTH,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: spacing.md,
  },
  editAction: {
    alignItems: 'center',
    gap: 2,
  },
  deleteAction: {
    alignItems: 'center',
    gap: 2,
  },
  actionLabel: {
    color: colors.accent,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  actionLabelDanger: {
    color: colors.danger,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
    overflow: 'visible',
  },
  content: {
    flex: 1,
    gap: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
    flex: 1,
  },
  titleDone: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  diffBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  diffText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  xpLabel: {
    color: colors.accentGlow,
    fontSize: fontSize.xs,
    fontWeight: '500',
  },
  xpDone: {
    color: colors.textDim,
  },
  monthCount: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  doneTag: {
    color: colors.success,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  completeBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.md,
  },
  completedBtn: {
    backgroundColor: colors.success + '30',
    borderWidth: 1,
    borderColor: colors.success,
  },
  xpPopup: {
    position: 'absolute',
    right: spacing.md,
    top: -10,
    zIndex: 10,
  },
  xpPopupText: {
    color: colors.accentGlow,
    fontSize: fontSize.lg,
    fontWeight: '800',
  },
});
