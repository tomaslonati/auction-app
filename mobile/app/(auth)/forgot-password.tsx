import { useState } from 'react';
import { View, Text, StyleSheet, Platform, Alert } from 'react-native';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Input } from '@/components/ui/Input';
import { ButtonPrimary } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { colors, typography, spacing, fonts } from '@/constants/design';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSend() {
    if (!email.trim()) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (error) {
      Alert.alert('Error', 'No se pudo enviar el email de recuperación.');
    } else {
      setSent(true);
    }
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Recuperar contraseña" />
      <View style={styles.content}>
        {sent ? (
          <>
            <Text style={styles.title}>¡Listo!</Text>
            <Text style={styles.body}>
              Te enviamos un link a {email} para que puedas restablecer tu contraseña.
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.title}>Recuperar{'\n'}contraseña</Text>
            <Input
              label="CORREO ELECTRÓNICO"
              placeholder="tu@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <ButtonPrimary label="Enviar link" onPress={handleSend} loading={loading} />
          </>
        )}
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
  body: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },
});
