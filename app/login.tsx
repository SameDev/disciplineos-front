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
import { Shield } from 'lucide-react-native';
import { useAuth } from '@/hooks/use-auth';
import { colors, fontSize, radius, spacing } from '@/constants/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signUp } = useAuth();

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) {
      setError('Preencha email e senha');
      return;
    }
    if (password.length < 6) {
      setError('Senha deve ter no mínimo 6 caracteres');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        await signUp(email.trim(), password);
      } else {
        await signIn(email.trim(), password);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('already in use')) {
        setError('Email já cadastrado. Faça login.');
        setIsSignUp(false);
      } else if (message.includes('Invalid credentials')) {
        setError('Email ou senha incorretos');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.hero}>
          <Shield size={64} color={colors.accent} />
          <Text style={styles.title}>DisciplineOS</Text>
          <Text style={styles.subtitle}>Gamifique suas tarefas diárias</Text>
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
          <TextInput
            style={styles.input}
            placeholder="Senha (mín. 6 caracteres)"
            placeholderTextColor={colors.textDim}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            editable={!loading}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>
                {isSignUp ? 'Criar Conta' : 'Entrar'}
              </Text>
            )}
          </Pressable>

          <Pressable
            style={styles.switchBtn}
            onPress={() => {
              setIsSignUp(!isSignUp);
              setError('');
            }}
          >
            <Text style={styles.switchText}>
              {isSignUp ? 'Já tem conta? Entrar' : 'Primeira vez? Criar conta'}
            </Text>
          </Pressable>

          {!isSignUp && (
            <Pressable
              style={styles.forgotBtn}
              onPress={() => router.push('/forgot-password')}
            >
              <Text style={styles.forgotText}>Esqueci minha senha</Text>
            </Pressable>
          )}
        </View>
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
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing['2xl'],
  },
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: fontSize['3xl'],
    fontWeight: '800',
    letterSpacing: -1,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.md,
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
  switchBtn: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  switchText: {
    color: colors.accent,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  forgotBtn: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  forgotText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
});
