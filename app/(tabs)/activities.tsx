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
import { Plus, Footprints, CheckCircle2 } from 'lucide-react-native';
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
const DAILY_GOAL = 10_000;
const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

function StepRing({ steps }: { steps: number }) {
  const pct = Math.min(steps / DAILY_GOAL, 1);
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
          <Text style={ring.stepsLabel}>passos</Text>
          <Text style={ring.pctText}>{Math.round(pct * 100)}% de {(DAILY_GOAL / 1000).toFixed(0)}k</Text>
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
          <Text style={ring.statValue}>{DAILY_GOAL.toLocaleString('pt-BR')}</Text>
          <Text style={ring.statLabel}>meta/dia</Text>
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
  stepsText: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
  },
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

function QuickAddModal({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState('');
  const [stepGoalText, setStepGoalText] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const createTask = useCreateTask();

  function reset() {
    setTitle('');
    setStepGoalText('');
    setDifficulty(null);
  }

  async function handleCreate() {
    if (!title.trim()) {
      Alert.alert('Dê um nome para a missão');
      return;
    }
    if (!difficulty) {
      Alert.alert('Selecione a dificuldade');
      return;
    }
    const stepGoal = stepGoalText ? parseInt(stepGoalText.replace(/\D/g, ''), 10) : undefined;
    try {
      await createTask.mutateAsync({
        title: title.trim(),
        type: 'daily',
        difficulty,
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
      <Pressable style={modal.overlay} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={modal.sheet}
      >
        <View style={modal.handle} />
        <Text style={modal.title}>Nova Missão de Passos</Text>

        <Text style={modal.label}>Nome</Text>
        <TextInput
          style={modal.input}
          placeholder="Ex: Caminhar 10 mil passos"
          placeholderTextColor={colors.textDim}
          value={title}
          onChangeText={setTitle}
          autoFocus
        />

        <Text style={modal.label}>👣 Meta de passos <Text style={modal.optional}>(opcional)</Text></Text>
        <TextInput
          style={modal.input}
          placeholder="Ex: 10000"
          placeholderTextColor={colors.textDim}
          value={stepGoalText}
          onChangeText={(t) => setStepGoalText(t.replace(/\D/g, ''))}
          keyboardType="number-pad"
          maxLength={6}
        />

        <Text style={modal.label}>Dificuldade</Text>
        <View style={modal.diffRow}>
          {DIFFICULTIES.map((d) => {
            const selected = difficulty === d;
            const c = difficultyColors[d];
            return (
              <Pressable
                key={d}
                style={[modal.diffChip, { borderColor: selected ? c : colors.border, backgroundColor: selected ? c + '20' : colors.bgInput }]}
                onPress={() => { setDifficulty(d); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              >
                <Text style={[modal.diffText, { color: selected ? c : colors.textMuted }]}>
                  {difficultyLabels[d]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={modal.actions}>
          <Pressable style={modal.cancelBtn} onPress={onClose}>
            <Text style={modal.cancelText}>Cancelar</Text>
          </Pressable>
          <Pressable
            style={[modal.createBtn, createTask.isPending && modal.createBtnDisabled]}
            onPress={handleCreate}
            disabled={createTask.isPending}
          >
            {createTask.isPending
              ? <ActivityIndicator size="small" color="#FFF" />
              : <Text style={modal.createText}>Criar</Text>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const modal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
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
    marginBottom: spacing.sm,
  },
  title: { color: colors.text, fontSize: fontSize.xl, fontWeight: '800', marginBottom: spacing.xs },
  label: { color: colors.text, fontSize: fontSize.sm, fontWeight: '600', marginTop: spacing.xs },
  optional: { color: colors.textDim, fontWeight: '400' },
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
  diffRow: { flexDirection: 'row', gap: spacing.sm, marginTop: 2 },
  diffChip: {
    flex: 1, paddingVertical: spacing.sm + 2,
    borderRadius: radius.md, borderWidth: 1.5,
    alignItems: 'center',
  },
  diffText: { fontSize: fontSize.sm, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  cancelBtn: {
    flex: 1, paddingVertical: spacing.md,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center',
  },
  cancelText: { color: colors.textMuted, fontWeight: '600' },
  createBtn: {
    flex: 2, paddingVertical: spacing.md,
    borderRadius: radius.md, backgroundColor: colors.accent,
    alignItems: 'center',
  },
  createBtnDisabled: { opacity: 0.6 },
  createText: { color: '#FFF', fontWeight: '700', fontSize: fontSize.md },
});

export default function ActivitiesScreen() {
  const { steps, isAvailable, isLoading } = usePedometer();
  const { data: tasks, refetch: refetchTasks } = useTasks();
  const { data: profile, refetch: refetchProfile } = useProfile();
  const completeTask = useCompleteTask();
  const deleteTask = useDeleteTask();
  const completingTaskId = useRef<string | null>(null);
  const profileRef = useRef(profile);
  profileRef.current = profile;

  const [showModal, setShowModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(1);

  const stepTasks = useMemo(() => {
    if (!tasks) return { pending: [], done: [] };
    const stepOnes = tasks.filter((t) => t.stepGoal != null);
    return {
      pending: stepOnes.filter((t) => !t.completed_today),
      done: stepOnes.filter((t) => t.completed_today),
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

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaView style={styles.container} edges={['top']}>

        {/* Header */}
        <Animated.View entering={FadeInDown.delay(0).springify().damping(18)} style={styles.header}>
          <View>
            <Text style={styles.title}>Atividades</Text>
            <Text style={styles.subtitle}>
              {isLoading
                ? 'Lendo sensor...'
                : !isAvailable
                ? 'Pedômetro indisponível neste dispositivo'
                : `${steps.toLocaleString('pt-BR')} passos hoje`}
            </Text>
          </View>
          <Pressable
            style={styles.addBtn}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowModal(true); }}
          >
            <Plus size={20} color="#FFF" />
          </Pressable>
        </Animated.View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Ring */}
          {isAvailable && (
            <Animated.View entering={FadeInDown.delay(60).springify().damping(18)}>
              <StepRing steps={steps} />
            </Animated.View>
          )}

          {!isAvailable && !isLoading && (
            <Animated.View entering={FadeInDown.delay(60)} style={styles.unavailableCard}>
              <Footprints size={32} color={colors.textDim} />
              <Text style={styles.unavailableTitle}>Pedômetro indisponível</Text>
              <Text style={styles.unavailableSub}>Este dispositivo não tem sensor de passos ou a permissão foi negada.</Text>
            </Animated.View>
          )}

          {/* Pending step tasks */}
          {stepTasks.pending.length > 0 && (
            <Animated.View entering={FadeInDown.delay(120).springify().damping(18)} style={styles.section}>
              <Text style={styles.sectionTitle}>Missões ativas</Text>
              <View style={styles.taskList}>
                {stepTasks.pending.map((task, i) => (
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
          {stepTasks.done.length > 0 && (
            <Animated.View entering={FadeInDown.delay(180).springify().damping(18)} style={styles.section}>
              <Text style={styles.sectionTitle}>Concluídas hoje</Text>
              <View style={styles.taskList}>
                {stepTasks.done.map((task, i) => (
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
          {stepTasks.pending.length === 0 && stepTasks.done.length === 0 && (
            <Animated.View entering={FadeInDown.delay(120)} style={styles.empty}>
              <CheckCircle2 size={48} color={colors.textDim} style={{ opacity: 0.4 }} />
              <Text style={styles.emptyTitle}>Nenhuma missão de passos</Text>
              <Text style={styles.emptySub}>Adicione uma missão com meta de passos para acompanhar aqui.</Text>
              <Pressable style={styles.emptyBtn} onPress={() => setShowModal(true)}>
                <Text style={styles.emptyBtnText}>Adicionar missão</Text>
              </Pressable>
            </Animated.View>
          )}
        </ScrollView>

        <QuickAddModal
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

const styles = StyleSheet.create({
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
  title: {
    color: colors.text,
    fontSize: fontSize['2xl'],
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  scroll: {
    padding: spacing.lg,
    gap: spacing.xl,
    paddingBottom: 110,
  },
  section: { gap: spacing.md },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  taskList: { gap: spacing.sm },
  unavailableCard: {
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
  },
  unavailableTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  unavailableSub: { color: colors.textMuted, fontSize: fontSize.sm, textAlign: 'center', lineHeight: 20 },
  empty: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  emptyTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  emptySub: { color: colors.textMuted, fontSize: fontSize.sm, textAlign: 'center', lineHeight: 20, maxWidth: 260 },
  emptyBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  emptyBtnText: { color: '#FFF', fontWeight: '700', fontSize: fontSize.sm },
});
