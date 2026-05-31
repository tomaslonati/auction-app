import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { api } from '@/lib/api';
import { colors, spacing, fonts } from '@/constants/design';

type PaymentMethodType = 'cuenta_bancaria' | 'tarjeta_credito' | 'cheque_certificado';
type PaymentMethodStatus = 'pendiente' | 'verificado' | 'rechazado' | 'expirado';

type BankAccount = { banco: string; numeroCuenta: string; titular: string; moneda: string };
type CreditCard = { marca: string; ultimosCuatro: string; titular: string };
type CertifiedCheck = { montoDisponible: number };

type PaymentMethod = {
  id: string;
  tipo: PaymentMethodType;
  estado: PaymentMethodStatus;
  esInternacional: boolean;
  bankAccount: BankAccount | null;
  creditCard: CreditCard | null;
  certifiedCheck: CertifiedCheck | null;
};

function maskAccount(numero: string): string {
  if (numero.length <= 4) return numero;
  return '*'.repeat(Math.min(7, numero.length - 4)) + numero.slice(-4);
}

function getMethodLabel(method: PaymentMethod): { title: string; subtitle: string } {
  if (method.tipo === 'cuenta_bancaria' && method.bankAccount) {
    return {
      title: method.bankAccount.banco,
      subtitle: `CBU terminado en ${maskAccount(method.bankAccount.numeroCuenta)}`,
    };
  }
  if (method.tipo === 'tarjeta_credito' && method.creditCard) {
    return {
      title: `${method.creditCard.marca} – ${method.creditCard.titular}`,
      subtitle: `Tarjeta terminada en ****${method.creditCard.ultimosCuatro}`,
    };
  }
  if (method.tipo === 'cheque_certificado') {
    return {
      title: 'Cheque certificado',
      subtitle: method.certifiedCheck
        ? `Disponible: $${Number(method.certifiedCheck.montoDisponible).toLocaleString('es-AR')}`
        : '',
    };
  }
  return { title: '—', subtitle: '' };
}

function getMethodIcon(tipo: PaymentMethodType): keyof typeof Ionicons.glyphMap {
  if (tipo === 'cuenta_bancaria') return 'business-outline';
  if (tipo === 'tarjeta_credito') return 'card-outline';
  return 'document-text-outline';
}

function MethodRow({ method, onDelete }: { method: PaymentMethod; onDelete: (id: string) => void }) {
  const { title, subtitle } = getMethodLabel(method);

  function confirmDelete() {
    Alert.alert(
      'Eliminar método de pago',
      '¿Estás seguro? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => onDelete(method.id),
        },
      ]
    );
  }

  return (
    <View style={row.container}>
      <View style={row.iconCircle}>
        <Ionicons name={getMethodIcon(method.tipo)} size={20} color="#3B82F6" />
      </View>
      <View style={row.content}>
        <Text style={row.title}>{title}</Text>
        <Text style={row.subtitle}>{subtitle}</Text>
        {method.estado === 'pendiente' && (
          <Text style={row.pendingLabel}>Verificación pendiente</Text>
        )}
        {method.estado === 'rechazado' && (
          <Text style={row.rejectedLabel}>Rechazado</Text>
        )}
      </View>
      <TouchableOpacity onPress={confirmDelete} hitSlop={12} style={row.deleteBtn}>
        <Ionicons name="trash-outline" size={18} color="#DC2626" />
      </TouchableOpacity>
    </View>
  );
}

function SectionGroup({
  label,
  methods,
  onDelete,
}: {
  label: string;
  methods: PaymentMethod[];
  onDelete: (id: string) => void;
}) {
  if (methods.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.methodList}>
        {methods.map((m) => (
          <MethodRow key={m.id} method={m} onDelete={onDelete} />
        ))}
      </View>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="shield-checkmark-outline" size={32} color={colors.textSecondary} />
      <Text style={styles.emptyTitle}>Agregá un método de pago</Text>
      <Text style={styles.emptyDesc}>
        Tus datos financieros están protegidos bajo protocolos de encriptación bancaria de alto
        nivel. Solo se utilizarán para la liquidación de subastas ganadas.
      </Text>
    </View>
  );
}

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadMethods() {
    const { data } = await api.get<PaymentMethod[]>('/api/users/me/payment-methods');
    if (data) setMethods(data);
    setLoading(false);
  }

  useEffect(() => { loadMethods(); }, []);

  async function handleDelete(id: string) {
    const { error } = await api.delete(`/api/users/me/payment-methods/${id}`);
    if (error) {
      Alert.alert('Error', typeof error === 'string' ? error : 'No se pudo eliminar el método de pago.');
      return;
    }
    setMethods((prev) => prev.filter((m) => m.id !== id));
  }

  const hasPending = methods.some((m) => m.estado === 'pendiente');
  const bankAccounts = methods.filter((m) => m.tipo === 'cuenta_bancaria');
  const creditCards = methods.filter((m) => m.tipo === 'tarjeta_credito');
  const checks = methods.filter((m) => m.tipo === 'cheque_certificado');

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScreenHeader title="Métodos de pago" />

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.textSecondary} />
        </View>
      ) : methods.length === 0 ? (
        <EmptyState />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {hasPending && (
            <View style={styles.warningBanner}>
              <Ionicons name="warning-outline" size={20} color="#9F403D" />
              <View style={styles.warningContent}>
                <Text style={styles.warningTitle}>Necesitamos tu verificación</Text>
                <Text style={styles.warningDesc}>
                  Verificá tus datos bancarios para participar en las subastas activas.
                </Text>
              </View>
            </View>
          )}
          <SectionGroup label="CUENTAS BANCARIAS" methods={bankAccounts} onDelete={handleDelete} />
          <SectionGroup label="TARJETAS DE CRÉDITO" methods={creditCards} onDelete={handleDelete} />
          <SectionGroup label="CHEQUES CERTIFICADOS" methods={checks} onDelete={handleDelete} />
        </ScrollView>
      )}

      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/(app)/payment-methods/add' as never)}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
          <Text style={styles.fabText}>Agregar método de pago</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.backgroundApp },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 120, gap: spacing.xl },
  warningBanner: {
    flexDirection: 'row', backgroundColor: '#F9EDED',
    borderRadius: 16, padding: spacing.lg, gap: 10, alignItems: 'flex-start',
  },
  warningContent: { flex: 1, gap: 6 },
  warningTitle: { fontSize: 16, fontFamily: fonts.semiBold, color: '#9F403D', letterSpacing: -0.64 },
  warningDesc: { fontSize: 14, fontFamily: fonts.regular, color: '#586160', letterSpacing: -0.64, lineHeight: 20 },
  section: { gap: spacing.md },
  sectionLabel: {
    fontSize: 14, fontFamily: fonts.bold, color: '#6A7472',
    letterSpacing: -0.42, textTransform: 'uppercase', lineHeight: 15,
  },
  methodList: { gap: spacing.sm },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, gap: 10 },
  emptyTitle: { fontSize: 16, fontFamily: fonts.semiBold, color: '#6A7472', letterSpacing: -0.64 },
  emptyDesc: { fontSize: 14, fontFamily: fonts.regular, color: '#586160', textAlign: 'center', lineHeight: 20 },
  fabContainer: { position: 'absolute', bottom: 32, left: spacing.lg, right: spacing.lg },
  fab: {
    backgroundColor: '#151515', borderRadius: 32, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', paddingVertical: 16,
    paddingHorizontal: spacing.lg, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  fabText: { fontSize: 16, fontFamily: fonts.regular, color: '#FFFFFF', letterSpacing: -0.68 },
});

const row = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FBFB',
    borderRadius: 16, padding: spacing.md, gap: spacing.md,
  },
  iconCircle: { width: 40, height: 40, borderRadius: 16, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, gap: 2 },
  title: { fontSize: 16, fontFamily: fonts.semiBold, color: '#1F2937', letterSpacing: -0.64, lineHeight: 24 },
  subtitle: { fontSize: 12, fontFamily: fonts.regular, color: '#6B7280', lineHeight: 16 },
  pendingLabel: { fontSize: 11, fontFamily: fonts.semiBold, color: '#F59E0B' },
  rejectedLabel: { fontSize: 11, fontFamily: fonts.semiBold, color: '#DC2626' },
  deleteBtn: { padding: 4 },
});
