import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { fonts } from '@/constants/design';

type ItemStatus = 'pendiente' | 'en_subasta' | 'vendida' | 'sin_postor';
type Item = {
  id: string; numeroPieza: number; descripcion: string;
  estado: ItemStatus; esObraArte: boolean; esCompuesto: boolean;
  precioBase?: number;
  images: { url: string; orden: number }[];
};

const STATUS_LABELS: Record<ItemStatus, string> = {
  pendiente: 'PENDIENTE',
  en_subasta: 'EN SUBASTA',
  vendida: 'VENDIDA',
  sin_postor: 'SIN POSTOR',
};

const STATUS_COLORS: Record<ItemStatus, string> = {
  pendiente: '#5B5F5C',
  en_subasta: '#5B5F5C',
  vendida: '#5B5F5C',
  sin_postor: '#5B5F5C',
};

function ItemCard({ item, onPress }: { item: Item; onPress: () => void }) {
  const imgUrl = item.images[0]?.url;

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
        {/* Status badge over image */}
        <View style={[card.badge, { backgroundColor: STATUS_COLORS[item.estado] }]}>
          <Text style={card.badgeText}>{STATUS_LABELS[item.estado]}</Text>
        </View>
      </View>

      {/* Body */}
      <View style={card.body}>
        <Text style={card.title} numberOfLines={2}>{item.descripcion}</Text>
        <Text style={card.subtitle}>PIEZA #{item.numeroPieza}</Text>

        <View style={card.footer}>
          {item.precioBase != null ? (
            <View style={card.priceBlock}>
              <Text style={card.priceLabel}>VALOR BASE</Text>
              <View style={card.priceRow}>
                <Text style={card.priceAmount}>${Number(item.precioBase).toLocaleString('es-AR')} </Text>
                <Text style={card.priceCurrency}>ARS</Text>
              </View>
            </View>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          <TouchableOpacity style={card.detailBtn} onPress={onPress} activeOpacity={0.85}>
            <Text style={card.detailBtnText}>Ver detalle</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function CatalogScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [auctionName, setAuctionName] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ItemStatus | 'todas'>('todas');

  useEffect(() => {
    api.get<{ nombre: string }>(`/api/auctions/${id}`).then(({ data }) => {
      if (data) setAuctionName(data.nombre);
    });
  }, [id]);

  useEffect(() => {
    const params = filter !== 'todas' ? `?estado=${filter}` : '';
    setLoading(true);
    api.get<Item[]>(`/api/auctions/${id}/catalog${params}`).then(({ data }) => {
      if (data) setItems(data);
      setLoading(false);
    });
  }, [id, filter]);

  const FILTERS: { label: string; value: ItemStatus | 'todas' }[] = [
    { label: 'Todas', value: 'todas' },
    { label: 'En subasta', value: 'en_subasta' },
    { label: 'Pendiente', value: 'pendiente' },
    { label: 'Vendida', value: 'vendida' },
  ];

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={s.headerBtn}>
          <Ionicons name="chevron-back" size={16} color="#18181B" />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{auctionName || 'Catálogo'}</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Title */}
      <View style={s.titleBlock}>
        <Text style={s.title}>Catálogo de piezas</Text>
        <Text style={s.subtitle}>Consultá el estado de las piezas en subasta</Text>
      </View>

      {/* Filters */}
      <View style={s.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[s.filterChip, filter === f.value && s.filterChipActive]}
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
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ItemCard
              item={item}
              onPress={() => router.push(`/(app)/auction/${id}/room` as never)}
            />
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="cube-outline" size={32} color="#ABB4B2" />
              <Text style={s.emptyText}>No hay piezas en este catálogo</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, height: 64,
    backgroundColor: '#FFFFFF',
  },
  headerBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontFamily: fonts.semiBold, color: '#18181B', letterSpacing: -0.5 },
  titleBlock: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16, gap: 8 },
  title: { fontSize: 24, fontFamily: fonts.medium, color: '#6b7573', letterSpacing: -1.2, lineHeight: 22 },
  subtitle: { fontSize: 16, fontFamily: fonts.regular, color: '#6b6f6f', lineHeight: 22 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 24, marginBottom: 0, borderBottomWidth: 1, borderBottomColor: '#E4E4E7' },
  filterChip: { paddingHorizontal: 4, paddingBottom: 10, paddingTop: 8, marginRight: 24, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  filterChipActive: { borderBottomColor: '#5b5f5c' },
  filterText: { fontSize: 16, fontFamily: fonts.regular, color: '#586160', letterSpacing: -0.64 },
  filterTextActive: { color: '#2c3434', fontFamily: fonts.semiBold },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 100, gap: 16 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, fontFamily: fonts.regular, color: '#6B7573' },
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
    borderRadius: 9999, paddingHorizontal: 16, paddingVertical: 4,
  },
  badgeText: { fontSize: 10, fontFamily: fonts.bold, color: '#F6F9F4', letterSpacing: -0.4, textTransform: 'lowercase' },
  body: { padding: 32, gap: 4 },
  title: { fontSize: 20, fontFamily: fonts.semiBold, color: '#2C3434', letterSpacing: -0.5, lineHeight: 24 },
  subtitle: { fontSize: 12, fontFamily: fonts.medium, color: '#586160', textTransform: 'uppercase' },
  footer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: 20 },
  priceBlock: { gap: 0 },
  priceLabel: { fontSize: 12, fontFamily: fonts.medium, color: '#586160', textTransform: 'uppercase', lineHeight: 16 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline' },
  priceAmount: { fontSize: 24, fontFamily: fonts.bold, color: '#2C3434', letterSpacing: -0.96, lineHeight: 32 },
  priceCurrency: { fontSize: 12, fontFamily: fonts.medium, color: '#586160', lineHeight: 20 },
  detailBtn: {
    backgroundColor: '#151515', borderRadius: 9999,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  detailBtnText: { fontSize: 14, fontFamily: fonts.semiBold, color: '#F6F9F4' },
});
