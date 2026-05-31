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
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';
import { fonts, spacing } from '@/constants/design';

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={form.field}>
      <Text style={form.label}>{label}</Text>
      {children}
    </View>
  );
}

export default function AddCheckScreen() {
  const router = useRouter();
  const [banco, setBanco] = useState('');
  const [numeroCheque, setNumeroCheque] = useState('');
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState('');
  const [loading, setLoading] = useState(false);

  function handleMontoChange(text: string) {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    setMonto(cleaned);
  }

  function handleFechaChange(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, 8);
    if (digits.length >= 5) {
      setFecha(`${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`);
    } else if (digits.length >= 3) {
      setFecha(`${digits.slice(0, 2)}/${digits.slice(2)}`);
    } else {
      setFecha(digits);
    }
  }

  async function handleSubmit() {
    if (!banco.trim()) return Alert.alert('Error', 'Ingresá el nombre del banco emisor.');
    if (!numeroCheque.trim()) return Alert.alert('Error', 'Ingresá el número de cheque.');
    const montoNum = parseFloat(monto);
    if (!monto || isNaN(montoNum) || montoNum <= 0)
      return Alert.alert('Error', 'Ingresá un monto válido.');
    if (fecha.length < 10) return Alert.alert('Error', 'Ingresá la fecha de vencimiento (DD/MM/AAAA).');

    const [dd, mm, yyyy] = fecha.split('/');
    const day = parseInt(dd, 10);
    const month = parseInt(mm, 10);
    const year = parseInt(yyyy, 10);

    if (month < 1 || month > 12 || day < 1 || day > 31)
      return Alert.alert('Error', 'Fecha inválida.');

    const fechaISO = new Date(year, month - 1, day, 12, 0, 0).toISOString();

    setLoading(true);
    const { error } = await api.post('/api/users/me/payment-methods/certified-check', {
      banco: banco.trim(),
      numeroCheque: numeroCheque.trim(),
      monto: montoNum,
      fechaVencimiento: fechaISO,
    });
    setLoading(false);

    if (error) {
      Alert.alert('Error', typeof error === 'string' ? error : 'No se pudo agregar el cheque.');
      return;
    }

    router.back();
    router.back();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Agregar nuevo{'\n'}cheque certificado</Text>
        <Text style={styles.subtitle}>Ingresá los datos del cheque certificado.</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={form.container}>
          <FormField label="BANCO EMISOR">
            <TextInput
              style={form.input}
              placeholder="Ej: Banco Nación"
              placeholderTextColor="#808A88"
              value={banco}
              onChangeText={setBanco}
            />
          </FormField>

          <FormField label="NÚMERO DE CHEQUE">
            <TextInput
              style={form.input}
              placeholder="00000000"
              placeholderTextColor="#808A88"
              value={numeroCheque}
              onChangeText={setNumeroCheque}
              keyboardType="number-pad"
            />
          </FormField>

          <FormField label="MONTO (ARS)">
            <TextInput
              style={form.input}
              placeholder="0.00"
              placeholderTextColor="#808A88"
              value={monto}
              onChangeText={handleMontoChange}
              keyboardType="decimal-pad"
            />
          </FormField>

          <FormField label="FECHA DE VENCIMIENTO">
            <TextInput
              style={form.input}
              placeholder="DD/MM/AAAA"
              placeholderTextColor="#808A88"
              value={fecha}
              onChangeText={handleFechaChange}
              keyboardType="number-pad"
              maxLength={10}
            />
          </FormField>
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
            <Text style={styles.buttonText}>Confirmar cheque</Text>
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
