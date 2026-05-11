import { useState } from 'react';
import { View, Text, StyleSheet, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Input } from '@/components/ui/Input';
import { ButtonPrimary } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/store';
import { colors, typography, spacing, fonts } from '@/constants/design';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export default function SetPasswordScreen() {
  const router = useRouter();
  const { pendingUserId, pendingEmail } = useAuthStore();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const next: typeof errors = {};
    if (password.length < 8) next.password = 'Mínimo 8 caracteres';
    if (password !== confirm) next.confirm = 'Las contraseñas no coinciden';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    if (!pendingUserId || !pendingEmail) {
      Alert.alert('Error', 'No se encontró el registro pendiente. Iniciá el proceso de registro nuevamente.');
      return;
    }

    setLoading(true);

    try {
      // Set password via backend (uses service role — no session needed)
      const response = await fetch(`${API_URL}/api/auth/register/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: pendingUserId, password }),
      });

      const json = await response.json();

      if (!response.ok || json.error) {
        const msg =
          response.status === 403
            ? 'Tu cuenta aún no fue aprobada. Esperá el email de confirmación.'
            : typeof json.error === 'string'
              ? json.error
              : 'No se pudo establecer la contraseña.';
        Alert.alert('Error', msg);
        return;
      }

      // Sign in automatically after setting password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: pendingEmail,
        password,
      });

      if (signInError) {
        Alert.alert('Contraseña establecida', 'Ya podés iniciar sesión con tu email y contraseña.');
        router.replace('/(auth)');
        return;
      }

      // Auth state listener in root layout will redirect to /(app)
    } catch {
      Alert.alert('Error', 'Ocurrió un error. Intentá nuevamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Establecer contraseña" />
      <View style={styles.content}>
        <Text style={styles.title}>Ya casi{'\n'}terminamos</Text>
        <View style={styles.form}>
          <Input
            label="CONTRASEÑA"
            placeholder="Ingresá tu contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            error={errors.password}
          />
          <Input
            label="REPETIR CONTRASEÑA"
            placeholder="Ingresá tu contraseña"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            error={errors.confirm}
          />
        </View>
      </View>
      <View style={styles.footer}>
        <ButtonPrimary label="Continuar" onPress={handleSubmit} loading={loading} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.backgroundApp,
    paddingTop: Platform.OS === 'ios' ? 56 : 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.textTertiary,
    fontFamily: fonts.regular,
  },
  form: {
    gap: spacing.lg,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : spacing.lg,
    paddingTop: spacing.md,
  },
});
