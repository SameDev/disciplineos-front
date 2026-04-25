import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
  FadeInDown,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { Plus, Footprints, ChevronDown, ChevronUp } from 'lucide-react-native';
import { usePedometer } from '@/hooks/use-pedometer';
import { useTasks, useCompleteTask, useDeleteTask, useCreateTask } from '@/hooks/use-tasks';
import { useProfile } from '@/hooks/use-profile';
import { TaskCard } from '@/components/task-card';
import { ConfettiBlast } from '@/components/confetti-blast';
import { LevelUpToast } from '@/components/level-up-toast';
import { colors, fontSize, radius, spacing, difficultyColors, difficultyLabels } from '@/constants/theme';
import type { Difficulty, TaskWithCompletion, CompleteTaskResult } from '@/types/database';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const RING_SIZE = 220;
const RING_RADIUS = 90;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const DAILY_STEP_GOAL = 10_000;

const ACTIVITY_PRESETS = [
  { label: '🏋️ Musculação', title: 'Musculação' },
  { label: '🏃 Corrida', title: 'Corrida' },
  { label: '🧘 Yoga', title: 'Yoga' },
  { label: '🚴 Ciclismo', title: 'Ciclismo' },
  { label: '🏊 Natação', title: 'Natação' },
  { label: '⚽ Esporte', title: 'Esporte' },
];

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

// ─── Step Ring ────────────────────────────────────────────────────────────────

function StepRing({ steps }: { steps: number }) {
  const pct = Math.min(steps / DAILY_STEP_GOAL, 1);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(pct, { duration: 1200, easing: Easing.out(Easing.cubic) });
  }, [pct]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }));

  const distanceKm = (steps * 0.00075).toFixed(2);
  const calories = Math.round(steps * 0.04);

  return (
    <View style={ring.wrapper}>
      <View style={ring.ringContainer}>
        <Svg width={RING_SIZE} height={RING_SIZE}>
          <Circle
            cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS}
            stroke={colors.border} strokeWidth={16} fill="none"
          />
          <AnimatedCircle
            cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS}
            stroke={colors.accent} strokeWidth={16} fill="none"
            strokeDasharray={CIRCUMFERENCE}
            animatedProps={animatedProps}
            strokeLinecap="round"
            rotation={-90}
            origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
          />
        </Svg>
        <View style={ring.center}>
          <Text style={ring.stepsText}>{steps.toLocaleString('pt-BR')}</Text>
          <Text style={ring.stepsLabel}>passos hoje</Text>
          <Text style={ring.pctText}>{Math.round(pct * 100)}% de {(DAILY_STEP_GOAL / 1000).toFixed(0)}k</Text>
        </View>
      </View>
      <View style={ring.statsRow}>
        <View style={ring.stat}>
          <Text style={ring.statValue}>{distanceKm}</Text>
          <Text style={ring.statLabel}>km</Text>
        </View>
        <View style={ring.divider} />
        <View style={ring.stat}>
          <Text style={ring.statValue}>{calories}</Text>
          <Text style={ring.statLabel}>kcal</Text>
        </View>
        <View style={ring.divider} />
        <View style={ring.stat}>
          <Text style={ring.statValue}>{Math.round(pct * 100)}%</Text>
          <Text style={ring.statLabel}>meta passos</Text>
        </View>
      </View>
    </View>
  );
}

const ring = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: spacing.lg },
  ringContainer: { position: 'relative', width: RING_SIZE, height: RING_SIZE },
  center: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  stepsText: { color: colors.text, fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  stepsLabel: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600' },
  pctText: { color: colors.textDim, fontSize: fontSize.xs, marginTop: 2 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    gap: spacing.xl,
    alignSelf: 'center',
  },
  stat: { alignItems: 'center', gap: 2 },
  statValue: { color: colors.text, fontSize: fontSize.lg, fontWeight: '800' },
  statLabel: { color: colors.textDim, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  divider: { width: 1, height: 32, backgroundColor: colors.border },
});

// ─── Quick Add Modal ──────────────────────────────────────────────────────────

function AddActivityModal({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [stepGoalText, setStepGoalText] = useState('');
  const [showStepGoal, setShowStepGoal] = useState(false);
  const createTask = useCreateTask();

  function reset() {
    setTitle('');
    setDifficulty(null);
    setStepGoalText('');
    setShowStepGoal(false);
  }

  async function handleCreate() {
    if (!title.trim()) { Alert.alert('Dê um nome para a atividade'); return; }
    if (!difficulty) { Alert.alert('Selecione a dificuldade'); return; }
    const stepGoal = showStepGoal && stepGoalText
      ? parseInt(stepGoalText.replace(/\D/g, ''), 10)
      : undefined;
    try {
      await createTask.mutateAsync({
        title: title.trim(),
        type: 'daily',
        difficulty,
        isActivity: true,
        stepGoal: stepGoal && stepGoal > 0 ? stepGoal : undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      reset();
      onCreated();
    } catch (err: unknown) {
      Alert.alert('Erro', err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={m.overlay} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={m.sheet}>
        <View style={m.handle} />
        <Text style={m.title}>Nova Atividade</Text>

        {/* Presets */}
        <View style={m.presets}>
          {ACTIVITY_PRESETS.map((p) => (
            <Pressable
              key={p.title}
              style={[m.preset, title === p.title && m.presetActive]}
              onPress={() => {
                setTitle(p.title);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text style={[m.presetText, title === p.title && m.presetTextActive]}>
                {p.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Custom title */}
        <Text style={m.label}>Nome personalizado</Text>
        <TextInput
          style={m.input}
          placeholder="Ex: Musculação, Pilates, Caminhada..."
          placeholderTextColor={colors.textDim}
          value={title}
          onChangeText={setTitle}
        />

        {/* Difficulty */}
        <Text style={m.label}>Dificuldade</Text>
        <View style={m.diffRow}>
          {DIFFICULTIES.map((d) => {
            const selected = difficulty === d;
            const c = difficultyColors[d];
            return (
              <Pressable
                key={d}
                style={[m.diffChip, { borderColor: selected ? c : colors.border, backgroundColor: selected ? c + '20' : colors.bgInput }]}
                onPress={() => { setDifficulty(d); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              >
                <Text style={[m.diffText, { color: selected ? c : colors.textMuted }]}>
                  {difficultyLabels[d]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Step goal toggle */}
        <Pressable
          style={m.stepToggle}
          onPress={() => { setShowStepGoal(!showStepGoal); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
        >
          <Text style={m.stepToggleText}>👣 Adicionar meta de passos</Text>
          {showStepGoal
            ? <ChevronUp size={16} color={colors.textMuted} />
            : <ChevronDown size={16} color={colors.textMuted} />}
        </Pressable>

        {showStepGoal && (
          <TextInput
            style={m.input}
            placeholder="Ex: 10000"
            placeholderTextColor={colors.textDim}
            value={stepGoalText}
            onChangeText={(t) => setStepGoalText(t.replace(/\D/g, ''))}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
          />
        )}

        <View style={m.actions}>
          <Pressable style={m.cancelBtn} onPress={onClose}>
            <Text style={m.cancelText}>Cancelar</Text>
          </Pressable>
          <Pressable
            style={[m.createBtn, createTask.isPending && m.createBtnDisabled]}
            onPress={handleCreate}
            disabled={createTask.isPending}
          >
            {createTask.isPending
              ? <ActivityIndicator size="small" color="#FFF" />
              : <Text style={m.createText}>Criar</Text>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
    gap: spacing.sm,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.xs,
  },
  title: { color: colors.text, fontSize: fontSize.xl, fontWeight: '800', marginBottom: spacing.xs },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  preset: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgInput,
  },
  presetActive: { borderColor: colors.accent, backgroundColor: colors.accent + '20' },
  presetText: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600' },
  presetTextActive: { color: colors.accent },
  label: { color: colors.text, fontSize: fontSize.sm, fontWeight: '600', marginTop: spacing.xs },
  input: {
    backgroundColor: colors.bgInput,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: fontSize.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  diffRow: { flexDirection: 'row', gap: spacing.sm },
  diffChip: {
    flex: 1, paddingVertical: spacing.sm + 2,
    borderRadius: radius.md, borderWidth: 1.5,
    alignItems: 'center',
  },
  diffText: { fontSize: fontSize.sm, fontWeight: '700' },
  stepToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.xs,
  },
  stepToggleText: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  cancelBtn: {
    flex: 1, paddingVertical: spacing.md,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center',
  },
  cancelText: { color: colors.textMuted, fontWeight: '600' },
  createBtn: {
    flex: 2, paddingVertical: spacing.md,
    borderRadius: radius.md, backgroundColor: colors.accent, alignItems: 'center',
  },
  createBtnDisabled: { opacity: 0.6 },
  createText: { color: '#FFF', fontWeight: '700', fontSize: fontSize.md },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ActivitiesScreen() {
  const { steps, isAvailable, isLoading } = usePedometer();
  const { data: tasks, refetch: refetchTasks } = useTasks();
  const { data: profile } = useProfile();
  const completeTask = useCompleteTask();
  const deleteTask = useDeleteTask();
  const completingTaskId = useRef<string | null>(null);
  const profileRef = useRef(profile);
  profileRef.current = profile;

  const [showModal, setShowModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(1);

  // include legacy stepGoal tasks that pre-date isActivity flag
  const activityTasks = useMemo(() => {
    if (!tasks) return { pending: [], done: [] };
    const all = tasks.filter((t) => t.isActivity || t.stepGoal != null);
    return {
      pending: all.filter((t) => !t.completed_today),
      done: all.filter((t) => t.completed_today),
    };
  }, [tasks]);

  const handleComplete = useCallback((task: TaskWithCompletion) => {
    if (completingTaskId.current === task.id) return;
    completingTaskId.current = task.id;
    const prevLevel = profileRef.current?.level ?? 1;
    completeTask.mutate(task, {
      onSuccess: (result: CompleteTaskResult) => {
        setShowConfetti(true);
        if (result.user.level > prevLevel) {
          setNewLevel(result.user.level);
          setShowLevelUp(true);
        }
      },
      onSettled: () => { completingTaskId.current = null; },
    });
  }, [completeTask]);

  const handleDelete = useCallback((task: TaskWithCompletion) => {
    deleteTask.mutate(task.id);
  }, [deleteTask]);

  const handleEdit = useCallback(() => {}, []);

  const isEmpty = activityTasks.pending.length === 0 && activityTasks.done.length === 0;

  return (
    <GestureHandlerRootView style={s.flex}>
      <SafeAreaView style={s.container} edges={['top']}>

        <Animated.View entering={FadeInDown.delay(0).springify().damping(18)} style={s.header}>
          <View>
            <Text style={s.title}>Atividades</Text>
            <Text style={s.subtitle}>
              {isLoading
                ? 'Lendo sensor...'
                : !isAvailable
                ? 'Sensor de passos indisponível'
                : `${steps.toLocaleString('pt-BR')} passos hoje`}
            </Text>
          </View>
          <Pressable
            style={s.addBtn}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowModal(true); }}
          >
            <Plus size={20} color="#FFF" />
          </Pressable>
        </Animated.View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* Step ring — only when pedometer available */}
          {isAvailable && (
            <Animated.View entering={FadeInDown.delay(60).springify().damping(18)}>
              <StepRing steps={steps} />
            </Animated.View>
          )}

          {/* Pending activities */}
          {activityTasks.pending.length > 0 && (
            <Animated.View entering={FadeInDown.delay(120).springify().damping(18)} style={s.section}>
              <Text style={s.sectionTitle}>Hoje</Text>
              <View style={s.taskList}>
                {activityTasks.pending.map((task, i) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onComplete={handleComplete}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    isCompleting={completingTaskId.current === task.id}
                    currentSteps={steps}
                    index={i}
                  />
                ))}
              </View>
            </Animated.View>
          )}

          {/* Done today */}
          {activityTasks.done.length > 0 && (
            <Animated.View entering={FadeInDown.delay(160).springify().damping(18)} style={s.section}>
              <Text style={s.sectionTitle}>Concluídas</Text>
              <View style={s.taskList}>
                {activityTasks.done.map((task, i) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onComplete={handleComplete}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    isCompleting={false}
                    currentSteps={steps}
                    index={i}
                  />
                ))}
              </View>
            </Animated.View>
          )}

          {/* Empty */}
          {isEmpty && (
            <Animated.View entering={FadeInDown.delay(100)} style={s.empty}>
              <Footprints size={48} color={colors.textDim} style={{ opacity: 0.35 }} />
              <Text style={s.emptyTitle}>Nenhuma atividade</Text>
              <Text style={s.emptySub}>Adicione musculação, corrida, yoga ou qualquer atividade física.</Text>
              <Pressable style={s.emptyBtn} onPress={() => setShowModal(true)}>
                <Text style={s.emptyBtnText}>Adicionar atividade</Text>
              </Pressable>
            </Animated.View>
          )}
        </ScrollView>

        <AddActivityModal
          visible={showModal}
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); refetchTasks(); }}
        />
      </SafeAreaView>

      {showConfetti && <ConfettiBlast onFinish={() => setShowConfetti(false)} />}
      {showLevelUp && <LevelUpToast level={newLevel} onFinish={() => setShowLevelUp(false)} />}
    </GestureHandlerRootView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: { color: colors.text, fontSize: fontSize['2xl'], fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 2 },
  addBtn: {
    width: 42, height: 42, borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
  },
  scroll: { padding: spacing.lg, gap: spacing.xl, paddingBottom: 110 },
  section: { gap: spacing.md },
  sectionTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '800', letterSpacing: -0.3 },
  taskList: { gap: spacing.sm },
  empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  emptyTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  emptySub: { color: colors.textMuted, fontSize: fontSize.sm, textAlign: 'center', lineHeight: 20, maxWidth: 260 },
  emptyBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
  },
  emptyBtnText: { color: '#FFF', fontWeight: '700', fontSize: fontSize.sm },
});
