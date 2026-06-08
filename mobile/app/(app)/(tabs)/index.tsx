import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Image, Dimensions, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { fonts } from '@/constants/design';

const { width } = Dimensions.get('window');
const CARD_H = 184;

type Auction = {
  id: string; nombre: string; estado: string;
  fechaInicio: string; categoria: string; moneda: string;
  ubicacion?: string;
  items?: { id: string; images?: { url: string }[] }[];
  _count?: { items: number };
};

type ActiveBid = {
  auction: { id: string; nombre: string; categoria: string; moneda: string };
  items: {
    item: { id: string; descripcion: string; numeroPieza: number };
    miMejorPuja: { monto: number; estado: string };
    mejorPujaActual: number | null;
    situacion: 'ganando' | 'ganado' | 'superada' | 'pendiente';
    purchaseId: string | null;
  }[];
};

function SectionHeader({
  super: sup, title, onSeeAll,
}: { super: string; title: string; onSeeAll?: () => void }) {
  return (
    <View style={sh.row}>
      <View style={sh.left}>
        <Text style={sh.sup}>{sup}</Text>
        <Text style={sh.title}>{title}</Text>
      </View>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={sh.seeAll}>VER TODAS</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const sh = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  left: { gap: 4 },
  sup: { fontSize: 11, fontFamily: fonts.medium, color: '#6B6F6F', lineHeight: 15.4 },
  title: { fontSize: 20, fontFamily: fonts.regular, color: '#9EA8A6', letterSpacing: -1, lineHeight: 18 },
  seeAll: { fontSize: 11, fontFamily: fonts.bold, color: '#6B6F6F', textDecorationLine: 'underline', letterSpacing: 0 },
});

function HeroCard({ auction, onPress }: { auction: Auction; onPress: () => void }) {
  const imgUrl = auction.items?.[0]?.images?.[0]?.url;
  return (
    <TouchableOpacity style={hero.card} activeOpacity={0.9} onPress={onPress}>
      {imgUrl ? (
        <Image source={{ uri: imgUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#2C3434' }]} />
      )}
      <View style={hero.overlay} />
      <View style={hero.content}>
        <Text style={hero.title}>{auction.nombre}</Text>
        <View style={hero.footer}>
          <View>
            <Text style={hero.sub}>
              {auction.estado === 'activa' ? 'Finaliza pronto' : 'Próximamente'}
            </Text>
          </View>
          <View style={hero.arrow}>
            <Ionicons name="arrow-forward" size={16} color="#FFF" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const hero = StyleSheet.create({
  card: { width: '100%', height: CARD_H, borderRadius: 32, overflow: 'hidden', justifyContent: 'flex-end', padding: 16 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  content: { gap: 20 },
  title: { fontSize: 16, fontFamily: fonts.semiBold, color: '#FFF', letterSpacing: -0.5 },
  footer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  sub: { fontSize: 15, fontFamily: fonts.semiBold, color: '#FFF', letterSpacing: -0.6 },
  arrow: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
});

function AperturaCard({ auction, onPress }: { auction: Auction; onPress: () => void }) {
  const imgUrl = auction.items?.[0]?.images?.[0]?.url;
  const now = Date.now();
  const end = new Date(auction.fechaInicio).getTime() + 2 * 60 * 60 * 1000;
  const diffMs = end - now;
  const h = Math.floor(diffMs / 3600000);
  const m = Math.floor((diffMs % 3600000) / 60000);
  const timeStr = diffMs > 0 ? `${h}h ${m}m` : 'Finalizada';

  return (
    <TouchableOpacity style={ap.card} activeOpacity={0.85} onPress={onPress}>
      {imgUrl ? (
        <Image source={{ uri: imgUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#2C3434' }]} />
      )}
      <View style={ap.gradientOverlay} />
      {/* Badges */}
      <View style={ap.badges}>
        <View style={ap.badgeDark}><Text style={ap.badgeDarkText}>Activa</Text></View>
        <View style={ap.badgeLight}><Text style={ap.badgeLightText}>{timeStr}</Text></View>
      </View>
      {/* Bottom text */}
      <View style={ap.bottom}>
        <Text style={ap.date}>{new Date(auction.fechaInicio).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}</Text>
        <Text style={ap.name} numberOfLines={1}>{auction.nombre}</Text>
      </View>
    </TouchableOpacity>
  );
}

const ap = StyleSheet.create({
  card: { width: 209, height: 136, borderRadius: 16, overflow: 'hidden' },
  gradientOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'transparent',
    // gradient bottom → black
    borderRadius: 16 },
  badges: { position: 'absolute', top: 13, right: 0, left: 0, flexDirection: 'row', justifyContent: 'flex-end', gap: 4, paddingHorizontal: 13 },
  badgeDark: { backgroundColor: '#5B5F5C', borderRadius: 24, paddingHorizontal: 12, paddingVertical: 6 },
  badgeDarkText: { fontSize: 10, fontFamily: fonts.regular, color: '#FFF', letterSpacing: -0.4 },
  badgeLight: { backgroundColor: '#FFF', borderRadius: 24, paddingHorizontal: 12, paddingVertical: 6 },
  badgeLightText: { fontSize: 10, fontFamily: fonts.regular, color: '#182D28', letterSpacing: -0.4 },
  bottom: { position: 'absolute', bottom: 8, left: 14, gap: 5 },
  date: { fontSize: 11, fontFamily: fonts.medium, color: '#C6C6C6', letterSpacing: -0.33 },
  name: { fontSize: 14, fontFamily: fonts.medium, color: '#FFF', letterSpacing: -0.42, width: 121 },
});

const SITUACION_LABELS: Record<string, string> = {
  ganando: 'GANANDO', ganado: 'GANADO', superada: 'SUPERADA', pendiente: 'PENDIENTE',
};
const SITUACION_COLORS: Record<string, { bg: string; text: string }> = {
  ganando: { bg: '#EEFDF3', text: '#00A63D' },
  ganado: { bg: '#EEFDF3', text: '#00A63D' },
  superada: { bg: '#FEF2F2', text: '#DC2626' },
  pendiente: { bg: '#FFFBEB', text: '#D97706' },
};

function BidCard({ bid, onPress }: {
  bid: ActiveBid['items'][0] & { auctionId: string };
  onPress: () => void;
}) {
  const colors = SITUACION_COLORS[bid.situacion] ?? SITUACION_COLORS.pendiente;
  return (
    <TouchableOpacity style={bc.card} activeOpacity={0.8} onPress={onPress}>
      <View style={bc.img}>
        <Ionicons name="cube-outline" size={28} color="#D0D9D7" />
      </View>
      <View style={bc.body}>
        <View style={bc.top}>
          <View style={[bc.badge, { backgroundColor: colors.bg }]}>
            <Text style={[bc.badgeText, { color: colors.text }]}>
              {SITUACION_LABELS[bid.situacion]}
            </Text>
          </View>
          <Text style={bc.name} numberOfLines={1}>{bid.item.descripcion}</Text>
        </View>
        <Text style={bc.price}>${Number(bid.miMejorPuja.monto).toLocaleString('es-AR')}</Text>
      </View>
    </TouchableOpacity>
  );
}

const bc = StyleSheet.create({
  card: { width: 300, backgroundColor: '#F1F4F3', borderRadius: 16, padding: 16, flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
  img: { width: 72, height: 72, borderRadius: 8, backgroundColor: '#E7ECEB', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  body: { flex: 1, gap: 8 },
  top: { gap: 4 },
  badge: { alignSelf: 'flex-start', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 4 },
  badgeText: { fontSize: 10, fontFamily: fonts.semiBold, letterSpacing: -0.4 },
  name: { fontSize: 14, fontFamily: fonts.semiBold, color: '#2C3434' },
  price: { fontSize: 14, fontFamily: fonts.regular, color: '#2C3434' },
});

export default function HomeScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [featured, setFeatured] = useState<Auction[]>([]);
  const [recent, setRecent] = useState<Auction[]>([]);
  const [bids, setBids] = useState<ActiveBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    const [featuredRes, recentRes, bidsRes] = await Promise.all([
      api.get<Auction[]>('/api/auctions?estado=activa'),
      api.get<Auction[]>('/api/auctions'),
      api.get<ActiveBid[]>('/api/users/me/active-bids'),
    ]);
    if (featuredRes.data) setFeatured(featuredRes.data.slice(0, 3));
    if (recentRes.data) setRecent(recentRes.data.slice(0, 5));
    if (bidsRes.data) setBids(bidsRes.data);
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => { load(); }, []);
  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, []);

  const allBidItems = bids.flatMap((b) =>
    b.items.map((item) => ({ ...item, auctionId: b.auction.id }))
  );

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      {loading ? (
        <View style={s.loader}><ActivityIndicator color="#6B7573" /></View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Greeting */}
          <Text style={s.greeting}>Hola, {user?.nombre ?? 'bienvenido'}</Text>

          {/* Section: Subastas Activas Destacadas */}
          {featured.length > 0 && (
            <View style={s.section}>
              <SectionHeader super="SUBASTAS ACTIVAS" title="Destacadas" />
              <HeroCard
                auction={featured[0]}
                onPress={() => router.push(`/(app)/auction/${featured[0].id}` as never)}
              />
            </View>
          )}

          {/* Section: Últimas aperturas */}
          {recent.length > 0 && (
            <View style={s.section}>
              <SectionHeader super="SUBASTAS" title="Últimas aperturas" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {recent.filter((a) => a.estado === 'activa' || a.estado === 'programada').map((a) => (
                  <AperturaCard
                    key={a.id}
                    auction={a}
                    onPress={() => router.push(`/(app)/auction/${a.id}/catalog` as never)}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Agregar nuevo producto */}
          <TouchableOpacity
            style={s.addCard}
            activeOpacity={0.8}
            onPress={() => router.push('/(app)/consignment/new/item-data' as never)}
          >
            <View style={s.addIconBox}>
              <Ionicons name="add" size={16} color="#182D28" />
            </View>
            <View style={s.addBody}>
              <Text style={s.addTitle}>Agregar nuevo producto</Text>
              <Text style={s.addSub}>Cargá la información de tus productos a subastar</Text>
            </View>
          </TouchableOpacity>

          {/* Section: Ofertas recientes */}
          {allBidItems.length > 0 && (
            <View style={s.section}>
              <SectionHeader
                super="SEGUIMIENTO"
                title="Ofertas recientes"
                onSeeAll={() => router.push('/(app)/history' as never)}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
                {allBidItems.map((bid, i) => (
                  <BidCard
                    key={i}
                    bid={bid}
                    onPress={() => {
                      if (bid.situacion === 'ganado' && bid.purchaseId) {
                        router.push(`/(app)/purchase/${bid.purchaseId}` as never);
                      } else {
                        router.push(`/(app)/auction/${bid.auctionId}/room` as never);
                      }
                    }}
                  />
                ))}
              </ScrollView>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 24, paddingBottom: 120, gap: 40, paddingTop: 8 },
  greeting: { fontSize: 24, fontFamily: fonts.medium, color: '#9EA8A6', letterSpacing: -1.2 },
  section: { gap: 16 },
  addCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 0.5, borderColor: '#CCD3D9', borderRadius: 16, padding: 16,
  },
  addIconBox: {
    width: 40, height: 40, borderRadius: 9, borderWidth: 0.5, borderColor: '#CCD3D9',
    alignItems: 'center', justifyContent: 'center',
  },
  addBody: { flex: 1, gap: 5 },
  addTitle: { fontSize: 14, fontFamily: fonts.semiBold, color: '#182D28', letterSpacing: -0.42 },
  addSub: { fontSize: 12, fontFamily: fonts.regular, color: '#182D28', letterSpacing: -0.36 },
});
