import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { colors, spacing, fonts } from '@/constants/design';

type Auction = {
  id: string; nombre: string; descripcion: string;
  fechaInicio: string; fechaFin: string; estado: string;
  categoria: string; moneda: string; ubicacion: string;
  canJoin: boolean;
  rematador: { nombre: string; apellido: string } | null;
  _count: { items: number };
};

function InfoRow({ icon, label, value }: { icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={info.row}>
      <Ionicons name={icon} size={16} color="#808A88" />
      <Text style={info.label}>{label}</Text>
      <Text style={info.value}>{value}</Text>
    </View>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const CAT_LABELS: Record<string, string> = { comun: 'Común', especial: 'Especial', plata: 'Plata', oro: 'Oro', platino: 'Platino' };

export default function AuctionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    api.get<Auction>(`/api/auctions/${id}`).then(({ data }) => {
      if (data) setAuction(data);
      setLoading(false);
    });
  }, [id]);

  async function handleJoin() {
    setJoining(true);
    const { error } = await api.post(`/api/auctions/${id}/join`, {});
    setJoining(false);
    if (error) { Alert.alert('Error', typeof error === 'string' ? error : 'No se pudo ingresar a la subasta.'); return; }
    router.push(`/(app)/auction/${id}/room` as never);
  }

  if (loading) return <View style={styles.loader}><ActivityIndicator color={colors.textSecondary} /></View>;
  if (!auction) return null;

  const isActive = auction.estado === 'activa';

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color="#171C26" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subasta</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.statusBadge, isActive ? styles.statusBadgeActive : styles.statusBadgePending]}>
          {isActive && <View style={styles.liveDot} />}
          <Text style={[styles.statusText, isActive ? styles.statusTextActive : styles.statusTextPending]}>
            {isActive ? 'EN VIVO' : auction.estado === 'programada' ? 'PRÓXIMA' : 'FINALIZADA'}
          </Text>
        </View>

        <Text style={styles.title}>{auction.nombre}</Text>
        <Text style={styles.desc}>{auction.descripcion}</Text>

        <View style={styles.infoCard}>
          <InfoRow icon="calendar-outline" label="Inicio" value={formatDate(auction.fechaInicio)} />
          <InfoRow icon="calendar-outline" label="Cierre" value={formatDate(auction.fechaFin)} />
          <InfoRow icon="location-outline" label="Lugar" value={auction.ubicacion} />
          <InfoRow icon="layers-outline" label="Piezas" value={`${auction._count.items} en catálogo`} />
          <InfoRow icon="trophy-outline" label="Categoría" value={CAT_LABELS[auction.categoria] ?? auction.categoria} />
          <InfoRow icon="cash-outline" label="Moneda" value={auction.moneda === 'dolares' ? 'Dólares (USD)' : 'Pesos (ARS)'} />
          {auction.rematador && (
            <InfoRow icon="person-outline" label="Rematador" value={`${auction.rematador.nombre} ${auction.rematador.apellido}`} />
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.btnSecondary} onPress={() => router.push(`/(app)/auction/${id}/catalog` as never)} activeOpacity={0.8}>
          <Ionicons name="list-outline" size={18} color="#171C26" />
          <Text style={styles.btnSecondaryText}>Ver catálogo</Text>
        </TouchableOpacity>
        {isActive && (
          <TouchableOpacity
            style={[styles.btnPrimary, (!auction.canJoin || joining) && styles.btnDisabled]}
            onPress={handleJoin}
            disabled={!auction.canJoin || joining}
            activeOpacity={0.85}
          >
            {joining ? <ActivityIndicator color="#FFF" /> : (
              <>
                <Ionicons name="enter-outline" size={18} color="#FFF" />
                <Text style={styles.btnPrimaryText}>{auction.canJoin ? 'Ingresar a la subasta' : 'Sin acceso'}</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.backgroundApp },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: 14 },
  headerTitle: { fontSize: 16, fontFamily: fonts.semiBold, color: '#171C26' },
  content: { paddingHorizontal: spacing.lg, paddingBottom: 24, gap: 16 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  statusBadgeActive: { backgroundColor: '#DCFCE7' },
  statusBadgePending: { backgroundColor: '#F0F4F3' },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#22C55E' },
  statusText: { fontSize: 11, fontFamily: fonts.bold, letterSpacing: 0.5 },
  statusTextActive: { color: '#16A34A' },
  statusTextPending: { color: '#586160' },
  title: { fontSize: 24, fontFamily: fonts.semiBold, color: '#171C26', letterSpacing: -0.96, lineHeight: 32 },
  desc: { fontSize: 15, fontFamily: fonts.regular, color: '#586160', lineHeight: 22 },
  infoCard: { backgroundColor: '#F8FBFB', borderRadius: 20, padding: spacing.lg, gap: 12 },
  footer: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: 40, paddingTop: 16 },
  btnSecondary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 32, paddingVertical: 14, backgroundColor: '#E7ECEB', borderWidth: 1.5, borderColor: '#D0D9D7' },
  btnSecondaryText: { fontSize: 15, fontFamily: fonts.semiBold, color: '#171C26' },
  btnPrimary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 32, paddingVertical: 14, backgroundColor: '#151515' },
  btnPrimaryText: { fontSize: 15, fontFamily: fonts.semiBold, color: '#FFFFFF' },
  btnDisabled: { opacity: 0.4 },
});

const info = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontSize: 13, fontFamily: fonts.semiBold, color: '#808A88', width: 80 },
  value: { fontSize: 13, fontFamily: fonts.regular, color: '#1F2937', flex: 1 },
});
