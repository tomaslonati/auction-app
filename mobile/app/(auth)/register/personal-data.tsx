import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Input } from '@/components/ui/Input';
import { ButtonPrimary } from '@/components/ui/Button';
import { colors, typography, spacing, radius, fonts } from '@/constants/design';

type Field = 'email' | 'nombre' | 'apellido' | 'documento' | 'domicilio' | 'numeroPais';
type Pais = { numero: number; nombre: string };

const PAISES: Pais[] = [
  { numero: 54,  nombre: 'Argentina' },
  { numero: 591, nombre: 'Bolivia' },
  { numero: 55,  nombre: 'Brasil' },
  { numero: 56,  nombre: 'Chile' },
  { numero: 57,  nombre: 'Colombia' },
  { numero: 506, nombre: 'Costa Rica' },
  { numero: 53,  nombre: 'Cuba' },
  { numero: 593, nombre: 'Ecuador' },
  { numero: 503, nombre: 'El Salvador' },
  { numero: 34,  nombre: 'España' },
  { numero: 1,   nombre: 'Estados Unidos' },
  { numero: 33,  nombre: 'Francia' },
  { numero: 502, nombre: 'Guatemala' },
  { numero: 504, nombre: 'Honduras' },
  { numero: 39,  nombre: 'Italia' },
  { numero: 52,  nombre: 'México' },
  { numero: 505, nombre: 'Nicaragua' },
  { numero: 507, nombre: 'Panamá' },
  { numero: 595, nombre: 'Paraguay' },
  { numero: 51,  nombre: 'Perú' },
  { numero: 351, nombre: 'Portugal' },
  { numero: 44,  nombre: 'Reino Unido' },
  { numero: 1809,nombre: 'República Dominicana' },
  { numero: 598, nombre: 'Uruguay' },
  { numero: 58,  nombre: 'Venezuela' },
];

export default function PersonalDataScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const [form, setForm] = useState({
    email: params.email ?? '',
    nombre: '',
    apellido: '',
    documento: '',
    domicilio: '',
    numeroPais: 54,
  });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [showPicker, setShowPicker] = useState(false);

  const paisSeleccionado = PAISES.find((p) => p.numero === form.numeroPais)

  const isFormComplete =
    /\S+@\S+\.\S+/.test(form.email) &&
    form.nombre.trim().length > 0 &&
    form.apellido.trim().length > 0 &&
    form.documento.trim().length > 0 &&
    form.domicilio.trim().length > 0 &&
    !!form.numeroPais;

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
    if (!form.documento.trim()) next.documento = 'Requerido';
    if (!form.domicilio.trim()) next.domicilio = 'Requerido';
    if (!form.numeroPais) next.numeroPais = 'Seleccioná un país';
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
        documento: form.documento,
        domicilio: form.domicilio,
        numeroPais: String(form.numeroPais),
        paisNombre: paisSeleccionado?.nombre ?? '',
      },
    });
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Onboarding" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
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
              label="DOCUMENTO / DNI"
              placeholder="12345678"
              value={form.documento}
              onChangeText={set('documento')}
              keyboardType="default"
              autoCapitalize="none"
              error={errors.documento}
            />

            <Input
              label="DIRECCIÓN"
              placeholder="Uriburu 1524"
              value={form.domicilio}
              onChangeText={set('domicilio')}
              autoCapitalize="words"
              error={errors.domicilio}
            />

            {/* País de origen */}
            <View>
              <Text style={styles.pickerLabel}>PAÍS DE ORIGEN</Text>
              <TouchableOpacity
                style={[styles.pickerBtn, errors.numeroPais ? styles.pickerBtnError : null]}
                onPress={() => setShowPicker(true)}
                activeOpacity={0.7}
              >
                <Text style={paisSeleccionado ? styles.pickerValue : styles.pickerPlaceholder}>
                  {paisSeleccionado ? paisSeleccionado.nombre : 'Seleccioná tu país'}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#9EA8A6" />
              </TouchableOpacity>
              {errors.numeroPais ? <Text style={styles.pickerError}>{errors.numeroPais}</Text> : null}
            </View>

            <Modal visible={showPicker} animationType="slide" transparent>
              <View style={styles.modalOverlay}>
                <View style={styles.modalSheet}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>País de origen</Text>
                    <TouchableOpacity onPress={() => setShowPicker(false)} hitSlop={12}>
                      <Ionicons name="close" size={20} color="#474747" />
                    </TouchableOpacity>
                  </View>
                  <FlatList
                    data={PAISES}
                    keyExtractor={(p) => String(p.numero)}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[styles.modalItem, item.numero === form.numeroPais && styles.modalItemSelected]}
                        onPress={() => {
                          setForm((prev) => ({ ...prev, numeroPais: item.numero }));
                          setErrors((prev) => ({ ...prev, numeroPais: undefined }));
                          setShowPicker(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.modalItemText, item.numero === form.numeroPais && styles.modalItemTextSelected]}>
                          {item.nombre}
                        </Text>
                        {item.numero === form.numeroPais && (
                          <Ionicons name="checkmark" size={16} color="#151515" />
                        )}
                      </TouchableOpacity>
                    )}
                    showsVerticalScrollIndicator={false}
                  />
                </View>
              </View>
            </Modal>
          </View>
        </ScrollView>

        {/* Bottom CTA — aparece solo cuando todos los campos requeridos están completos */}
        {isFormComplete && (
          <View style={styles.footer}>
            <ButtonPrimary label="Continuar" onPress={handleContinue} />
          </View>
        )}
      </KeyboardAvoidingView>
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
    paddingBottom: spacing.xl,
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
    paddingHorizontal: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.backgroundApp,
  },
  pickerLabel: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.full,
    paddingHorizontal: 20,
    height: 52,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pickerBtnError: {
    borderColor: '#DC2626',
  },
  pickerValue: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.textPrimary,
  },
  pickerPlaceholder: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: '#9CA3AF',
  },
  pickerError: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: '#DC2626',
    marginTop: 4,
    paddingLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E4E4E7',
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: '#18181B',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  modalItemSelected: {
    backgroundColor: '#F4F5F5',
  },
  modalItemText: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: '#474747',
  },
  modalItemTextSelected: {
    fontFamily: fonts.semiBold,
    color: '#151515',
  },
});
