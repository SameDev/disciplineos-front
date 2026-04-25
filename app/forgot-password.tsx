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
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { api } from '@/lib/api';
import { colors, fontSize, radius, spacing } from '@/constants/theme';

type Step = 'email' | 'code';

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleRequestCode() {
    if (!email.trim()) {
      setError('Informe seu email');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setStep('code');
    } catch {
      setError('Erro ao enviar código. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    if (code.length !== 6) {
      setError('O código deve ter 6 dígitos');
      return;
    }
    if (newPassword.length < 6) {
      setError('Senha deve ter no mínimo 6 caracteres');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', {
        email: email.trim(),
        code,
        newPassword,
      });
      setSuccess('Senha redefinida! Faça login com a nova senha.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message.includes('inválido') ? 'Código inválido ou expirado' : message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Pronto!</Text>
          <Text style={styles.subtitle}>{success}</Text>
          <Pressable style={styles.button} onPress={() => router.replace('/login')}>
            <Text style={styles.buttonText}>Ir para o login</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={colors.textMuted} />
          <Text style={styles.backText}>Voltar</Text>
        </Pressable>

        {step === 'email' ? (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Esqueci minha senha</Text>
              <Text style={styles.subtitle}>
                Digite seu email e enviaremos um código de 6 dígitos.
              </Text>
            </View>

            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="seu@email.com"
                placeholderTextColor={colors.textDim}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Pressable
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleRequestCode}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.buttonText}>Enviar código</Text>
                )}
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Digite o código</Text>
              <Text style={styles.subtitle}>
                Enviamos um código de 6 dígitos para {email}.
              </Text>
            </View>

            <View style={styles.form}>
              <TextInput
                style={[styles.input, styles.codeInput]}
                placeholder="000000"
                placeholderTextColor={colors.textDim}
                value={code}
                onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
                editable={!loading}
              />
              <TextInput
                style={styles.input}
                placeholder="Nova senha (mín. 6 caracteres)"
                placeholderTextColor={colors.textDim}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoCapitalize="none"
                editable={!loading}
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Pressable
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleResetPassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.buttonText}>Redefinir senha</Text>
                )}
              </Pressable>

              <Pressable
                style={styles.resendBtn}
                onPress={() => {
                  setStep('email');
                  setCode('');
                  setError('');
                }}
              >
                <Text style={styles.resendText}>Não recebi o código</Text>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['2xl'],
    gap: spacing.xl,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  backText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  header: {
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: fontSize['2xl'],
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    lineHeight: 22,
  },
  form: {
    gap: spacing.md,
  },
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
  codeInput: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    letterSpacing: 8,
    textAlign: 'center',
  },
  error: {
    color: colors.danger,
    fontSize: fontSize.sm,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  resendBtn: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  resendText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
});
