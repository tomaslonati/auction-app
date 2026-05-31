import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Image, TextInput, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { fonts } from '@/constants/design';

type AuctionStatus = 'programada' | 'activa' | 'finalizada' | 'cancelada';
type Auction = {
  id: string; nombre: string; descripcion: string;
  fechaInicio: string; estado: AuctionStatus;
  categoria: string; moneda: string; ubicacion: string;
  canJoin?: boolean;
  items?: { images?: { url: string }[] }[];
  _count: { items: number };
};

const STATUS_LABELS: Record<AuctionStatus, string> = {
  programada: 'próxima',
  activa: 'en subasta',
  finalizada: 'finalizada',
  cancelada: 'cancelada',
};

const CAT_LABELS: Record<string, string> = {
  comun: 'COMÚN', especial: 'ESPECIAL', plata: 'PLATA', oro: 'ORO', platino: 'PLATINO',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

function AuctionCard({ auction, onPress }: { auction: Auction; onPress: () => void }) {
  const imgUrl = auction.items?.[0]?.images?.[0]?.url;

  return (
    <View style={card.container}>
      {/* Image */}
      <View style={card.imageBox}>
        {imgUrl ? (
          <Image source={{ uri: imgUrl }} style={card.image} resizeMode="cover" />
        ) : (
          <View style={[card.image, card.imagePlaceholder]}>
            <Ionicons name="image-outline" size={40} color="#D0D9D7" />
          </View>
        )}
        {/* Status badge */}
        <View style={card.badge}>
          <Text style={card.badgeText}>{STATUS_LABELS[auction.estado]}</Text>
        </View>
      </View>

      {/* Body */}
      <View style={card.body}>
        <Text style={card.title} numberOfLines={2}>{auction.nombre}</Text>
        <Text style={card.subtitle}>{CAT_LABELS[auction.categoria] ?? auction.categoria.toUpperCase()}</Text>

        <View style={card.footer}>
          <View style={card.valueBlock}>
            <Text style={card.valueAmount}>{formatDate(auction.fechaInicio)}</Text>
            <Text style={card.piecesAmount}>{auction._count.items} piezas</Text>
          </View>
          <TouchableOpacity style={card.detailBtn} onPress={onPress} activeOpacity={0.85}>
            <Text style={card.detailBtnText}>Ver subasta</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function AuctionsScreen() {
  const router = useRouter();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [filtered, setFiltered] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AuctionStatus | 'todas'>('todas');

  async function load(silent = false) {
    if (!silent) setLoading(true);
    const { data } = await api.get<Auction[]>('/api/auctions');
    if (data) { setAuctions(data); applyFilters(data, search, statusFilter); }
    setLoading(false);
    setRefreshing(false);
  }

  function applyFilters(data: Auction[], q: string, status: AuctionStatus | 'todas') {
    let result = data;
    if (status !== 'todas') result = result.filter((a) => a.estado === status);
    if (q.trim()) result = result.filter((a) =>
      a.nombre.toLowerCase().includes(q.toLowerCase()) ||
      a.ubicacion?.toLowerCase().includes(q.toLowerCase())
    );
    setFiltered(result);
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { applyFilters(auctions, search, statusFilter); }, [search, statusFilter, auctions]);

  const onRefresh = useCallback(() => { setRefreshing(true); load(true); }, []);

  const STATUS_FILTERS: { label: string; value: AuctionStatus | 'todas' }[] = [
    { label: 'Todas', value: 'todas' },
    { label: 'En curso', value: 'activa' },
    { label: 'Próximas', value: 'programada' },
    { label: 'Finalizadas', value: 'finalizada' },
  ];

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      {/* Title block */}
      <View style={s.titleBlock}>
        <Text style={s.title}>Subastas</Text>
        <Text style={s.subtitle}>Consultá el estado de las subastas activas</Text>
      </View>

      {/* Search */}
      <View style={s.searchRow}>
        <Ionicons name="search-outline" size={16} color="#808A88" />
        <TextInput
          style={s.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar subastas..."
          placeholderTextColor="#808A88"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color="#808A88" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <View style={s.filterRow}>
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[s.filterChip, statusFilter === f.value && s.filterChipActive]}
            onPress={() => setStatusFilter(f.value)}
          >
            <Text style={[s.filterText, statusFilter === f.value && s.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={s.loader}><ActivityIndicator color="#6B7573" /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(a) => a.id}
          renderItem={({ item }) => (
            <AuctionCard
              auction={item}
              onPress={() => router.push(`/(app)/auction/${item.id}/catalog` as never)}
            />
          )}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="calendar-outline" size={32} color="#ABB4B2" />
              <Text style={s.emptyText}>
                {search ? 'Sin resultados para tu búsqueda' : 'No hay subastas disponibles'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  titleBlock: { paddingHorizontal: 24, paddingTop: 72, paddingBottom: 16, gap: 8 },
  title: { fontSize: 24, fontFamily: fonts.medium, color: '#6b7573', letterSpacing: -1.2, lineHeight: 22 },
  subtitle: { fontSize: 16, fontFamily: fonts.regular, color: '#6b6f6f', lineHeight: 22 },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F4F5F5', borderRadius: 32,
    marginHorizontal: 24, paddingHorizontal: 14, height: 44, marginBottom: 0,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: fonts.regular, color: '#1F2937' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 24, marginTop: 8, marginBottom: 0, borderBottomWidth: 1, borderBottomColor: '#E4E4E7' },
  filterChip: { paddingHorizontal: 4, paddingBottom: 10, paddingTop: 8, marginRight: 24, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  filterChipActive: { borderBottomColor: '#5b5f5c' },
  filterText: { fontSize: 16, fontFamily: fonts.regular, color: '#586160', letterSpacing: -0.64 },
  filterTextActive: { color: '#2c3434', fontFamily: fonts.semiBold },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 100, gap: 16 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, fontFamily: fonts.regular, color: '#6B7573', textAlign: 'center' },
});

const card = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF', borderRadius: 32,
    overflow: 'hidden', borderWidth: 1, borderColor: '#F1F4F3',
  },
  imageBox: { position: 'relative' },
  image: { width: '100%', height: 171 },
  imagePlaceholder: { backgroundColor: '#EDEEEF', alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute', top: 15.75, left: 16,
    backgroundColor: '#5B5F5C', borderRadius: 9999,
    paddingHorizontal: 16, paddingVertical: 4,
  },
  badgeText: { fontSize: 10, fontFamily: fonts.bold, color: '#F6F9F4', letterSpacing: -0.4 },
  body: { padding: 32, gap: 4 },
  title: { fontSize: 20, fontFamily: fonts.semiBold, color: '#2C3434', letterSpacing: -0.5, lineHeight: 24 },
  subtitle: { fontSize: 12, fontFamily: fonts.medium, color: '#586160', textTransform: 'uppercase' },
  footer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: 20 },
  valueBlock: { gap: 0 },
  valueLabel: { fontSize: 12, fontFamily: fonts.medium, color: '#586160', textTransform: 'uppercase', lineHeight: 16 },
  valueRow: { flexDirection: 'row', alignItems: 'baseline' },
  valueAmount: { fontSize: 13, fontFamily: fonts.bold, color: '#2C3434', letterSpacing: -0.5 },
  piecesAmount: { fontSize: 24, fontFamily: fonts.bold, color: '#2C3434', letterSpacing: -0.96, lineHeight: 32 },
  valuesCurrency: { fontSize: 12, fontFamily: fonts.medium, color: '#586160', lineHeight: 20 },
  detailBtn: {
    backgroundColor: '#151515', borderRadius: 9999,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  detailBtnText: { fontSize: 14, fontFamily: fonts.semiBold, color: '#F6F9F4' },
});
