import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { usePomodoro, DEFAULT_SETTINGS, type PomodoroPhase, type PomodoroSettings } from '@/hooks/use-pomodoro';
import { useSpotify } from '@/hooks/use-spotify';
import { spotifyApi, type SpotifyPlaylist } from '@/lib/spotify';
import { RingTimer } from '@/components/ring-timer';
import { SpotifyMini } from '@/components/spotify-mini';
import { colors, fontSize, radius, spacing } from '@/constants/theme';

const PHASES: { key: PomodoroPhase; label: string }[] = [
  { key: 'focus', label: 'Foco' },
  { key: 'short_break', label: 'Pausa' },
  { key: 'long_break', label: 'Descanso' },
];

const PHASE_COLORS: Record<PomodoroPhase, string> = {
  focus: colors.accent,
  short_break: colors.streakFire,
  long_break: '#10B981',
};

export default function FocusScreen() {
  const [settings, setSettings] = useState<PomodoroSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [draftSettings, setDraftSettings] = useState(DEFAULT_SETTINGS);
  const [focusPlaylists, setFocusPlaylists] = useState<SpotifyPlaylist[]>([]);

  const pomodoro = usePomodoro(settings);
  const spotify = useSpotify();

  const phaseColor = PHASE_COLORS[pomodoro.phase];

  // Load focus playlists when Spotify connects
  useEffect(() => {
    if (!spotify.isConnected) return;
    spotifyApi
      .searchPlaylists('lofi focus study')
      .then((res) => setFocusPlaylists(res.playlists?.items ?? []))
      .catch(() => {});
  }, [spotify.isConnected]);

  // Auto-pause Spotify on focus start (optional: play on break)
  const handleStart = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    pomodoro.start();
  }, [pomodoro]);

  const handlePause = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    pomodoro.pause();
  }, [pomodoro]);

  const handleReset = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    pomodoro.reset();
  }, [pomodoro]);

  const handleSkip = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    pomodoro.skip();
  }, [pomodoro]);

  const handlePhaseSelect = useCallback((p: PomodoroPhase) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    pomodoro.selectPhase(p);
  }, [pomodoro]);

  function saveSettings() {
    const f = draftSettings.focusDuration;
    const s = draftSettings.shortBreakDuration;
    const l = draftSettings.longBreakDuration;
    if (f < 60 || s < 60 || l < 60) {
      Alert.alert('Tempo mínimo é 1 minuto');
      return;
    }
    setSettings(draftSettings);
    pomodoro.selectPhase('focus');
    setShowSettings(false);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>🎯 Modo Foco</Text>
            <Text style={styles.subtitle}>
              {pomodoro.totalFocusSessions > 0
                ? `${pomodoro.totalFocusSessions} sessão${pomodoro.totalFocusSessions > 1 ? 'ões' : ''} hoje`
                : 'Pronto para focar?'}
            </Text>
          </View>
          <Pressable style={styles.settingsBtn} onPress={() => {
            setDraftSettings(settings);
            setShowSettings(true);
          }}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </Pressable>
        </View>

        {/* Phase tabs */}
        <View style={styles.phaseTabs}>
          {PHASES.map((p) => (
            <Pressable
              key={p.key}
              style={[
                styles.phaseTab,
                pomodoro.phase === p.key && {
                  borderColor: PHASE_COLORS[p.key],
                  backgroundColor: PHASE_COLORS[p.key] + '20',
                },
              ]}
              onPress={() => handlePhaseSelect(p.key)}
            >
              <Text
                style={[
                  styles.phaseTabText,
                  pomodoro.phase === p.key && { color: PHASE_COLORS[p.key] },
                ]}
              >
                {p.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Ring timer */}
        <View style={styles.timerContainer}>
          <RingTimer
            progress={pomodoro.progress}
            timeDisplay={pomodoro.timeDisplay}
            phase={pomodoro.phase}
            phaseLabel={pomodoro.phaseLabel}
            phaseEmoji={pomodoro.phaseEmoji}
            round={pomodoro.round}
            roundsTotal={settings.roundsBeforeLongBreak}
          />
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <Pressable style={styles.secondaryBtn} onPress={handleReset}>
            <Text style={styles.secondaryBtnText}>↺ Reset</Text>
          </Pressable>

          <Pressable
            style={[styles.mainBtn, { backgroundColor: phaseColor }]}
            onPress={pomodoro.isRunning ? handlePause : handleStart}
          >
            <Text style={styles.mainBtnText}>
              {pomodoro.isRunning ? '⏸ Pausar' : '▶ Iniciar'}
            </Text>
          </Pressable>

          <Pressable style={styles.secondaryBtn} onPress={handleSkip}>
            <Text style={styles.secondaryBtnText}>⏭ Pular</Text>
          </Pressable>
        </View>

        {/* Focus tip based on phase */}
        <View style={[styles.tip, { borderColor: phaseColor + '40' }]}>
          <Text style={styles.tipText}>
            {pomodoro.phase === 'focus'
              ? '💡 Feche notificações. Uma tarefa por vez. Você consegue.'
              : pomodoro.phase === 'short_break'
              ? '☕ Levante, tome água, respire. Você merece essa pausa.'
              : '🌿 Pausa longa — saia da tela. Seu cérebro agradece.'}
          </Text>
        </View>

        {/* Spotify */}
        <SpotifyMini
          isConnected={spotify.isConnected}
          isReady={spotify.isReady}
          displayName={spotify.displayName}
          playback={spotify.playback}
          playlists={focusPlaylists}
          onConnect={spotify.connect}
          onDisconnect={spotify.disconnect}
          onPlay={spotify.play}
          onPause={spotify.pause}
          onNext={spotify.next}
          onPrev={spotify.prev}
        />
      </ScrollView>

      {/* Settings modal */}
      <Modal visible={showSettings} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>⚙️ Configurações</Text>

            <SettingField
              label="Foco (minutos)"
              value={draftSettings.focusDuration / 60}
              onChange={(v) => setDraftSettings((s) => ({ ...s, focusDuration: v * 60 }))}
            />
            <SettingField
              label="Pausa curta (minutos)"
              value={draftSettings.shortBreakDuration / 60}
              onChange={(v) => setDraftSettings((s) => ({ ...s, shortBreakDuration: v * 60 }))}
            />
            <SettingField
              label="Pausa longa (minutos)"
              value={draftSettings.longBreakDuration / 60}
              onChange={(v) => setDraftSettings((s) => ({ ...s, longBreakDuration: v * 60 }))}
            />
            <SettingField
              label="Rodadas antes da pausa longa"
              value={draftSettings.roundsBeforeLongBreak}
              onChange={(v) => setDraftSettings((s) => ({ ...s, roundsBeforeLongBreak: v }))}
            />

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancel}
                onPress={() => setShowSettings(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable style={styles.modalSave} onPress={saveSettings}>
                <Text style={styles.modalSaveText}>Salvar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SettingField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      <View style={styles.settingControl}>
        <Pressable
          style={styles.stepBtn}
          onPress={() => onChange(Math.max(1, value - 1))}
        >
          <Text style={styles.stepBtnText}>−</Text>
        </Pressable>
        <TextInput
          style={styles.settingInput}
          value={String(value)}
          onChangeText={(t) => {
            const n = parseInt(t);
            if (!isNaN(n) && n > 0) onChange(n);
          }}
          keyboardType="number-pad"
          selectTextOnFocus
        />
        <Pressable
          style={styles.stepBtn}
          onPress={() => onChange(value + 1)}
        >
          <Text style={styles.stepBtnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  scroll: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  settingsBtn: {
    padding: spacing.xs,
  },
  settingsIcon: { fontSize: 22 },
  phaseTabs: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  phaseTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  phaseTabText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  timerContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  mainBtn: {
    flex: 1,
    paddingVertical: spacing.md + 4,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  mainBtnText: {
    color: '#FFF',
    fontSize: fontSize.lg,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  secondaryBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  tip: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
  },
  tipText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    lineHeight: 20,
    textAlign: 'center',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000AA',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  modalTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '800',
    textAlign: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    color: colors.text,
    fontSize: fontSize.md,
    flex: 1,
  },
  settingControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  settingInput: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
    textAlign: 'center',
    minWidth: 40,
    borderBottomWidth: 1,
    borderColor: colors.accent,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  modalCancelText: { color: colors.textMuted, fontWeight: '600' },
  modalSave: {
    flex: 2,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
  },
  modalSaveText: { color: '#FFF', fontWeight: '700', fontSize: fontSize.md },
});
