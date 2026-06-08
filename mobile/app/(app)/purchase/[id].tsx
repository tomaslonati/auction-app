import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { colors, fonts, spacing, shadow } from '@/constants/design';

type PaymentMethodDetail =
  | { tipo: 'cuenta_bancaria'; bankAccount: { banco: string; numeroCuenta: string } }
  | { tipo: 'tarjeta_credito'; creditCard: { marca: string; ultimosCuatro: string } }
  | { tipo: 'cheque_certificado' };

type Purchase = {
  id: string;
  montoFinal: number;
  comision: number;
  costoEnvio: number;
  estadoPago: 'pendiente' | 'pagado' | 'vencido' | 'judicial';
  retiroPersonal: boolean;
  createdAt: string;
  item: { id: string; descripcion: string; numeroPieza: string };
  paymentMethod: PaymentMethodDetail;
};

function paymentLabel(pm: PaymentMethodDetail): string {
  if (pm.tipo === 'cuenta_bancaria') return `${pm.bankAccount.banco} — ${pm.bankAccount.numeroCuenta}`;
  if (pm.tipo === 'tarjeta_credito') return `${pm.creditCard.marca} ****${pm.creditCard.ultimosCuatro}`;
  return 'Cheque certificado';
}

function paymentIcon(pm: PaymentMethodDetail): keyof typeof Ionicons.glyphMap {
  if (pm.tipo === 'tarjeta_credito') return 'card-outline';
  if (pm.tipo === 'cheque_certificado') return 'document-text-outline';
  return 'business-outline';
}

const ESTADO_CONFIG: Record<Purchase['estadoPago'], { label: string; color: string; bg: string }> = {
  pendiente: { label: 'Pendiente de pago', color: colors.warning,  bg: colors.warningBg  },
  pagado:    { label: 'Pagado',             color: colors.success,  bg: colors.successBg  },
  vencido:   { label: 'Pago vencido',       color: colors.error,    bg: colors.errorBg    },
  judicial:  { label: 'En proceso judicial',color: colors.error,    bg: colors.errorBg    },
};

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={[s.rowValue, bold && s.rowValueBold]}>{value}</Text>
    </View>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <Text style={s.sectionLabel}>{children}</Text>;
}

export default function PurchaseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState(true);
  const [pickingUp, setPickingUp] = useState(false);

  useEffect(() => {
    api.get<Purchase>(`/api/purchases/${id}`).then(({ data }) => {
      if (data) setPurchase(data);
      setLoading(false);
    });
  }, [id]);

  async function handlePickup() {
    Alert.alert(
      'Retiro personal',
      'Al declarar retiro personal perdés la cobertura del seguro sobre el bien. ¿Querés continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar retiro',
          style: 'destructive',
          onPress: async () => {
            setPickingUp(true);
            const { error } = await api.patch(`/api/purchases/${id}/pickup`, {});
            setPickingUp(false);
            if (error) {
              Alert.alert('Error', typeof error === 'string' ? error : 'No se pudo registrar el retiro.');
              return;
            }
            setPurchase(prev => prev ? { ...prev, retiroPersonal: true } : prev);
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <LinearGradient colors={['#E8EDEC', '#ABB4B2']} style={s.loaderBg}>
        <ActivityIndicator color={colors.textSecondary} />
      </LinearGradient>
    );
  }

  if (!purchase) {
    return (
      <LinearGradient colors={['#E8EDEC', '#ABB4B2']} style={s.loaderBg}>
        <Ionicons name="alert-circle-outline" size={40} color={colors.textSecondary} />
        <Text style={s.emptyText}>No se encontró la compra</Text>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backBtnText}>Volver</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  const total = Number(purchase.montoFinal) + Number(purchase.comision) + Number(purchase.costoEnvio);
  const fecha = new Date(purchase.createdAt).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  const estado = ESTADO_CONFIG[purchase.estadoPago] ?? ESTADO_CONFIG.pendiente;

  return (
    <LinearGradient colors={['#E8EDEC', '#ABB4B2']} style={s.screen}>
      {/* Hero */}
      <View style={[s.hero, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={s.backFloating} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={16} color="#FFF" />
        </TouchableOpacity>

        <View style={s.trophyCircle}>
          <Ionicons name="trophy" size={32} color="#856404" />
        </View>
        <Text style={s.heroLabel}>PIEZA ADJUDICADA</Text>
        <Text style={s.heroPieza}>Pieza #{purchase.item.numeroPieza}</Text>
        <Text style={s.heroDesc} numberOfLines={2}>{purchase.item.descripcion}</Text>
      </View>

      {/* Content card */}
      <ScrollView
        style={{ marginTop: -32, flex: 1 }}
        contentContainerStyle={s.cardContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.card}>

          {/* Estado */}
          <View style={[s.estadoBadge, { backgroundColor: estado.bg }]}>
            <View style={[s.estadoDot, { backgroundColor: estado.color }]} />
            <Text style={[s.estadoText, { color: estado.color }]}>{estado.label}</Text>
          </View>

          {/* Precio final destacado */}
          <View style={s.totalHero}>
            <Text style={s.totalHeroLabel}>TOTAL A PAGAR</Text>
            <Text style={s.totalHeroAmount}>${total.toLocaleString('es-AR')}</Text>
          </View>

          {/* Desglose */}
          <View style={s.section}>
            <SectionLabel>DESGLOSE</SectionLabel>
            <View style={s.breakdownCard}>
              <Row label="Monto pujado" value={`$${Number(purchase.montoFinal).toLocaleString('es-AR')}`} />
              <View style={s.divider} />
              <Row label="Comisión de la casa" value={`$${Number(purchase.comision).toLocaleString('es-AR')}`} />
              <View style={s.divider} />
              <Row
                label="Costo de envío"
                value={Number(purchase.costoEnvio) === 0 ? 'Sin cargo' : `$${Number(purchase.costoEnvio).toLocaleString('es-AR')}`}
              />
            </View>
          </View>

          {/* Medio de pago */}
          <View style={s.section}>
            <SectionLabel>MEDIO DE PAGO</SectionLabel>
            <View style={s.infoRow}>
              <View style={s.infoIcon}>
                <Ionicons name={paymentIcon(purchase.paymentMethod)} size={18} color={colors.textSecondary} />
              </View>
              <Text style={s.infoText}>{paymentLabel(purchase.paymentMethod)}</Text>
            </View>
          </View>

          {/* Fecha */}
          <View style={s.section}>
            <SectionLabel>FECHA DE ADJUDICACIÓN</SectionLabel>
            <View style={s.infoRow}>
              <View style={s.infoIcon}>
                <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
              </View>
              <Text style={s.infoText}>{fecha}</Text>
            </View>
          </View>

          {/* Entrega */}
          <View style={s.section}>
            <SectionLabel>ENTREGA</SectionLabel>
            {purchase.retiroPersonal ? (
              <View style={[s.alertBox, { backgroundColor: colors.warningBg }]}>
                <Ionicons name="warning-outline" size={18} color={colors.warning} />
                <Text style={[s.alertText, { color: '#92400E' }]}>
                  Retiro personal declarado — sin cobertura de seguro
                </Text>
              </View>
            ) : (
              <View style={s.deliveryBlock}>
                <View style={s.infoRow}>
                  <View style={s.infoIcon}>
                    <Ionicons name="cube-outline" size={18} color={colors.textSecondary} />
                  </View>
                  <Text style={s.infoText}>Envío a tu domicilio declarado</Text>
                </View>
                {purchase.estadoPago === 'pagado' && (
                  <TouchableOpacity
                    style={[s.pickupBtn, pickingUp && { opacity: 0.6 }]}
                    onPress={handlePickup}
                    disabled={pickingUp}
                    activeOpacity={0.8}
                  >
                    {pickingUp
                      ? <ActivityIndicator color={colors.textSecondary} size="small" />
                      : <Text style={s.pickupBtnText}>Declarar retiro personal</Text>
                    }
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          <View style={{ height: spacing.lg }} />
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  loaderBg: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  emptyText: { fontSize: 16, fontFamily: fonts.regular, color: colors.textSecondary, textAlign: 'center' },
  backBtn: {
    backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 32,
    paddingVertical: 12, paddingHorizontal: 24,
  },
  backBtnText: { fontSize: 15, fontFamily: fonts.semiBold, color: '#2C3434' },

  hero: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 56,
    alignItems: 'center',
    gap: 8,
  },
  backFloating: {
    position: 'absolute', left: spacing.lg, top: 0,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  trophyCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#FFF9C4',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  heroLabel: {
    fontSize: 10, fontFamily: fonts.bold, color: 'rgba(44,52,52,0.6)',
    letterSpacing: 2.2, textTransform: 'uppercase',
  },
  heroPieza: { fontSize: 13, fontFamily: fonts.medium, color: '#2C3434', letterSpacing: -0.3 },
  heroDesc: {
    fontSize: 22, fontFamily: fonts.semiBold, color: '#2C3434',
    letterSpacing: -1.2, lineHeight: 28, textAlign: 'center',
  },

  cardContent: { paddingBottom: 32 },
  card: {
    backgroundColor: colors.surface, borderRadius: 32,
    marginHorizontal: 0, padding: spacing.lg, gap: spacing.lg,
    ...shadow.card,
  },

  estadoBadge: {
    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
  },
  estadoDot: { width: 7, height: 7, borderRadius: 4 },
  estadoText: { fontSize: 13, fontFamily: fonts.semiBold, letterSpacing: -0.3 },

  totalHero: {
    backgroundColor: '#E3E9E8', borderRadius: 20,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, gap: 4,
  },
  totalHeroLabel: {
    fontSize: 11, fontFamily: fonts.bold, color: '#586160',
    letterSpacing: -0.33, textTransform: 'uppercase',
  },
  totalHeroAmount: {
    fontSize: 44, fontFamily: fonts.bold, color: '#2C3434',
    letterSpacing: -2, lineHeight: 48,
  },

  section: { gap: 10 },
  sectionLabel: {
    fontSize: 10, fontFamily: fonts.bold, color: colors.textSecondary,
    letterSpacing: 1.4, textTransform: 'uppercase', paddingHorizontal: 4,
  },

  breakdownCard: {
    backgroundColor: '#F1F4F3', borderRadius: 20,
    paddingHorizontal: spacing.lg, paddingVertical: 4,
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 14,
  },
  rowLabel: { fontSize: 14, fontFamily: fonts.regular, color: '#586160' },
  rowValue: { fontSize: 14, fontFamily: fonts.semiBold, color: '#2C3434' },
  rowValueBold: { fontSize: 17, fontFamily: fonts.bold, color: '#182D28', letterSpacing: -0.5 },
  divider: { height: 1, backgroundColor: 'rgba(171,180,179,0.2)' },

  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#F1F4F3', borderRadius: 16,
    paddingHorizontal: spacing.md, paddingVertical: 14,
  },
  infoIcon: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: '#E3E9E8', alignItems: 'center', justifyContent: 'center',
  },
  infoText: { fontSize: 14, fontFamily: fonts.regular, color: '#2C3434', flex: 1 },

  alertBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderRadius: 16, paddingHorizontal: spacing.md, paddingVertical: 14,
  },
  alertText: { fontSize: 13, fontFamily: fonts.medium, flex: 1, lineHeight: 18 },

  deliveryBlock: { gap: 10 },
  pickupBtn: {
    backgroundColor: '#F1F4F3', borderRadius: 14,
    paddingVertical: 13, alignItems: 'center',
  },
  pickupBtnText: { fontSize: 13, fontFamily: fonts.semiBold, color: '#586160', letterSpacing: -0.3 },
});
