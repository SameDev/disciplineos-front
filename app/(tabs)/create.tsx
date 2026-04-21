import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Pencil, Repeat2, ClipboardList, CalendarDays } from 'lucide-react-native';
import { useCreateTask, useUpdateTask } from '@/hooks/use-tasks';
import { createTaskSchema, updateTaskSchema } from '@/types/database';
import type { Difficulty, TaskType } from '@/types/database';
import {
  colors,
  fontSize,
  radius,
  spacing,
  difficultyColors,
  difficultyLabels,
} from '@/constants/theme';

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

export default function CreateTaskScreen() {
  const params = useLocalSearchParams<{
    editId?: string;
    editTitle?: string;
    editType?: TaskType;
    editDifficulty?: Difficulty;
  }>();

  const isEditing = !!params.editId;

  const [title, setTitle] = useState(params.editTitle ?? '');
  const [difficulty, setDifficulty] = useState<Difficulty | null>(
    params.editDifficulty ?? null,
  );
  const [type, setType] = useState<TaskType>(params.editType ?? 'one_time');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const isPending = createTask.isPending || updateTask.isPending;

  async function handleSave() {
    setErrors({});

    if (isEditing) {
      const result = updateTaskSchema.safeParse({
        title: title.trim() || undefined,
        difficulty: difficulty ?? undefined,
        type,
      });
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.issues.forEach((i) => {
          fieldErrors[i.path[0] as string] = i.message;
        });
        setErrors(fieldErrors);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      try {
        await updateTask.mutateAsync({ id: params.editId!, data: result.data });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      } catch (err: unknown) {
        Alert.alert('Erro ao salvar', err instanceof Error ? err.message : String(err));
      }
      return;
    }

    const result = createTaskSchema.safeParse({
      title: title.trim(),
      difficulty,
      type,
    });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((i) => {
        fieldErrors[i.path[0] as string] = i.message;
      });
      setErrors(fieldErrors);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    try {
      await createTask.mutateAsync(result.data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: unknown) {
      Alert.alert('Erro ao criar tarefa', err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {isEditing
              ? type === 'daily' ? 'Editar Hábito' : 'Editar Tarefa'
              : type === 'daily' ? 'Novo Hábito' : 'Nova Tarefa'}
          </Text>
        </View>

        <View style={styles.form}>
          {/* Type Toggle */}
          <View style={styles.field}>
            <Text style={styles.label}>Tipo</Text>
            <View style={styles.typeRow}>
              <Pressable
                style={[
                  styles.typeOption,
                  type === 'one_time' && styles.typeOptionActive,
                ]}
                onPress={() => {
                  setType('one_time');
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <ClipboardList size={20} color={type === 'one_time' ? colors.accent : colors.textDim} />
                <Text style={[styles.typeText, type === 'one_time' && styles.typeTextActive]}>
                  Tarefa
                </Text>
                <Text style={styles.typeDesc}>Uma vez</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.typeOption,
                  type === 'daily' && styles.typeOptionActiveHabit,
                ]}
                onPress={() => {
                  setType('daily');
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Repeat2 size={20} color={type === 'daily' ? colors.streakFire : colors.textDim} />
                <Text style={[styles.typeText, type === 'daily' && styles.typeTextActiveHabit]}>
                  Hábito
                </Text>
                <Text style={styles.typeDesc}>Diário</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.typeOption,
                  type === 'weekly' && styles.typeOptionActiveWeekly,
                ]}
                onPress={() => {
                  setType('weekly');
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <CalendarDays size={20} color={type === 'weekly' ? colors.levelGold : colors.textDim} />
                <Text style={[styles.typeText, type === 'weekly' && styles.typeTextActiveWeekly]}>
                  Semanal
                </Text>
                <Text style={styles.typeDesc}>Por semana</Text>
              </Pressable>
            </View>
          </View>

          {/* Title */}
          <View style={styles.field}>
            <Text style={styles.label}>Título</Text>
            <TextInput
              style={[styles.input, errors.title ? styles.inputError : null]}
              placeholder={
                type === 'daily'
                  ? 'Ex: Meditar 10 minutos'
                  : type === 'weekly'
                  ? 'Ex: Revisar semana'
                  : 'Ex: Ler capítulo 5'
              }
              placeholderTextColor={colors.textDim}
              value={title}
              onChangeText={setTitle}
              autoFocus={!isEditing}
              maxLength={100}
            />
            {errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : null}
          </View>

          {/* Difficulty */}
          <View style={styles.field}>
            <Text style={styles.label}>Dificuldade</Text>
            <View style={styles.diffRow}>
              {DIFFICULTIES.map((d) => {
                const isSelected = difficulty === d;
                const color = difficultyColors[d];
                return (
                  <Pressable
                    key={d}
                    style={[
                      styles.diffOption,
                      {
                        borderColor: isSelected ? color : colors.border,
                        backgroundColor: isSelected ? color + '20' : colors.bgCard,
                      },
                    ]}
                    onPress={() => {
                      setDifficulty(d);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text style={[styles.diffOptionText, { color: isSelected ? color : colors.textMuted }]}>
                      {difficultyLabels[d]}
                    </Text>
                    <Text style={[styles.diffXP, { color: isSelected ? color : colors.textDim }]}>
                      +{d === 'easy' ? 10 : d === 'medium' ? 25 : 50} XP
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {errors.difficulty ? <Text style={styles.errorText}>{errors.difficulty}</Text> : null}
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.cancelBtn} onPress={() => router.back()}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
          <Pressable
            style={[styles.saveBtn, isPending && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={isPending}
          >
            {isPending ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.saveText}>{isEditing ? 'Salvar' : 'Criar'}</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  inner: { flex: 1, paddingHorizontal: spacing.lg },
  header: { paddingVertical: spacing.lg },
  headerTitle: {
    color: colors.text,
    fontSize: fontSize['2xl'],
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  form: { flex: 1, gap: spacing.xl },
  field: { gap: spacing.sm },
  label: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  typeRow: { flexDirection: 'row', gap: spacing.sm },
  typeOption: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    gap: 2,
  },
  typeOptionActive: { borderColor: colors.accent, backgroundColor: colors.accent + '15' },
  typeOptionActiveHabit: { borderColor: colors.streakFire, backgroundColor: colors.streakFire + '15' },
  typeOptionActiveWeekly: { borderColor: colors.levelGold, backgroundColor: colors.levelGold + '15' },
  typeText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textMuted },
  typeTextActive: { color: colors.accent },
  typeTextActiveHabit: { color: colors.streakFire },
  typeTextActiveWeekly: { color: colors.levelGold },
  typeDesc: { fontSize: fontSize.xs, color: colors.textDim },
  input: {
    backgroundColor: colors.bgInput,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputError: { borderColor: colors.danger },
  errorText: { color: colors.danger, fontSize: fontSize.xs },
  diffRow: { flexDirection: 'row', gap: spacing.sm },
  diffOption: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 2,
  },
  diffOptionText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  diffXP: { fontSize: fontSize.xs, fontWeight: '500' },
  actions: { flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.lg },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelText: { color: colors.textMuted, fontSize: fontSize.md, fontWeight: '600' },
  saveBtn: {
    flex: 2,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveText: { color: '#FFFFFF', fontSize: fontSize.md, fontWeight: '700' },
});
