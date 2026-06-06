import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { fonts } from '@/constants/design';

type PaymentMethodDetail =
  | { tipo: 'cuenta_bancaria'; bankAccount: { banco: string; numeroCuenta: string } }
  | { tipo: 'tarjeta_credito'; creditCard: { marca: string; ultimosCuatro: string } }
  | { tipo: 'cheque_certificado' };

type Purchase = {
  id: string;
  montoFinal: number;
  comision: number;
  costoEnvio: number;
  estadoPago: 'pendiente' | 'pagado' | 'cancelado';
  retiroPersonal: boolean;
  createdAt: string;
  item: { id: string; descripcion: string; numeroPieza: number };
  paymentMethod: PaymentMethodDetail;
};

function paymentLabel(pm: PaymentMethodDetail): string {
  if (pm.tipo === 'cuenta_bancaria') return `Cuenta bancaria — ${pm.bankAccount.banco}`;
  if (pm.tipo === 'tarjeta_credito') return `${pm.creditCard.marca} ****${pm.creditCard.ultimosCuatro}`;
  return 'Cheque certificado';
}

const ESTADO_LABEL: Record<Purchase['estadoPago'], string> = {
  pendiente: 'Pendiente de pago',
  pagado: 'Pagado',
  cancelado: 'Cancelado',
};

const ESTADO_COLOR: Record<Purchase['estadoPago'], string> = {
  pendiente: '#D97706',
  pagado: '#16A34A',
  cancelado: '#DC2626',
};

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={[s.rowValue, bold && s.rowValueBold]}>{value}</Text>
    </View>
  );
}

export default function PurchaseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
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
            setPurchase((prev) => prev ? { ...prev, retiroPersonal: true } : prev);
            Alert.alert('Retiro declarado', 'Tu retiro personal fue registrado. Recordá que ya no contás con cobertura de seguro.');
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={s.screen} edges={['top']}>
        <View style={s.loader}><ActivityIndicator color="#586160" /></View>
      </SafeAreaView>
    );
  }

  if (!purchase) {
    return (
      <SafeAreaView style={s.screen} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={20} color="#182D28" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Detalle de compra</Text>
          <View style={{ width: 20 }} />
        </View>
        <View style={s.loader}>
          <Text style={s.emptyText}>No se encontró la compra</Text>
        </View>
      </SafeAreaView>
    );
  }

  const total = Number(purchase.montoFinal) + Number(purchase.comision) + Number(purchase.costoEnvio);
  const fecha = new Date(purchase.createdAt).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={20} color="#182D28" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Detalle de compra</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        {/* Item info */}
        <View style={s.itemCard}>
          <View style={s.itemIcon}>
            <Ionicons name="cube-outline" size={28} color="#586160" />
          </View>
          <View style={s.itemBody}>
            <Text style={s.itemPieza}>Pieza #{purchase.item.numeroPieza}</Text>
            <Text style={s.itemDesc} numberOfLines={3}>{purchase.item.descripcion}</Text>
          </View>
        </View>

        {/* Estado badge */}
        <View style={[s.estadoBadge, { borderColor: ESTADO_COLOR[purchase.estadoPago] }]}>
          <View style={[s.estadoDot, { backgroundColor: ESTADO_COLOR[purchase.estadoPago] }]} />
          <Text style={[s.estadoText, { color: ESTADO_COLOR[purchase.estadoPago] }]}>
            {ESTADO_LABEL[purchase.estadoPago]}
          </Text>
        </View>

        {/* Desglose financiero */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>DESGLOSE DE PAGO</Text>
          <View style={s.card}>
            <Row label="Monto pujado" value={`$${Number(purchase.montoFinal).toLocaleString('es-AR')}`} />
            <View style={s.separator} />
            <Row label="Comisión" value={`$${Number(purchase.comision).toLocaleString('es-AR')}`} />
            <View style={s.separator} />
            <Row
              label="Costo de envío"
              value={Number(purchase.costoEnvio) === 0 ? 'Sin cargo' : `$${Number(purchase.costoEnvio).toLocaleString('es-AR')}`}
            />
            <View style={s.totalSeparator} />
            <Row label="TOTAL A PAGAR" value={`$${total.toLocaleString('es-AR')}`} bold />
          </View>
        </View>

        {/* Medio de pago */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>MEDIO DE PAGO</Text>
          <View style={s.card}>
            <View style={s.paymentRow}>
              <Ionicons
                name={purchase.paymentMethod.tipo === 'tarjeta_credito' ? 'card-outline' : 'business-outline'}
                size={20} color="#586160"
              />
              <Text style={s.paymentLabel}>{paymentLabel(purchase.paymentMethod)}</Text>
            </View>
          </View>
        </View>

        {/* Fecha */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>FECHA DE COMPRA</Text>
          <View style={s.card}>
            <Row label="Fecha" value={fecha} />
          </View>
        </View>

        {/* Retiro personal */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>ENTREGA</Text>
          <View style={s.card}>
            {purchase.retiroPersonal ? (
              <View style={s.pickupDeclared}>
                <Ionicons name="warning-outline" size={18} color="#D97706" />
                <Text style={s.pickupDeclaredText}>
                  Retiro personal declarado — sin cobertura de seguro
                </Text>
              </View>
            ) : (
              <>
                <Text style={s.pickupInfo}>
                  Tu compra será enviada a tu domicilio declarado. Si preferís retirar personalmente, perderás la cobertura del seguro sobre el bien.
                </Text>
                {purchase.estadoPago === 'pagado' && (
                  <TouchableOpacity
                    style={[s.pickupBtn, pickingUp && { opacity: 0.6 }]}
                    onPress={handlePickup}
                    disabled={pickingUp}
                    activeOpacity={0.8}
                  >
                    {pickingUp
                      ? <ActivityIndicator color="#586160" size="small" />
                      : <Text style={s.pickupBtnText}>Declarar retiro personal</Text>
                    }
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F7F6' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 15, fontFamily: fonts.regular, color: '#808A88' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, height: 56,
    backgroundColor: '#F5F7F6',
  },
  headerTitle: { fontSize: 15, fontFamily: fonts.semiBold, color: '#182D28', letterSpacing: -0.4 },
  content: { paddingHorizontal: 20, paddingTop: 8, gap: 20, paddingBottom: 20 },

  itemCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20,
    flexDirection: 'row', alignItems: 'flex-start', gap: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  itemIcon: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: '#E3E9E8', alignItems: 'center', justifyContent: 'center',
  },
  itemBody: { flex: 1, gap: 4 },
  itemPieza: { fontSize: 11, fontFamily: fonts.semiBold, color: '#808A88', letterSpacing: 0.5, textTransform: 'uppercase' },
  itemDesc: { fontSize: 16, fontFamily: fonts.semiBold, color: '#182D28', letterSpacing: -0.5, lineHeight: 22 },

  estadoBadge: {
    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: '#FFFFFF',
  },
  estadoDot: { width: 7, height: 7, borderRadius: 4 },
  estadoText: { fontSize: 13, fontFamily: fonts.semiBold, letterSpacing: -0.3 },

  section: { gap: 10 },
  sectionTitle: { fontSize: 10, fontFamily: fonts.bold, color: '#808A88', letterSpacing: 1.2, textTransform: 'uppercase', paddingHorizontal: 4 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  rowLabel: { fontSize: 14, fontFamily: fonts.regular, color: '#586160' },
  rowValue: { fontSize: 14, fontFamily: fonts.semiBold, color: '#2C3434' },
  rowValueBold: { fontSize: 17, fontFamily: fonts.bold, color: '#182D28', letterSpacing: -0.5 },
  separator: { height: 1, backgroundColor: '#F0F4F3' },
  totalSeparator: { height: 1, backgroundColor: '#C8D0CE', marginTop: 4 },

  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  paymentLabel: { fontSize: 14, fontFamily: fonts.regular, color: '#2C3434' },

  pickupInfo: { fontSize: 13, fontFamily: fonts.regular, color: '#586160', lineHeight: 20, paddingVertical: 14 },
  pickupDeclared: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14 },
  pickupDeclaredText: { fontSize: 13, fontFamily: fonts.medium, color: '#D97706', flex: 1, lineHeight: 18 },
  pickupBtn: {
    backgroundColor: '#F1F4F3', borderRadius: 14, paddingVertical: 12,
    alignItems: 'center', marginBottom: 10,
  },
  pickupBtnText: { fontSize: 13, fontFamily: fonts.semiBold, color: '#586160', letterSpacing: -0.3 },
});
