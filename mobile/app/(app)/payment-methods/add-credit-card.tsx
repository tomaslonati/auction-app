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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { fonts, spacing } from '@/constants/design';

const CARD_BRANDS = ['Visa', 'Mastercard', 'Amex', 'Cabal', 'Naranja'];

function detectBrand(number: string): string {
  const n = number.replace(/\s/g, '');
  if (n.startsWith('4')) return 'Visa';
  if (n.startsWith('5') || n.startsWith('2')) return 'Mastercard';
  if (n.startsWith('34') || n.startsWith('37')) return 'Amex';
  return '';
}

function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

function CardPreview({
  number,
  holder,
  expiry,
  brand,
}: {
  number: string;
  holder: string;
  expiry: string;
  brand: string;
}) {
  const displayNumber = number.padEnd(19, '·').slice(0, 19);
  return (
    <LinearGradient
      colors={['#D567DE', '#5A0071']}
      start={{ x: 0.7, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={card.container}
    >
      <View style={card.row}>
        <Text style={card.typeLabel}>CREDIT</Text>
        <Text style={card.brandLabel}>{brand || 'VISA'}</Text>
      </View>
      <Text style={card.number}>{displayNumber || '#### #### #### ####'}</Text>
      <Text style={card.holder}>{holder.toUpperCase() || 'NOMBRE TITULAR'}</Text>
    </LinearGradient>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={form.field}>
      <Text style={form.label}>{label}</Text>
      {children}
    </View>
  );
}

export default function AddCreditCardScreen() {
  const router = useRouter();
  const [titular, setTitular] = useState('');
  const [numero, setNumero] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [esInternacional, setEsInternacional] = useState(false);
  const [loading, setLoading] = useState(false);

  const brand = detectBrand(numero);

  function handleNumberChange(text: string) {
    setNumero(formatCardNumber(text));
  }

  function handleExpiryChange(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      setExpiry(`${digits.slice(0, 2)}/${digits.slice(2)}`);
    } else {
      setExpiry(digits);
    }
  }

  async function handleSubmit() {
    const digits = numero.replace(/\s/g, '');
    if (digits.length < 16) return Alert.alert('Error', 'Ingresá un número de tarjeta válido.');
    if (!titular.trim()) return Alert.alert('Error', 'Ingresá el nombre del titular.');
    if (expiry.length < 5) return Alert.alert('Error', 'Ingresá la fecha de vencimiento (MM/AA).');

    const [mesStr, anioStr] = expiry.split('/');
    const mesVencimiento = parseInt(mesStr, 10);
    const anioVencimiento = 2000 + parseInt(anioStr, 10);

    if (mesVencimiento < 1 || mesVencimiento > 12) return Alert.alert('Error', 'Mes inválido.');

    setLoading(true);
    const { error } = await api.post('/api/users/me/payment-methods/credit-card', {
      ultimosCuatro: digits.slice(-4),
      marca: brand || 'Otra',
      titular: titular.trim(),
      mesVencimiento,
      anioVencimiento,
      esInternacional,
    });
    setLoading(false);

    if (error) {
      Alert.alert('Error', typeof error === 'string' ? error : 'No se pudo agregar la tarjeta.');
      return;
    }

    router.back();
    router.back();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Agregar nueva tarjeta</Text>
        <Text style={styles.subtitle}>Ingresá los datos de tu tarjeta de crédito</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <CardPreview number={numero} holder={titular} expiry={expiry} brand={brand} />

        <View style={form.container}>
          <FormField label="NOMBRE COMPLETO">
            <TextInput
              style={form.input}
              placeholder="JANE DOE"
              placeholderTextColor="#808A88"
              value={titular}
              onChangeText={setTitular}
              autoCapitalize="characters"
            />
          </FormField>

          <FormField label="NÚMERO DE LA TARJETA">
            <TextInput
              style={form.input}
              placeholder="1234 5678 9101 1121"
              placeholderTextColor="#808A88"
              value={numero}
              onChangeText={handleNumberChange}
              keyboardType="number-pad"
              maxLength={19}
            />
          </FormField>

          <View style={form.row}>
            <View style={{ flex: 1 }}>
              <FormField label="VENCIMIENTO">
                <TextInput
                  style={form.input}
                  placeholder="MM/AA"
                  placeholderTextColor="#808A88"
                  value={expiry}
                  onChangeText={handleExpiryChange}
                  keyboardType="number-pad"
                  maxLength={5}
                />
              </FormField>
            </View>
            <View style={{ flex: 1 }}>
              <FormField label="CVV">
                <TextInput
                  style={form.input}
                  placeholder="312"
                  placeholderTextColor="#808A88"
                  value={cvv}
                  onChangeText={setCvv}
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                />
              </FormField>
            </View>
          </View>

          <View style={form.switchRow}>
            <Text style={form.label}>ES INTERNACIONAL</Text>
            <Switch
              value={esInternacional}
              onValueChange={setEsInternacional}
              trackColor={{ true: '#151515' }}
            />
          </View>
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
            <Text style={styles.buttonText}>Confirmar tarjeta</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const card = StyleSheet.create({
  container: {
    borderRadius: 21,
    padding: 24,
    height: 200,
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeLabel: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  brandLabel: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  number: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  holder: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: '#FFFFFF',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});

const form = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  field: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
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
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: '#1F2937',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E7ECEB',
  },
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 24,
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
  buttonLoading: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 17,
    fontFamily: fonts.regular,
    color: '#FFFFFF',
    letterSpacing: -0.68,
  },
});
