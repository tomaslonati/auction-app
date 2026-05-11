import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Input } from '@/components/ui/Input';
import { ButtonPrimary } from '@/components/ui/Button';
import { colors, typography, spacing, radius, fonts } from '@/constants/design';

type Field = 'email' | 'nombre' | 'apellido' | 'domicilio' | 'numeroPais';

export default function PersonalDataScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const [form, setForm] = useState({
    email: params.email ?? '',
    nombre: '',
    apellido: '',
    domicilio: '',
    numeroPais: '54',
  });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});

  function set(field: Field) {
    return (value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    };
  }

  function validate() {
    const next: typeof errors = {};
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) next.email = 'Email inválido';
    if (!form.nombre.trim()) next.nombre = 'Requerido';
    if (!form.apellido.trim()) next.apellido = 'Requerido';
    if (!form.domicilio.trim()) next.domicilio = 'Requerido';
    const code = parseInt(form.numeroPais, 10);
    if (isNaN(code) || code <= 0) next.numeroPais = 'Ingresá un código válido (ej. 54)';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleContinue() {
    if (!validate()) return;
    router.push({
      pathname: '/(auth)/register/documents',
      params: {
        email: form.email,
        nombre: form.nombre,
        apellido: form.apellido,
        domicilio: form.domicilio,
        numeroPais: form.numeroPais,
      },
    });
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Onboarding" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Step indicator */}
          <View style={styles.stepContainer}>
            <Text style={styles.stepNumber}>01</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '33%' }]} />
            </View>
          </View>

          <Text style={styles.title}>Datos{'\n'}personales</Text>

          <View style={styles.form}>
            <Input
              label="EMAIL"
              placeholder="jane@ejemplo.com"
              value={form.email}
              onChangeText={set('email')}
              autoCapitalize="none"
              keyboardType="email-address"
              error={errors.email}
            />

            {/* Row: Nombre + Apellido */}
            <View style={styles.row}>
              <Input
                label="NOMBRE"
                placeholder="Jane"
                value={form.nombre}
                onChangeText={set('nombre')}
                autoCapitalize="words"
                error={errors.nombre}
                containerStyle={styles.halfInput}
              />
              <Input
                label="APELLIDO"
                placeholder="Doe"
                value={form.apellido}
                onChangeText={set('apellido')}
                autoCapitalize="words"
                error={errors.apellido}
                containerStyle={styles.halfInput}
              />
            </View>

            <Input
              label="DIRECCIÓN"
              placeholder="Uriburu 1524"
              value={form.domicilio}
              onChangeText={set('domicilio')}
              autoCapitalize="words"
              error={errors.domicilio}
            />

            <Input
              label="CÓD. DE PAÍS"
              placeholder="54"
              value={form.numeroPais}
              onChangeText={set('numeroPais')}
              keyboardType="number-pad"
              error={errors.numeroPais}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom CTA */}
      <View style={styles.footer}>
        <ButtonPrimary label="Continuar" onPress={handleContinue} />
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
  flex: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 120,
    gap: spacing.xl,
  },
  stepContainer: {
    gap: spacing.sm,
  },
  stepNumber: {
    fontSize: 48,
    fontFamily: fonts.regular,
    color: colors.textTertiary,
    lineHeight: 52,
  },
  progressBar: {
    height: 3,
    backgroundColor: colors.divider,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.textSecondary,
    borderRadius: radius.full,
  },
  title: {
    ...typography.h1,
    color: colors.textTertiary,
    fontFamily: fonts.regular,
  },
  form: {
    gap: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.backgroundApp,
  },
});
