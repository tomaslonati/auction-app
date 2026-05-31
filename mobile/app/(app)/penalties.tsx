import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { colors, spacing, fonts } from '@/constants/design';

type Penalty = {
  id: string; monto: number; descripcion: string;
  fechaLimite: string; estado: 'pendiente' | 'pagada';
  purchase?: { id: string; montoFinal: number } | null;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function PenaltiesScreen() {
  const router = useRouter();
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPayind] = useState<string | null>(null);

  async function load() {
    const { data } = await api.get<Penalty[]>('/api/users/me/penalties');
    if (data) setPenalties(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handlePay(id: string) {
    Alert.alert('Pagar multa', '¿Confirmás el pago de esta multa?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Pagar', onPress: async () => {
          setPayind(id);
          const { error } = await api.post(`/api/users/me/penalties/${id}/pay`, {});
          setPayind(null);
          if (error) { Alert.alert('Error', typeof error === 'string' ? error : 'No se pudo registrar el pago.'); return; }
          await load();
        },
      },
    ]);
  }

  const pending = penalties.filter((p) => p.estado === 'pendiente');
  const paid = penalties.filter((p) => p.estado === 'pagada');

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color="#171C26" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Multas e impagos</Text>
        <View style={{ width: 24 }} />
      </View>

      {pending.length > 0 && (
        <View style={styles.banner}>
          <Ionicons name="warning-outline" size={20} color="#9F403D" />
          <Text style={styles.bannerText}>Tenés {pending.length} multa{pending.length > 1 ? 's' : ''} pendiente{pending.length > 1 ? 's' : ''}. No podés participar en subastas hasta regularizar tu situación.</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loader}><ActivityIndicator color={colors.textSecondary} /></View>
      ) : (
        <FlatList
          data={penalties}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.card, item.estado === 'pagada' && styles.cardPaid]}>
              <View style={styles.cardHeader}>
                <Ionicons name={item.estado === 'pagada' ? 'checkmark-circle' : 'alert-circle-outline'} size={20} color={item.estado === 'pagada' ? '#22C55E' : '#DC2626'} />
                <Text style={[styles.estadoText, { color: item.estado === 'pagada' ? '#22C55E' : '#DC2626' }]}>
                  {item.estado === 'pagada' ? 'Pagada' : 'Pendiente'}
                </Text>
              </View>
              <Text style={styles.amount}>${Number(item.monto).toLocaleString('es-AR')}</Text>
              <Text style={styles.desc}>{item.descripcion}</Text>
              <Text style={styles.deadline}>Vence: {formatDate(item.fechaLimite)}</Text>
              {item.estado === 'pendiente' && (
                <TouchableOpacity style={styles.payBtn} onPress={() => handlePay(item.id)} disabled={paying === item.id}>
                  {paying === item.id ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.payBtnText}>Registrar pago</Text>}
                </TouchableOpacity>
              )}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="checkmark-circle-outline" size={40} color="#22C55E" />
              <Text style={styles.emptyText}>Sin multas pendientes</Text>
              <Text style={styles.emptySubtext}>Tu cuenta está al día</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.backgroundApp },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: 14 },
  headerTitle: { fontSize: 16, fontFamily: fonts.semiBold, color: '#171C26' },
  banner: { flexDirection: 'row', gap: 10, backgroundColor: '#FEF2F2', margin: spacing.lg, borderRadius: 16, padding: spacing.md, alignItems: 'flex-start' },
  bannerText: { flex: 1, fontSize: 13, fontFamily: fonts.regular, color: '#9F403D', lineHeight: 19 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 40, gap: spacing.md },
  card: { backgroundColor: '#FFF5F5', borderRadius: 20, padding: spacing.lg, gap: 8, borderWidth: 1, borderColor: '#FECACA' },
  cardPaid: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  estadoText: { fontSize: 13, fontFamily: fonts.semiBold },
  amount: { fontSize: 24, fontFamily: fonts.bold, color: '#171C26', letterSpacing: -0.96 },
  desc: { fontSize: 14, fontFamily: fonts.regular, color: '#586160', lineHeight: 20 },
  deadline: { fontSize: 12, fontFamily: fonts.regular, color: '#808A88' },
  payBtn: { backgroundColor: '#DC2626', borderRadius: 32, paddingVertical: 12, alignItems: 'center', marginTop: 6 },
  payBtnText: { fontSize: 15, fontFamily: fonts.semiBold, color: '#FFFFFF' },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 10 },
  emptyText: { fontSize: 18, fontFamily: fonts.semiBold, color: '#171C26' },
  emptySubtext: { fontSize: 14, fontFamily: fonts.regular, color: colors.textSecondary },
});
