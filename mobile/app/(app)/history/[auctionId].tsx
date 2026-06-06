import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { colors, spacing, fonts } from '@/constants/design';

type Bid = { id: string; monto: number; estado: string; createdAt: string };
type Purchase = { id: string; montoFinal: number; comision: number; costoEnvio: number; estadoPago: string } | undefined;
type ItemHistory = { item: { id: string; descripcion: string; numeroPieza: number }; bids: Bid[]; won: boolean; purchase: Purchase };

export default function HistoryDetailScreen() {
  const { auctionId } = useLocalSearchParams<{ auctionId: string }>();
  const router = useRouter();
  const [items, setItems] = useState<ItemHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<ItemHistory[]>(`/api/users/me/participations/${auctionId}`).then(({ data }) => {
      if (data) setItems(data);
      setLoading(false);
    });
  }, [auctionId]);

  if (loading) return <View style={styles.loader}><ActivityIndicator color={colors.textSecondary} /></View>;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color="#171C26" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle de participación</Text>
        <View style={{ width: 24 }} />
      </View>

      <SectionList
        sections={items.map((i) => ({ title: i, data: i.bids }))}
        keyExtractor={(bid) => bid.id}
        contentContainerStyle={styles.list}
        renderSectionHeader={({ section: { title: item } }) => (
          <View style={[styles.itemHeader, item.won && styles.itemHeaderWon]}>
            <View style={styles.itemHeaderLeft}>
              <Text style={styles.itemNum}>Pieza #{item.item.numeroPieza}</Text>
              <Text style={styles.itemDesc} numberOfLines={1}>{item.item.descripcion}</Text>
            </View>
            <View style={[styles.resultBadge, { backgroundColor: item.won ? '#DCFCE7' : '#F3F4F6' }]}>
              <Text style={[styles.resultBadgeText, { color: item.won ? '#16A34A' : '#6B7280' }]}>
                {item.won ? 'GANADA' : 'NO GANADA'}
              </Text>
            </View>
          </View>
        )}
        renderSectionFooter={({ section: { title: item } }) => item.won && item.purchase ? (
          <View style={styles.purchaseBox}>
            <Text style={styles.purchaseTitle}>Detalle de compra</Text>
            <View style={styles.purchaseRow}><Text style={styles.purchaseLabel}>Monto final</Text><Text style={styles.purchaseValue}>${Number(item.purchase.montoFinal).toLocaleString('es-AR')}</Text></View>
            <View style={styles.purchaseRow}><Text style={styles.purchaseLabel}>Comisión</Text><Text style={styles.purchaseValue}>${Number(item.purchase.comision).toLocaleString('es-AR')}</Text></View>
            <View style={styles.purchaseRow}><Text style={styles.purchaseLabel}>Costo de envío</Text><Text style={styles.purchaseValue}>${Number(item.purchase.costoEnvio).toLocaleString('es-AR')}</Text></View>
            <View style={styles.purchaseRow}><Text style={styles.purchaseLabel}>Estado</Text><Text style={styles.purchaseValue}>{item.purchase.estadoPago}</Text></View>
            <TouchableOpacity
              style={styles.purchaseDetailBtn}
              onPress={() => router.push(`/(app)/purchase/${item.purchase!.id}` as never)}
              activeOpacity={0.7}
            >
              <Text style={styles.purchaseDetailBtnText}>Ver detalle de compra</Text>
              <Ionicons name="chevron-forward" size={14} color="#1D4ED8" />
            </TouchableOpacity>
          </View>
        ) : null}
        renderItem={({ item: bid, index }) => (
          <View style={styles.bidRow}>
            <Text style={styles.bidIndex}>#{index + 1}</Text>
            <Text style={styles.bidAmount}>${Number(bid.monto).toLocaleString('es-AR')}</Text>
            <Text style={[styles.bidStatus, { color: bid.estado === 'confirmada' ? '#22C55E' : '#808A88' }]}>{bid.estado}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No hay registros para esta subasta</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.backgroundApp },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: 14 },
  headerTitle: { fontSize: 16, fontFamily: fonts.semiBold, color: '#171C26' },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 40, gap: 4 },
  itemHeader: { backgroundColor: '#F8FBFB', borderRadius: 16, padding: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md },
  itemHeaderWon: { backgroundColor: '#F0FDF4' },
  itemHeaderLeft: { flex: 1, gap: 2 },
  itemNum: { fontSize: 12, fontFamily: fonts.semiBold, color: '#808A88' },
  itemDesc: { fontSize: 15, fontFamily: fonts.semiBold, color: '#171C26' },
  resultBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  resultBadgeText: { fontSize: 10, fontFamily: fonts.bold, letterSpacing: 0.5 },
  bidRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: '#F0F4F3', gap: 12 },
  bidIndex: { fontSize: 12, fontFamily: fonts.semiBold, color: '#D0D9D7', width: 28 },
  bidAmount: { flex: 1, fontSize: 15, fontFamily: fonts.semiBold, color: '#171C26' },
  bidStatus: { fontSize: 12, fontFamily: fonts.regular },
  purchaseBox: { backgroundColor: '#EFF6FF', borderRadius: 14, padding: spacing.md, gap: 8, marginTop: 4, marginBottom: spacing.md },
  purchaseTitle: { fontSize: 13, fontFamily: fonts.semiBold, color: '#1D4ED8', marginBottom: 4 },
  purchaseRow: { flexDirection: 'row', justifyContent: 'space-between' },
  purchaseLabel: { fontSize: 13, fontFamily: fonts.regular, color: '#586160' },
  purchaseValue: { fontSize: 13, fontFamily: fonts.semiBold, color: '#1F2937' },
  purchaseDetailBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(29,78,216,0.15)',
  },
  purchaseDetailBtnText: { fontSize: 13, fontFamily: fonts.semiBold, color: '#1D4ED8', letterSpacing: -0.3 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 15, fontFamily: fonts.regular, color: colors.textSecondary },
});
