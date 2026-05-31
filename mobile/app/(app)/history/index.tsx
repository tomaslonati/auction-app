import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { spacing, fonts } from '@/constants/design';

type Participation = {
  auction: { id: string; nombre: string; fechaInicio: string; categoria: string; moneda: string };
  bidCount: number; itemsWon: number; totalPaid: number;
};
type Totals = { totalSubastas: number; itemsGanados: number; importeTotalPagado: number };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function HistoryScreen() {
  const router = useRouter();
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'todas' | 'gano' | 'perdio'>('todas');

  async function load(silent = false) {
    if (!silent) setLoading(true);
    const params = filter !== 'todas' ? `?resultado=${filter}` : '';
    const { data } = await api.get<{ participations: Participation[]; totals: Totals }>(
      `/api/users/me/participations${params}`
    );
    if (data) { setParticipations(data.participations); setTotals(data.totals); }
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => { load(); }, [filter]);

  const FILTERS = [
    { label: 'Todas', value: 'todas' as const },
    { label: 'Ganadas', value: 'gano' as const },
    { label: 'Participadas', value: 'perdio' as const },
  ];

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={20} color="#182D28" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Historial</Text>
        <View style={{ width: 20 }} />
      </View>

      {/* Gradient title */}
      <View style={s.titleBlock}>
        <Text style={s.title}>Historial</Text>

        {/* Métricas banner */}
        <TouchableOpacity style={s.metricsBanner} onPress={() => router.push('/(app)/metrics' as never)} activeOpacity={0.8}>
          <View style={s.metricsBannerLeft}>
            <Ionicons name="pulse-outline" size={24} color="#182D28" />
            <Text style={s.metricsBannerText}>Ver Metricas Detalladas</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color="#182D28" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={s.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[s.filterPill, filter === f.value && s.filterPillActive]}
            onPress={() => setFilter(f.value)}
          >
            <Text style={[s.filterText, filter === f.value && s.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={s.loader}><ActivityIndicator color="#6B7573" /></View>
      ) : (
        <FlatList
          data={participations}
          keyExtractor={(p) => p.auction.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} />}
          renderItem={({ item }) => (
            <TouchableOpacity style={s.row} activeOpacity={0.7} onPress={() => router.push(`/(app)/history/${item.auction.id}` as never)}>
              <View style={s.rowIcon}>
                <Ionicons name="storefront-outline" size={24} color="#182D28" />
              </View>
              <View style={s.rowBody}>
                <Text style={s.rowName}>{item.auction.nombre}</Text>
                <Text style={s.rowMeta}>
                  {formatDate(item.auction.fechaInicio)}. {item.bidCount} piezas
                </Text>
                {item.itemsWon > 0 && (
                  <Text style={s.rowWon}>
                    {item.itemsWon} ganada{item.itemsWon > 1 ? 's' : ''}. {item.auction.moneda === 'dolares' ? 'USD' : 'ARS'} {Number(item.totalPaid).toLocaleString('es-AR')}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={14} color="#182D28" />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyText}>No participaste en ninguna subasta todavía</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, height: 64 },
  headerTitle: { fontSize: 14, fontFamily: fonts.semiBold, color: '#182D28', letterSpacing: -0.42 },
  titleBlock: { paddingHorizontal: 24, paddingTop: 4, paddingBottom: 16, gap: 16 },
  title: { fontSize: 24, fontFamily: fonts.regular, color: '#9EA8A6', letterSpacing: -1.2, lineHeight: 22 },
  metricsBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F1F4F3', borderRadius: 16, padding: 16,
  },
  metricsBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  metricsBannerText: { fontSize: 14, fontFamily: fonts.semiBold, color: '#182D28', letterSpacing: -0.42 },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 24, marginBottom: 4 },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 25, backgroundColor: '#FFFFFF' },
  filterPillActive: { backgroundColor: '#111111', borderRadius: 4 },
  filterText: { fontSize: 12, fontFamily: fonts.regular, color: '#182D28', opacity: 0.8, letterSpacing: -0.36 },
  filterTextActive: { color: '#FFFFFF' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingBottom: 100 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16, backgroundColor: '#FFFFFF' },
  rowIcon: { width: 52, height: 52, borderRadius: 9999, backgroundColor: 'rgba(203,208,207,0.38)', alignItems: 'center', justifyContent: 'center' },
  rowBody: { flex: 1, gap: 5 },
  rowName: { fontSize: 14, fontFamily: fonts.semiBold, color: '#182D28', letterSpacing: -0.42 },
  rowMeta: { fontSize: 12, fontFamily: fonts.regular, color: '#182D28', opacity: 0.8, letterSpacing: -0.36 },
  rowWon: { fontSize: 12, fontFamily: fonts.regular, color: '#00A63D', letterSpacing: -0.36 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 14, fontFamily: fonts.regular, color: '#6B7573' },
});
