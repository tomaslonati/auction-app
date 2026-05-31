import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fonts } from '@/constants/design';

type PaymentMethodType = 'tarjeta_credito' | 'cuenta_bancaria' | 'cheque_certificado';

const OPTIONS: {
  tipo: PaymentMethodType;
  label: string;
  desc: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    tipo: 'tarjeta_credito',
    label: 'Tarjeta de crédito',
    desc: 'Tarjetas nacionales o internacionales',
    icon: 'card-outline',
  },
  {
    tipo: 'cuenta_bancaria',
    label: 'Cuenta bancaria',
    desc: 'Cuentas nacionales o internacionales',
    icon: 'business-outline',
  },
  {
    tipo: 'cheque_certificado',
    label: 'Cheque certificado',
    desc: 'Cheques con monto disponible verificado',
    icon: 'document-text-outline',
  },
];

export default function AddPaymentMethodScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<PaymentMethodType | null>(null);

  return (
    <View style={styles.container}>
      {/* Grab handle space — sheetGrabberVisible adds one but we add top padding */}
      <View style={styles.header}>
        <Text style={styles.title}>Agregar método de pago</Text>
        <Text style={styles.subtitle}>
          Indicar qué tipo de método de pago deseas agregar.
        </Text>
      </View>

      <View style={styles.options}>
        {OPTIONS.map((opt) => {
          const isSelected = selected === opt.tipo;
          return (
            <TouchableOpacity
              key={opt.tipo}
              style={[styles.optionRow, isSelected && styles.optionRowSelected]}
              onPress={() => setSelected(opt.tipo)}
              activeOpacity={0.7}
            >
              <View style={styles.optionIcon}>
                <Ionicons
                  name={opt.icon}
                  size={20}
                  color={isSelected ? '#151515' : '#586160'}
                />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionLabel}>{opt.label}</Text>
                <Text style={styles.optionDesc}>{opt.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={[styles.confirmBtn, !selected && styles.confirmBtnDisabled]}
        onPress={() => {
          if (!selected) return;
          const routes: Record<string, string> = {
            tarjeta_credito: '/(app)/payment-methods/add-credit-card',
            cuenta_bancaria: '/(app)/payment-methods/add-bank-account',
            cheque_certificado: '/(app)/payment-methods/add-check',
          };
          router.push(routes[selected] as never);
        }}
        disabled={!selected}
        activeOpacity={0.85}
      >
        <Text style={styles.confirmText}>Confirmar medio de pago</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E7ECEB',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 48,
    gap: 28,
  },
  header: {
    gap: 8,
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
    lineHeight: 22,
    marginTop: 6,
  },
  options: {
    gap: spacing.md,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FBFB',
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  optionRowSelected: {
    backgroundColor: '#E0E5E4',
    borderColor: '#151515',
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionContent: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: '#1F2937',
    letterSpacing: -0.64,
    lineHeight: 24,
  },
  optionDesc: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: '#6B7280',
    lineHeight: 16,
  },
  confirmBtn: {
    backgroundColor: '#151515',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  confirmBtnDisabled: {
    opacity: 0.35,
  },
  confirmText: {
    fontSize: 17,
    fontFamily: fonts.regular,
    color: '#FFFFFF',
    letterSpacing: -0.68,
  },
});
