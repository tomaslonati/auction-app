import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { fonts, spacing } from '@/constants/design';

const MONEDAS = [
  { label: 'Pesos (ARS)', value: 'ARS' },
  { label: 'Dólares (USD)', value: 'USD' },
  { label: 'Euros (EUR)', value: 'EUR' },
];

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={form.field}>
      <Text style={form.label}>{label}</Text>
      {children}
    </View>
  );
}

function SelectField({
  label,
  value,
  options,
  onSelect,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onSelect: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <FormField label={label}>
      <TouchableOpacity style={form.select} onPress={() => setOpen(!open)} activeOpacity={0.7}>
        <Text style={form.selectText}>{selected?.label ?? 'Seleccionar...'}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color="#808A88" />
      </TouchableOpacity>
      {open &&
        options.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[form.option, opt.value === value && form.optionSelected]}
            onPress={() => { onSelect(opt.value); setOpen(false); }}
          >
            <Text style={[form.optionText, opt.value === value && form.optionTextSelected]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
    </FormField>
  );
}

export default function AddBankAccountScreen() {
  const router = useRouter();
  const [banco, setBanco] = useState('');
  const [numeroCuenta, setNumeroCuenta] = useState('');
  const [titular, setTitular] = useState('');
  const [moneda, setMoneda] = useState('ARS');
  const [swiftBic, setSwiftBic] = useState('');
  const [iban, setIban] = useState('');
  const [esInternacional, setEsInternacional] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!banco.trim()) return Alert.alert('Error', 'Ingresá el nombre del banco.');
    if (!numeroCuenta.trim()) return Alert.alert('Error', 'Ingresá el número de cuenta.');
    if (!titular.trim()) return Alert.alert('Error', 'Ingresá el nombre del titular.');

    setLoading(true);
    const { error } = await api.post('/api/users/me/payment-methods/bank-account', {
      banco: banco.trim(),
      numeroCuenta: numeroCuenta.trim(),
      titular: titular.trim(),
      numeroPaisId: esInternacional ? 1 : 54,
      moneda,
      swiftBic: swiftBic.trim() || undefined,
      iban: iban.trim() || undefined,
    });
    setLoading(false);

    if (error) {
      Alert.alert('Error', typeof error === 'string' ? error : 'No se pudo agregar la cuenta.');
      return;
    }

    router.back();
    router.back();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Agregar nueva{'\n'}cuenta bancaria</Text>
        <Text style={styles.subtitle}>Ingresá los datos de tu cuenta bancaria.</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={form.container}>
          <FormField label="BANCO">
            <TextInput
              style={form.input}
              placeholder="Ej: Banco Nación"
              placeholderTextColor="#808A88"
              value={banco}
              onChangeText={setBanco}
            />
          </FormField>

          <SelectField
            label="MONEDA"
            value={moneda}
            options={MONEDAS}
            onSelect={setMoneda}
          />

          <FormField label="NÚMERO DE CUENTA (CBU/IBAN)">
            <TextInput
              style={form.input}
              placeholder="0000000000000000000000"
              placeholderTextColor="#808A88"
              value={numeroCuenta}
              onChangeText={setNumeroCuenta}
              keyboardType="number-pad"
            />
          </FormField>

          <FormField label="TITULAR">
            <TextInput
              style={form.input}
              placeholder="Nombre completo"
              placeholderTextColor="#808A88"
              value={titular}
              onChangeText={setTitular}
            />
          </FormField>

          <View style={form.switchRow}>
            <Text style={form.label}>ES CUENTA INTERNACIONAL</Text>
            <Switch
              value={esInternacional}
              onValueChange={setEsInternacional}
              trackColor={{ true: '#151515' }}
            />
          </View>

          {esInternacional && (
            <>
              <FormField label="SWIFT / BIC">
                <TextInput
                  style={form.input}
                  placeholder="XXXXXXXXXX"
                  placeholderTextColor="#808A88"
                  value={swiftBic}
                  onChangeText={setSwiftBic}
                  autoCapitalize="characters"
                />
              </FormField>

              <FormField label="IBAN">
                <TextInput
                  style={form.input}
                  placeholder="XXXX0000000000000000"
                  placeholderTextColor="#808A88"
                  value={iban}
                  onChangeText={setIban}
                  autoCapitalize="characters"
                />
              </FormField>
            </>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonLoading]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Confirmar cuenta bancaria</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const form = StyleSheet.create({
  container: { gap: spacing.lg },
  field: { gap: 8 },
  label: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: '#6A7472',
    letterSpacing: -0.4,
    textTransform: 'uppercase',
  },
  input: {
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 32,
    paddingHorizontal: 16,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: '#1F2937',
  },
  select: {
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 32,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: '#1F2937',
  },
  option: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  optionSelected: {
    backgroundColor: 'rgba(21,21,21,0.08)',
  },
  optionText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: '#586160',
  },
  optionTextSelected: {
    fontFamily: fonts.semiBold,
    color: '#151515',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E7ECEB' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 20,
    gap: 6,
  },
  title: {
    fontSize: 20,
    fontFamily: fonts.semiBold,
    color: '#171C26',
    letterSpacing: -0.8,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: '#586160',
    letterSpacing: -0.64,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 16,
  },
  button: {
    backgroundColor: '#151515',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  buttonLoading: { opacity: 0.7 },
  buttonText: {
    fontSize: 17,
    fontFamily: fonts.regular,
    color: '#FFFFFF',
    letterSpacing: -0.68,
  },
});
