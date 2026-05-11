import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ButtonPrimary, ButtonOutline } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/store';
import { colors, typography, spacing } from '@/constants/design';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

type Step = 'email' | 'password';

export default function WelcomeScreen() {
  const router = useRouter();
  const setPendingRegistration = useAuthStore((s) => s.setPendingRegistration);

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const passwordOpacity = useRef(new Animated.Value(0)).current;

  function showPasswordField() {
    setStep('password');
    Animated.timing(passwordOpacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }

  async function handleContinue() {
    const trimmed = email.trim();
    if (!trimmed || !/\S+@\S+\.\S+/.test(trimmed)) {
      setEmailError('Ingresá un correo válido');
      return;
    }
    setEmailError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });
      const json = await res.json();

      console.log('[check-email] status:', res.status, 'body:', JSON.stringify(json));
      if (!res.ok || json.error) {
        Alert.alert(`Error ${res.status}`, JSON.stringify(json));
        return;
      }

      const { status, userId } = json.data;

      if (status === 'not_found') {
        router.push({
          pathname: '/(auth)/register/personal-data',
          params: { email: trimmed },
        });
        return;
      }

      if (status === 'pending') {
        Alert.alert(
          'Solicitud en revisión',
          'Tu registro está siendo evaluado. Te avisaremos por email cuando sea aprobado.'
        );
        return;
      }

      if (status === 'needs_password') {
        setPendingRegistration(userId, trimmed);
        router.push('/(auth)/set-password');
        return;
      }

      // status === 'ready' → show password field
      showPasswordField();
    } catch {
      Alert.alert('Error', 'No se pudo conectar al servidor. Verificá tu conexión.');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    if (!password.trim()) {
      setPasswordError('Ingresá tu contraseña');
      return;
    }
    setPasswordError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      setPasswordError('Contraseña incorrecta');
    }
  }

  return (
    <LinearGradient
      colors={colors.gradientAuthColors}
      locations={colors.gradientAuthLocations}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoText}>A</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>
            Bienvenido a tus{'\n'}
            <Text style={styles.titleSecondary}>subastas favoritas</Text>
          </Text>

          {/* Form */}
          <View style={styles.form}>
            <Input
              variant="auth"
              placeholder="Correo Electrónico"
              value={email}
              onChangeText={(v) => { setEmail(v); setEmailError(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={emailError}
              editable={step === 'email'}
            />

            {step === 'password' && (
              <Animated.View style={{ opacity: passwordOpacity }}>
                <Input
                  variant="auth"
                  placeholder="Contraseña"
                  value={password}
                  onChangeText={(v) => { setPassword(v); setPasswordError(''); }}
                  secureTextEntry
                  autoFocus
                  error={passwordError}
                />
                <TouchableOpacity
                  onPress={() => router.push('/(auth)/forgot-password')}
                  style={styles.forgotLink}
                >
                  <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            <ButtonPrimary
              label={step === 'email' ? 'Continuar' : 'Ingresar'}
              onPress={step === 'email' ? handleContinue : handleLogin}
              loading={loading}
            />

            {step === 'email' && (
              <>
                <TouchableOpacity onPress={() => router.push('/(app)')} style={styles.guestLink}>
                  <Text style={styles.guestText}>Continuar como invitado</Text>
                </TouchableOpacity>

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                <ButtonOutline
                  label="Registrarme"
                  onPress={() => router.push('/(auth)/register/personal-data')}
                  style={styles.outlineOnDark}
                />
              </>
            )}

            {step === 'password' && (
              <TouchableOpacity onPress={() => { setStep('email'); setPassword(''); }} style={styles.guestLink}>
                <Text style={styles.forgotText}>Usar otro correo</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: 80,
    paddingBottom: spacing.xl,
    gap: spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 40,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  title: {
    ...typography.display,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  titleSecondary: {
    color: '#C8C7C7',
  },
  form: {
    gap: spacing.md,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginTop: spacing.xs,
  },
  forgotText: {
    ...typography.small,
    color: 'rgba(255,255,255,0.7)',
    textDecorationLine: 'underline',
  },
  guestLink: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  guestText: {
    ...typography.link,
    color: colors.textPrimary,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dividerText: {
    ...typography.small,
    color: 'rgba(255,255,255,0.6)',
  },
  outlineOnDark: {
    borderColor: 'rgba(255,255,255,0.4)',
  },
});
