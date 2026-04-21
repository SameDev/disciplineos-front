import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Pencil, Trophy, Flame, Zap, LogOut } from 'lucide-react-native';
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import { useProfile } from '@/hooks/use-profile';
import { useUpdateProfile } from '@/hooks/use-update-profile';
import { useAuth } from '@/hooks/use-auth';

function LevelBar({ xp, level }: { xp: number; level: number }) {
  const needed = level * 100;
  const accumulated = (level * (level - 1)) / 2 * 100;
  const current = xp - accumulated;
  const pct = Math.min(current / needed, 1);
  return (
    <View style={bar.wrap}>
      <View style={bar.track}>
        <View style={[bar.fill, { width: `${pct * 100}%` as `${number}%` }]} />
      </View>
      <Text style={bar.label}>{current} / {needed} XP</Text>
    </View>
  );
}

const bar = StyleSheet.create({
  wrap: { gap: 4 },
  track: {
    height: 6,
    backgroundColor: colors.bgInput,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: 6,
    backgroundColor: colors.accent,
    borderRadius: 3,
  },
  label: { color: colors.textDim, fontSize: fontSize.xs, textAlign: 'right' },
});

export default function ProfileScreen() {
  const { data: profile, isLoading } = useProfile();
  const { mutateAsync: updateProfile, isPending } = useUpdateProfile();
  const { signOut } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  if (isLoading || !profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const displayName = name || profile.name || profile.email.split('@')[0];
  const avatarSource = avatarUri ?? profile.avatarUrl;

  async function pickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos acessar sua galeria para trocar a foto.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const dataUri = `data:image/jpeg;base64,${asset.base64}`;
      setAvatarUri(dataUri);
    }
  }

  async function handleSaveProfile() {
    const payload: Parameters<typeof updateProfile>[0] = {};
    if (name.trim()) payload.name = name.trim();
    if (email.trim() && email !== profile.email) payload.email = email.trim();
    if (avatarUri) payload.avatarUrl = avatarUri;
    if (!Object.keys(payload).length) {
      Alert.alert('Nenhuma alteração', 'Modifique algum campo antes de salvar.');
      return;
    }
    try {
      await updateProfile(payload);
      Alert.alert('Salvo!', 'Perfil atualizado com sucesso.');
      setName('');
      setEmail('');
      setAvatarUri(null);
    } catch (e: unknown) {
      Alert.alert('Erro', (e as Error).message);
    }
  }

  async function handleChangePassword() {
    if (!currentPassword || !newPassword) {
      Alert.alert('Preencha todos os campos de senha.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('As senhas novas não conferem.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Nova senha precisa ter ao menos 6 caracteres.');
      return;
    }
    try {
      await updateProfile({ currentPassword, newPassword });
      Alert.alert('Senha alterada!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: unknown) {
      Alert.alert('Erro', (e as Error).message);
    }
  }

  function handleLogout() {
    Alert.alert('Sair', 'Deseja realmente sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: signOut },
    ]);
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Perfil</Text>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <Pressable onPress={pickAvatar} style={styles.avatarWrap}>
            {avatarSource ? (
              <Image source={{ uri: avatarSource }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {displayName[0]?.toUpperCase() ?? '?'}
                </Text>
              </View>
            )}
            <View style={styles.avatarBadge}>
              <Pencil size={12} color={colors.textMuted} />
            </View>
          </Pressable>
          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.displayEmail}>{profile.email}</Text>
        </View>

        {/* Stats */}
        <View style={styles.card}>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Trophy size={18} color={colors.levelGold} />
              <Text style={[styles.statValue, { color: colors.levelGold }]}>Nv. {profile.level}</Text>
              <Text style={styles.statLabel}>Level</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Zap size={18} color={colors.accentGlow} />
              <Text style={[styles.statValue, { color: colors.accentGlow }]}>{profile.xp}</Text>
              <Text style={styles.statLabel}>XP Total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Flame size={18} color={colors.streakFire} />
              <Text style={[styles.statValue, { color: colors.streakFire }]}>{profile.streak}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
          </View>
          <LevelBar xp={profile.xp} level={profile.level} />
        </View>

        {/* Edit profile */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Informações</Text>

          <Text style={styles.label}>Nome</Text>
          <TextInput
            style={styles.input}
            placeholder={profile.name ?? 'Seu nome'}
            placeholderTextColor={colors.textDim}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder={profile.email}
            placeholderTextColor={colors.textDim}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Pressable
            style={[styles.btn, isPending && styles.btnDisabled]}
            onPress={handleSaveProfile}
            disabled={isPending}
          >
            {isPending ? (
              <ActivityIndicator size="small" color={colors.bgPrimary} />
            ) : (
              <Text style={styles.btnText}>Salvar alterações</Text>
            )}
          </Pressable>
        </View>

        {/* Change password */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Alterar senha</Text>

          <Text style={styles.label}>Senha atual</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={colors.textDim}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
          />

          <Text style={styles.label}>Nova senha</Text>
          <TextInput
            style={styles.input}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor={colors.textDim}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />

          <Text style={styles.label}>Confirmar nova senha</Text>
          <TextInput
            style={styles.input}
            placeholder="Repita a nova senha"
            placeholderTextColor={colors.textDim}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <Pressable
            style={[styles.btn, styles.btnSecondary, isPending && styles.btnDisabled]}
            onPress={handleChangePassword}
            disabled={isPending}
          >
            <Text style={[styles.btnText, styles.btnSecondaryText]}>Alterar senha</Text>
          </Pressable>
        </View>

        {/* Danger zone */}
        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={16} color="#ef4444" />
          <Text style={styles.logoutText}>Sair da conta</Text>
        </Pressable>

        <Text style={styles.footer}>
          Membro desde {new Date(profile.createdAt).toLocaleDateString('pt-BR')}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPrimary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgPrimary },
  scroll: { padding: spacing.lg, paddingTop: 56, gap: spacing.md, paddingBottom: 40 },
  title: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700', marginBottom: spacing.sm },

  avatarSection: { alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
  avatarWrap: { position: 'relative' },
  avatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 2, borderColor: colors.accent },
  avatarPlaceholder: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: colors.bgCard,
    borderWidth: 2, borderColor: colors.accent,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: { color: colors.accent, fontSize: 36, fontWeight: '700' },
  avatarBadge: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: colors.bgCard,
    borderRadius: 12, width: 24, height: 24,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  displayName: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  displayEmail: { color: colors.textMuted, fontSize: fontSize.sm },

  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '700', marginBottom: 4 },

  statsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  stat: { alignItems: 'center', gap: 2 },
  statValue: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  statLabel: { color: colors.textDim, fontSize: fontSize.xs },
  statDivider: { width: 1, height: 32, backgroundColor: colors.border },

  label: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '600', marginTop: 4 },
  input: {
    backgroundColor: colors.bgInput,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: fontSize.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },

  btn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: colors.bgPrimary, fontWeight: '700', fontSize: fontSize.sm },
  btnSecondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
  btnSecondaryText: { color: colors.text },

  logoutBtn: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  logoutText: { color: '#ef4444', fontWeight: '700', fontSize: fontSize.sm },

  footer: { color: colors.textDim, fontSize: fontSize.xs, textAlign: 'center' },
});
