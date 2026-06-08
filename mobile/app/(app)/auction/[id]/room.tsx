import { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, Modal, Image,
  Dimensions, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/store';
import { fonts } from '@/constants/design';

const { width } = Dimensions.get('window');
const IMG_H = 220;

type Bid = { id: string; monto: number; estado: string; createdAt: string; userId?: string };
type Item = {
  id: string; numeroPieza: number; descripcion: string;
  precioBase: number; artistaDisenador?: string; esObraArte?: boolean;
  images: { url: string; orden: number }[];
  components: { id: string; descripcion: string; orden: number }[];
};
type CurrentItemData = { item: Item; highestBid: Bid | null; precioBase: number };
type Auction = {
  id: string; nombre: string; categoria: string; moneda: string;
  estado: string; fechaFin: string | null;
};
type PaymentMethod = {
  id: string; tipo: string; estado: string; esInternacional: boolean;
  bankAccount?: { banco: string; numeroCuenta: string } | null;
  creditCard?: { marca: string; ultimosCuatro: string } | null;
  certifiedCheck?: { montoDisponible: number } | null;
};

function methodLabel(m: PaymentMethod) {
  if (m.tipo === 'cuenta_bancaria' && m.bankAccount) return `${m.bankAccount.banco}`;
  if (m.tipo === 'tarjeta_credito' && m.creditCard) return `${m.creditCard.marca} ****${m.creditCard.ultimosCuatro}`;
  if (m.tipo === 'cheque_certificado') return 'Cheque certificado';
  return 'Medio de pago';
}

function useServerTimer(fechaFin: string | null): string {
  const calcRemaining = () =>
    fechaFin ? Math.max(0, Math.floor((new Date(fechaFin).getTime() - Date.now()) / 1000)) : 0;

  const [remaining, setRemaining] = useState(calcRemaining);

  useEffect(() => {
    if (!fechaFin) return;
    setRemaining(calcRemaining());
    const id = setInterval(() => setRemaining(calcRemaining()), 1000);
    return () => clearInterval(id);
  }, [fechaFin]);

  if (!fechaFin) return '--:--:--';
  if (remaining === 0) return '00:00:00';
  const h = String(Math.floor(remaining / 3600)).padStart(2, '0');
  const m = String(Math.floor((remaining % 3600) / 60)).padStart(2, '0');
  const s = String(remaining % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function SpecCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={spec.card}>
      <Text style={spec.label}>{label}</Text>
      <Text style={spec.value}>{value}</Text>
    </View>
  );
}

const spec = StyleSheet.create({
  card: { flex: 1, backgroundColor: '#F1F4F3', borderRadius: 6, padding: 16, gap: 4, minWidth: '47%' },
  label: { fontSize: 10, fontFamily: fonts.regular, color: '#747C7C', letterSpacing: 1, textTransform: 'uppercase' },
  value: { fontSize: 16, fontFamily: fonts.semiBold, color: '#2C3434', lineHeight: 19 },
});

function BidHistoryRow({ bid, isTop }: { bid: Bid; isTop: boolean }) {
  const initials = bid.userId ? bid.userId.slice(0, 3).toUpperCase() : '???';
  const masked = `${initials[0]}**${initials[2] ?? ''}`;
  const timeAgo = (() => {
    const diff = Date.now() - new Date(bid.createdAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `hace ${mins} min${mins !== 1 ? 's' : ''}`;
    return `hace ${Math.floor(mins / 60)} hora${Math.floor(mins / 60) !== 1 ? 's' : ''}`;
  })();
  return (
    <View style={bh.row}>
      <View style={bh.left}>
        <View style={bh.avatar}>
          <Text style={bh.avatarText}>{masked}</Text>
        </View>
        <Text style={bh.username}>Usuario {masked.toLowerCase()}</Text>
      </View>
      <View style={bh.right}>
        <Text style={[bh.amount, !isTop && { color: '#ABB4B3' }]}>${Number(bid.monto).toLocaleString('es-AR')}</Text>
        <Text style={bh.time}>{timeAgo}</Text>
      </View>
    </View>
  );
}

const bh = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 13, borderBottomWidth: 1, borderBottomColor: 'rgba(171,180,179,0.1)' },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(91,95,92,0.1)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 10, fontFamily: fonts.bold, color: '#5B5F5C', textAlign: 'center' },
  username: { fontSize: 14, fontFamily: fonts.medium, color: '#2C3434' },
  right: { alignItems: 'flex-end', gap: 0 },
  amount: { fontSize: 14, fontFamily: fonts.bold, color: '#2C3434', textAlign: 'right' },
  time: { fontSize: 10, fontFamily: fonts.regular, color: '#747C7C', textAlign: 'right', lineHeight: 20 },
});

type AdjudicationResult = {
  won: boolean;
  purchaseId: string;
  itemDesc: string;
  montoFinal: number;
  comision: number;
  costoEnvio: number;
};

type MyPurchase = {
  id: string;
  itemDesc: string;
  montoFinal: number;
  comision: number;
  costoEnvio: number;
  estadoPago: string;
};

type ParticipationItem = {
  item: { id: string; descripcion: string; numeroPieza: string };
  won: boolean;
  purchase?: { id: string; montoFinal: number; comision: number; costoEnvio: number; estadoPago: string };
};

export default function AuctionRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

  const [auction, setAuction] = useState<Auction | null>(null);
  const [currentData, setCurrentData] = useState<CurrentItemData | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOffer, setShowOffer] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [adjudication, setAdjudication] = useState<AdjudicationResult | null>(null);
  const [hasPendingPenalty, setHasPendingPenalty] = useState(false);
  const [myPurchase, setMyPurchase] = useState<MyPurchase | null>(null);
  const fallbackRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentItemDescRef = useRef<string>('');

  const timer = useServerTimer(auction?.fechaFin ?? null);
  const isRoomEnded = auction?.estado === 'finalizada' || auction?.estado === 'cancelada';

  useEffect(() => { if (isRoomEnded) setShowOffer(false); }, [isRoomEnded]);

  useEffect(() => {
    if (!isRoomEnded) return;
    api.get<ParticipationItem[]>(`/api/users/me/participations/${id}`).then(({ data }) => {
      if (!data) return;
      const won = data.find(p => p.won && p.purchase);
      if (won?.purchase) {
        setMyPurchase({
          id: won.purchase.id,
          itemDesc: won.item.descripcion,
          montoFinal: Number(won.purchase.montoFinal),
          comision: Number(won.purchase.comision),
          costoEnvio: Number(won.purchase.costoEnvio),
          estadoPago: won.purchase.estadoPago,
        });
      }
    });
  }, [isRoomEnded, id]);

  const poll = useCallback(async () => {
    const [itemRes, auctionRes] = await Promise.all([
      api.get<CurrentItemData>(`/api/auctions/${id}/current-item`),
      api.get<Auction>(`/api/auctions/${id}`),
    ]);
    setCurrentData(itemRes.data);
    if (itemRes.data) currentItemDescRef.current = itemRes.data.item.descripcion;
    if (auctionRes.data) setAuction(auctionRes.data);
    if (itemRes.data) {
      const { data: bidData } = await api.get<Bid[]>(`/api/auctions/${id}/catalog/${itemRes.data.item.id}/bids`);
      if (bidData) setBids(bidData.slice().sort((a, b) => Number(b.monto) - Number(a.monto)).slice(0, 3));
    } else {
      setBids([]);
    }
  }, [id]);

  useEffect(() => {
    async function init() {
      const [auctionRes, methodsRes, penaltiesRes] = await Promise.all([
        api.get<Auction>(`/api/auctions/${id}`),
        api.get<PaymentMethod[]>('/api/users/me/payment-methods'),
        api.get<{ estado: string }[]>('/api/users/me/penalties'),
      ]);
      if (auctionRes.data) setAuction(auctionRes.data);
      if (methodsRes.data) {
        const verified = methodsRes.data.filter((m) => m.estado === 'verificado');
        setMethods(verified);
        if (verified.length > 0) setSelectedMethod(verified[0]);
      }
      if (penaltiesRes.data) {
        setHasPendingPenalty(penaltiesRes.data.some((p) => p.estado === 'pendiente'));
      }
      await poll();
      setLoading(false);
    }
    init();

    // Supabase Realtime — escucha cambios en tiempo real para esta subasta
    const channel = supabase
      .channel(`auction-room:${id}`)
      // Nueva puja enviada → refresca historial
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bids', filter: `subasta_id=eq.${id}` },
        () => { poll(); }
      )
      // Puja confirmada/superada/rechazada → actualiza puja máxima visible
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bids', filter: `subasta_id=eq.${id}` },
        () => { poll(); }
      )
      // Ítem cambia de estado (pendiente→en_subasta o en_subasta→vendido) → avanza al siguiente ítem
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'items', filter: `subasta_id=eq.${id}` },
        () => { poll(); }
      )
      // Subasta finalizada/cancelada → actualiza estado de la subasta
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'auctions', filter: `id=eq.${id}` },
        (payload) => {
          const rec = payload.new as Auction;
          setAuction((prev) => prev ? { ...prev, estado: rec.estado, fechaFin: rec.fechaFin } : prev);
        }
      )
      // Compra generada → muestra modal de adjudicación y refresca
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'purchases', filter: `subastaId=eq.${id}` },
        (payload) => {
          const rec = payload.new as {
            id: string;
            compradorUserId: string;
            montoFinal: number;
            comision: number;
            costoEnvio: number;
          };
          setAdjudication({
            won: rec.compradorUserId === user?.id,
            purchaseId: rec.id,
            itemDesc: currentItemDescRef.current,
            montoFinal: rec.montoFinal,
            comision: rec.comision,
            costoEnvio: rec.costoEnvio,
          });
          // El ítem UPDATE ya va a disparar poll(), pero dejamos el timeout como respaldo
          setTimeout(() => poll(), 1500);
        }
      )
      .subscribe();

    // Polling de respaldo cada 8 s (por si Realtime no está habilitado en la tabla)
    fallbackRef.current = setInterval(poll, 8000);

    return () => {
      supabase.removeChannel(channel);
      if (fallbackRef.current) clearInterval(fallbackRef.current);
    };
  }, [id]);

  function handleOpenOffer() {
    if (hasPendingPenalty) {
      Alert.alert(
        'Multa pendiente',
        'Tenés multas pendientes de pago. Debés regularizarlas antes de poder pujar.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Ir a multas', onPress: () => router.push('/(app)/penalties' as never) },
        ]
      );
      return;
    }
    setShowOffer(true);
  }

  async function handleLeave() {
    Alert.alert('Salir de la subasta', '¿Querés abandonar la sala?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir', style: 'destructive',
        onPress: async () => { await api.post(`/api/auctions/${id}/leave`, {}); router.back(); },
      },
    ]);
  }

  async function handleConfirmOffer() {
    if (!currentData || !selectedMethod) return;
    const montoNum = parseFloat(offerAmount.replace(/\./g, '').replace(',', '.'));
    if (isNaN(montoNum) || montoNum <= 0) { Alert.alert('Error', 'Monto inválido'); return; }

    const { precioBase, highestBid } = currentData;
    const currentBid = highestBid ? Number(highestBid.monto) : Number(precioBase);
    const minBid = currentBid + Number(precioBase) * 0.01;
    const isNoLimit = ['oro', 'platino'].includes(auction?.categoria ?? '');
    const maxBid = currentBid + Number(precioBase) * 0.20;

    if (montoNum < minBid) {
      Alert.alert('Puja insuficiente', `El mínimo es $${minBid.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`);
      return;
    }
    if (!isNoLimit && montoNum > maxBid) {
      Alert.alert('Puja excede el máximo', `El máximo es $${maxBid.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`);
      return;
    }

    setSubmitting(true);
    const { error } = await api.post(`/api/auctions/${id}/bids`, {
      itemId: currentData.item.id,
      paymentMethodId: selectedMethod.id,
      monto: montoNum,
    });
    setSubmitting(false);
    if (error) { Alert.alert('Error', typeof error === 'string' ? error : 'No se pudo enviar la puja.'); return; }
    setShowOffer(false);
    setOfferAmount('');
    await poll();
  }

  if (loading) return (
    <LinearGradient colors={['#E8EDEC', '#ABB4B2']} style={s.loaderBg}>
      <ActivityIndicator color="#586160" />
    </LinearGradient>
  );

  if (!currentData) {
    return (
      <LinearGradient colors={['#E8EDEC', '#ABB4B2']} style={s.loaderBg}>
        <View style={s.noItemBox}>
          <Ionicons
            name={isRoomEnded ? (myPurchase ? 'trophy' : 'checkmark-circle-outline') : 'hourglass-outline'}
            size={40}
            color={myPurchase ? '#856404' : '#586160'}
          />
          <Text style={s.noItemText}>
            {isRoomEnded ? 'La subasta ha finalizado' : 'Esperando la siguiente pieza…'}
          </Text>

          {myPurchase && (
            <View style={s.winnerCard}>
              <Text style={s.winnerTitle}>¡Ganaste una pieza!</Text>
              <Text style={s.winnerDesc} numberOfLines={2}>{myPurchase.itemDesc}</Text>
              <View style={s.winnerBreakdown}>
                <View style={s.winnerRow}>
                  <Text style={s.winnerLabel}>Monto pujado</Text>
                  <Text style={s.winnerValue}>${myPurchase.montoFinal.toLocaleString('es-AR')}</Text>
                </View>
                <View style={s.winnerRow}>
                  <Text style={s.winnerLabel}>Comisión</Text>
                  <Text style={s.winnerValue}>${myPurchase.comision.toLocaleString('es-AR')}</Text>
                </View>
                <View style={s.winnerRow}>
                  <Text style={s.winnerLabel}>Costo de envío</Text>
                  <Text style={s.winnerValue}>
                    {myPurchase.costoEnvio === 0 ? 'Sin cargo' : `$${myPurchase.costoEnvio.toLocaleString('es-AR')}`}
                  </Text>
                </View>
                <View style={[s.winnerRow, s.winnerTotalRow]}>
                  <Text style={s.winnerTotalLabel}>TOTAL A PAGAR</Text>
                  <Text style={s.winnerTotalValue}>
                    ${(myPurchase.montoFinal + myPurchase.comision + myPurchase.costoEnvio).toLocaleString('es-AR')}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={s.winnerBtn}
                onPress={() => router.push(`/(app)/purchase/${myPurchase.id}` as never)}
                activeOpacity={0.85}
              >
                <Text style={s.winnerBtnText}>Ver detalle de compra</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Text style={s.backBtnText}>Salir</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  const { item, highestBid, precioBase } = currentData;
  const currentBid = highestBid ? Number(highestBid.monto) : Number(precioBase);
  const fee = currentBid * 0.025;
  const isNoLimit = ['oro', 'platino'].includes(auction?.categoria ?? '');
  const minBid = currentBid + Number(precioBase) * 0.01;
  const maxBid = currentBid + Number(precioBase) * 0.20;

  const offerNum = parseFloat(offerAmount.replace(/\./g, '').replace(',', '.'));
  const offerTooLow = !isNaN(offerNum) && offerNum < minBid;
  const offerTooHigh = !isNaN(offerNum) && !isNoLimit && offerNum > maxBid;
  const offerValid = !isNaN(offerNum) && offerNum > 0 && !offerTooLow && !offerTooHigh;

  const imgUrl = item.images[0]?.url;

  return (
    <LinearGradient colors={['#E8EDEC', '#ABB4B2']} style={s.screen}>
      {/* Hero image + back */}
      <View style={{ height: IMG_H + insets.top, position: 'relative' }}>
        {imgUrl ? (
          <Image source={{ uri: imgUrl }} style={[StyleSheet.absoluteFill, { height: IMG_H + insets.top }]} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#3A3C3C', height: IMG_H + insets.top }]} />
        )}
        <TouchableOpacity style={[s.backFloating, { top: insets.top + 8 }]} onPress={handleLeave} hitSlop={12}>
          <Ionicons name="chevron-back" size={16} color="#FFF" />
        </TouchableOpacity>

        {/* Timer overlay */}
        {!isRoomEnded && (
          <View style={[s.timerOverlay, { top: insets.top + 8 }]}>
            <Text style={s.timerLabel}>FINALIZA EN</Text>
            <Text style={s.timerValue}>{timer}</Text>
          </View>
        )}
      </View>

      {/* Content card */}
      <ScrollView
        style={{ marginTop: -40, flex: 1 }}
        contentContainerStyle={s.cardContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.contentCanvas}>
          {/* Title */}
          <View style={s.titleBlock}>
            <Text style={s.auctionLive}>
              {auction?.estado === 'finalizada' || auction?.estado === 'cancelada' ? 'SUBASTA FINALIZADA' : 'SUBASTA EN VIVO'}
            </Text>
            <Text style={s.itemTitle}>{item.descripcion}</Text>
            {item.artistaDisenador && (
              <Text style={s.itemSub}>{item.artistaDisenador} • Pieza #{item.numeroPieza}</Text>
            )}
          </View>

          {/* Technical Specs */}
          <View style={s.specsSection}>
            <Text style={s.sectionLabel}>ESPECIFICACIONES TÉCNICAS</Text>
            <View style={s.specsGrid}>
              <SpecCard label="PIEZA" value={`#${item.numeroPieza}`} />
              <SpecCard label="PRECIO BASE" value={`$${Number(precioBase).toLocaleString('es-AR')}`} />
              {item.components.slice(0, 2).map((c, i) => (
                <SpecCard key={i} label={`COMPONENTE ${i + 1}`} value={c.descripcion} />
              ))}
            </View>
          </View>

          {/* Provenance */}
          <View style={s.provenanceSection}>
            <Text style={s.sectionLabel}>PROCEDENCIA Y DETALLES</Text>
            <Text style={s.provenanceText}>{item.descripcion}</Text>
          </View>

          {/* Current Bid Card */}
          <View style={s.bidCard}>
            <View style={s.bidCardTop}>
              <Text style={s.currentBidLabel}>{isRoomEnded ? 'PRECIO FINAL' : 'PUJA ACTUAL'}</Text>
              <Text style={s.currentBidAmount}>${currentBid.toLocaleString('es-AR')}</Text>
            </View>

            {!isRoomEnded && highestBid?.userId === user?.id && (
              <View style={s.leadingBanner}>
                <Ionicons name="checkmark-circle" size={14} color="#00A63D" />
                <Text style={s.leadingBannerText}>TU PUJA LIDERA</Text>
              </View>
            )}

            {isRoomEnded ? (
              <View style={s.endedRow}>
                <Ionicons name="flag-outline" size={13} color="#586160" />
                <Text style={s.reserveText}>
                  {auction?.estado === 'cancelada' ? 'SUBASTA CANCELADA' : 'SUBASTA FINALIZADA'}
                </Text>
              </View>
            ) : (
              <>
                {/* Rango de pujas */}
                <View style={s.rangeRow}>
                  <View style={s.rangeItem}>
                    <Text style={s.rangeLabel}>PUJA MÍNIMA</Text>
                    <Text style={s.rangeValue}>${minBid.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</Text>
                  </View>
                  <View style={s.rangeDivider} />
                  <View style={s.rangeItem}>
                    <Text style={s.rangeLabel}>PUJA MÁXIMA</Text>
                    <Text style={s.rangeValue}>
                      {isNoLimit ? 'Sin límite' : `$${maxBid.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`}
                    </Text>
                  </View>
                </View>

                <View style={s.reserveRow}>
                  <Ionicons name="checkmark-circle-outline" size={13} color="#586160" />
                  <Text style={s.reserveText}>PRECIO DE RESERVA ALCANZADO</Text>
                </View>
                <View style={s.timerInCard}>
                  <Text style={s.timerLabel}>FINALIZA EN</Text>
                  <Text style={s.timerValue}>{timer}</Text>
                </View>
              </>
            )}
          </View>

          {/* Banner de ganador — subasta finalizada y el usuario ganó */}
          {isRoomEnded && myPurchase && (
            <View style={s.winnerCard}>
              <View style={s.winnerIconRow}>
                <Ionicons name="trophy" size={22} color="#856404" />
                <Text style={s.winnerTitle}>¡Ganaste esta pieza!</Text>
              </View>
              <View style={s.winnerBreakdown}>
                <View style={s.winnerRow}>
                  <Text style={s.winnerLabel}>Monto pujado</Text>
                  <Text style={s.winnerValue}>${myPurchase.montoFinal.toLocaleString('es-AR')}</Text>
                </View>
                <View style={s.winnerRow}>
                  <Text style={s.winnerLabel}>Comisión</Text>
                  <Text style={s.winnerValue}>${myPurchase.comision.toLocaleString('es-AR')}</Text>
                </View>
                <View style={s.winnerRow}>
                  <Text style={s.winnerLabel}>Costo de envío</Text>
                  <Text style={s.winnerValue}>
                    {myPurchase.costoEnvio === 0 ? 'Sin cargo' : `$${myPurchase.costoEnvio.toLocaleString('es-AR')}`}
                  </Text>
                </View>
                <View style={[s.winnerRow, s.winnerTotalRow]}>
                  <Text style={s.winnerTotalLabel}>TOTAL A PAGAR</Text>
                  <Text style={s.winnerTotalValue}>
                    ${(myPurchase.montoFinal + myPurchase.comision + myPurchase.costoEnvio).toLocaleString('es-AR')}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={s.winnerBtn}
                onPress={() => router.push(`/(app)/purchase/${myPurchase.id}` as never)}
                activeOpacity={0.85}
              >
                <Text style={s.winnerBtnText}>Ver detalle de compra</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Bid History */}
          {bids.length > 0 && (
            <View style={s.historyCard}>
              <Text style={s.sectionLabel}>HISTORIAL DE PUJAS</Text>
              <View style={s.historyList}>
                {bids.map((b, i) => <BidHistoryRow key={b.id} bid={b} isTop={i === 0} />)}
              </View>
              <TouchableOpacity style={s.viewAllBtn}>
                <Text style={s.viewAllText}>VER TODAS LAS PUJAS</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: isRoomEnded ? 32 : 100 }} />
        </View>
      </ScrollView>

      {/* Bottom button — solo en subastas activas */}
      {!isRoomEnded && (
        <View style={[s.footer, { paddingBottom: insets.bottom + 16 }]}>
          {hasPendingPenalty && (
            <TouchableOpacity
              style={s.penaltyBanner}
              onPress={() => router.push('/(app)/penalties' as never)}
              activeOpacity={0.8}
            >
              <Ionicons name="warning-outline" size={16} color="#92400E" />
              <Text style={s.penaltyBannerText}>Multa pendiente — no podés pujar</Text>
              <Text style={s.penaltyBannerLink}>Regularizar →</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[s.offerBtn, hasPendingPenalty && s.offerBtnDisabled]}
            onPress={handleOpenOffer}
            activeOpacity={0.9}
          >
            <Text style={s.offerBtnText}>Crear oferta</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* P-19: Adjudicación — resultado de la puja */}
      <Modal visible={!!adjudication} transparent animationType="fade" onRequestClose={() => setAdjudication(null)}>
        <View style={adj.overlay}>
          <View style={[adj.card, { paddingBottom: insets.bottom + 24 }]}>
            {adjudication?.won ? (
              <>
                <View style={adj.iconWon}>
                  <Ionicons name="trophy" size={36} color="#856404" />
                </View>
                <Text style={adj.titleWon}>¡Ganaste la pieza!</Text>
                <Text style={adj.subtitle} numberOfLines={2}>{adjudication.itemDesc}</Text>

                <View style={adj.breakdown}>
                  <View style={adj.breakdownRow}>
                    <Text style={adj.breakdownLabel}>Monto pujado</Text>
                    <Text style={adj.breakdownValue}>${Number(adjudication.montoFinal).toLocaleString('es-AR')}</Text>
                  </View>
                  <View style={adj.breakdownRow}>
                    <Text style={adj.breakdownLabel}>Comisión</Text>
                    <Text style={adj.breakdownValue}>${Number(adjudication.comision).toLocaleString('es-AR')}</Text>
                  </View>
                  <View style={adj.breakdownRow}>
                    <Text style={adj.breakdownLabel}>Costo de envío</Text>
                    <Text style={adj.breakdownValue}>${Number(adjudication.costoEnvio).toLocaleString('es-AR')}</Text>
                  </View>
                  <View style={[adj.breakdownRow, adj.totalRow]}>
                    <Text style={adj.totalLabel}>TOTAL A PAGAR</Text>
                    <Text style={adj.totalValue}>
                      ${(Number(adjudication.montoFinal) + Number(adjudication.comision) + Number(adjudication.costoEnvio)).toLocaleString('es-AR')}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={adj.primaryBtn}
                  onPress={() => {
                    setAdjudication(null);
                    router.push(`/(app)/purchase/${adjudication.purchaseId}` as never);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={adj.primaryBtnText}>Ver detalle de compra</Text>
                </TouchableOpacity>
                <TouchableOpacity style={adj.secondaryBtn} onPress={() => setAdjudication(null)}>
                  <Text style={adj.secondaryBtnText}>Seguir viendo la subasta</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={adj.iconLost}>
                  <Ionicons name="close-circle" size={36} color="#586160" />
                </View>
                <Text style={adj.titleLost}>Pieza adjudicada</Text>
                <Text style={adj.subtitle}>Otro postor ganó esta pieza. Esperá el próximo ítem.</Text>
                <TouchableOpacity style={adj.primaryBtn} onPress={() => setAdjudication(null)} activeOpacity={0.85}>
                  <Text style={adj.primaryBtnText}>Continuar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* P-18: Bid Confirmation Sheet */}
      <Modal visible={showOffer} transparent animationType="slide" onRequestClose={() => setShowOffer(false)}>
        <View style={sheet.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'position' : undefined}>
            <View style={[sheet.container, { paddingBottom: insets.bottom + 24 }]}>
              {/* Close */}
              <TouchableOpacity style={sheet.closeBtn} onPress={() => setShowOffer(false)}>
                <Ionicons name="close" size={18} color="#5B5F5C" />
              </TouchableOpacity>

              {/* Amount */}
              <View style={sheet.amountBlock}>
                <Text style={sheet.ofertaLabel}>Oferta</Text>
                <View style={sheet.amountRow}>
                  <Text style={sheet.amountCurrency}>$ </Text>
                  <TextInput
                    style={[sheet.amountInput, (offerTooLow || offerTooHigh) && sheet.amountInputError]}
                    value={offerAmount}
                    onChangeText={setOfferAmount}
                    keyboardType="decimal-pad"
                    placeholder={minBid.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                    placeholderTextColor="#ABB4B3"
                    autoFocus
                  />
                </View>

                {/* Validación en tiempo real */}
                {offerTooLow && (
                  <Text style={sheet.validationError}>
                    Mínimo: ${minBid.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                  </Text>
                )}
                {offerTooHigh && (
                  <Text style={sheet.validationError}>
                    Máximo: ${maxBid.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                  </Text>
                )}
              </View>

              {/* Rango permitido */}
              <View style={sheet.rangeHint}>
                <View style={sheet.rangeHintItem}>
                  <Ionicons name="arrow-up-circle-outline" size={14} color="#808A88" />
                  <Text style={sheet.rangeHintText}>
                    Mín: ${minBid.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                  </Text>
                </View>
                <View style={sheet.rangeHintItem}>
                  <Ionicons name="arrow-down-circle-outline" size={14} color="#808A88" />
                  <Text style={sheet.rangeHintText}>
                    Máx: {isNoLimit ? 'Sin límite' : `$${maxBid.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`}
                  </Text>
                </View>
              </View>

              {/* Fee */}
              <View style={sheet.feeRow}>
                <Text style={sheet.feeLabel}>Comisión</Text>
                <Text style={sheet.feeValue}>2,5% (${fee.toLocaleString('es-AR', { maximumFractionDigits: 0 })})</Text>
              </View>

              {/* Payment method */}
              <View style={sheet.methodSection}>
                <Text style={sheet.methodLabel}>Método de pago</Text>
                <View style={sheet.methodSelector}>
                  <View style={sheet.methodRow}>
                    <Ionicons
                      name={selectedMethod?.tipo === 'tarjeta_credito' ? 'card-outline' : 'business-outline'}
                      size={18} color="#808A88"
                    />
                    <Text style={sheet.methodName}>
                      {selectedMethod ? methodLabel(selectedMethod) : 'Sin método verificado'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#808A88" />
                  </View>
                </View>
              </View>

              {/* Confirm button */}
              <TouchableOpacity
                style={[sheet.confirmBtn, (submitting || !offerValid || !selectedMethod) && { opacity: 0.5 }]}
                onPress={handleConfirmOffer}
                disabled={submitting || !offerValid || !selectedMethod}
                activeOpacity={0.9}
              >
                <View style={sheet.confirmLeft}>
                  <Ionicons name="arrow-forward" size={16} color="#FFF" />
                </View>
                {submitting
                  ? <ActivityIndicator color="#5B5F5C" style={{ flex: 1 }} />
                  : <Text style={sheet.confirmText}>Confirmar oferta</Text>
                }
                <View style={sheet.confirmRight}>
                  <Ionicons name="checkmark" size={16} color="#5B5F5C" />
                </View>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  loaderBg: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  noItemBox: { alignItems: 'center', gap: 16, paddingHorizontal: 40 },
  noItemText: { fontSize: 16, fontFamily: fonts.regular, color: '#586160', textAlign: 'center' },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 32, paddingVertical: 12, paddingHorizontal: 24 },
  backBtnText: { fontSize: 15, fontFamily: fonts.semiBold, color: '#2C3434' },
  backFloating: { position: 'absolute', left: 16, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  timerOverlay: {
    position: 'absolute', right: 16, alignItems: 'center',
    backgroundColor: 'rgba(245,255,254,0.4)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(171,180,179,0.15)',
    paddingHorizontal: 25, paddingVertical: 13,
  },
  timerLabel: { fontSize: 12, fontFamily: fonts.medium, color: '#586160', letterSpacing: -0.6, textTransform: 'uppercase' },
  timerValue: { fontSize: 24, fontFamily: fonts.bold, color: '#5B5F5C', letterSpacing: -1.2, lineHeight: 32 },
  cardContent: { paddingHorizontal: 0, paddingBottom: 0 },
  contentCanvas: {
    backgroundColor: '#FFFFFF', borderRadius: 32, marginHorizontal: 0,
    padding: 24, gap: 32,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 1, elevation: 2,
  },
  titleBlock: { gap: 4 },
  auctionLive: { fontSize: 10, fontFamily: fonts.bold, color: '#747C7C', letterSpacing: 2.2, textTransform: 'uppercase' },
  itemTitle: { fontSize: 24, fontFamily: fonts.semiBold, color: '#2C3434', letterSpacing: -1.8, lineHeight: 29 },
  itemSub: { fontSize: 14, fontFamily: fonts.regular, color: '#747C7C', lineHeight: 20, marginTop: 4 },
  specsSection: { gap: 16 },
  sectionLabel: { fontSize: 11, fontFamily: fonts.bold, color: '#5B5F5C', letterSpacing: 1.1, textTransform: 'uppercase' },
  specsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  provenanceSection: { gap: 15 },
  provenanceText: { fontSize: 14, fontFamily: fonts.regular, color: '#586160', lineHeight: 22.75 },
  bidCard: {
    backgroundColor: '#E3E9E8', borderRadius: 32, paddingHorizontal: 24,
    paddingTop: 23, paddingBottom: 24, gap: 16,
  },
  bidCardTop: { gap: 4 },
  currentBidLabel: { fontSize: 11, fontFamily: fonts.bold, color: '#586160', letterSpacing: -0.33, textTransform: 'uppercase' },
  currentBidAmount: { fontSize: 48, fontFamily: fonts.bold, color: '#2C3434', letterSpacing: -2.4, lineHeight: 48 },
  rangeRow: { flexDirection: 'row', gap: 0, borderTopWidth: 1, borderTopColor: 'rgba(171,180,179,0.2)', paddingTop: 12 },
  rangeItem: { flex: 1, gap: 2 },
  rangeDivider: { width: 1, backgroundColor: 'rgba(171,180,179,0.3)', marginHorizontal: 12 },
  rangeLabel: { fontSize: 9, fontFamily: fonts.bold, color: '#808A88', letterSpacing: 0.9, textTransform: 'uppercase' },
  rangeValue: { fontSize: 13, fontFamily: fonts.semiBold, color: '#2C3434', letterSpacing: -0.3 },
  leadingBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EEFDF3', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start' },
  leadingBannerText: { fontSize: 11, fontFamily: fonts.bold, color: '#00A63D', letterSpacing: 0.6 },
  endedRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: 'rgba(171,180,179,0.2)', paddingTop: 12 },
  reserveRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: 'rgba(171,180,179,0.2)', paddingTop: 5 },
  reserveText: { fontSize: 12, fontFamily: fonts.semiBold, color: '#586160', letterSpacing: 0.6, textTransform: 'uppercase' },
  timerInCard: {
    alignItems: 'center', backgroundColor: 'rgba(245,255,254,0.4)',
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(171,180,179,0.15)',
    paddingHorizontal: 25, paddingVertical: 13,
  },
  historyCard: { backgroundColor: '#EAEFEE', borderRadius: 32, paddingHorizontal: 24, paddingTop: 23, paddingBottom: 24, gap: 16 },
  historyList: { gap: 8 },
  viewAllBtn: { alignItems: 'center', paddingTop: 7.5 },
  viewAllText: { fontSize: 10, fontFamily: fonts.bold, color: '#5B5F5C', letterSpacing: 0.4, textTransform: 'uppercase', textDecorationLine: 'underline' },
  footer: { paddingHorizontal: 20, paddingTop: 12, backgroundColor: 'transparent', gap: 8 },
  penaltyBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF3C7', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 1, borderColor: '#FCD34D',
  },
  penaltyBannerText: { flex: 1, fontSize: 13, fontFamily: fonts.medium, color: '#92400E' },
  penaltyBannerLink: { fontSize: 12, fontFamily: fonts.bold, color: '#B45309' },
  winnerCard: {
    backgroundColor: '#FFFBEB', borderRadius: 24, padding: 20, gap: 14,
    borderWidth: 1, borderColor: '#FCD34D',
  },
  winnerIconRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  winnerTitle: { fontSize: 17, fontFamily: fonts.bold, color: '#92400E', letterSpacing: -0.5 },
  winnerDesc: { fontSize: 14, fontFamily: fonts.regular, color: '#92400E', lineHeight: 20 },
  winnerBreakdown: { gap: 6 },
  winnerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  winnerLabel: { fontSize: 13, fontFamily: fonts.regular, color: '#92400E' },
  winnerValue: { fontSize: 13, fontFamily: fonts.semiBold, color: '#78350F' },
  winnerTotalRow: { borderTopWidth: 1, borderTopColor: '#FCD34D', paddingTop: 8, marginTop: 2 },
  winnerTotalLabel: { fontSize: 11, fontFamily: fonts.bold, color: '#78350F', letterSpacing: 0.6, textTransform: 'uppercase' },
  winnerTotalValue: { fontSize: 17, fontFamily: fonts.bold, color: '#78350F', letterSpacing: -0.5 },
  winnerBtn: {
    backgroundColor: '#92400E', borderRadius: 20, paddingVertical: 12,
    alignItems: 'center',
  },
  winnerBtnText: { fontSize: 14, fontFamily: fonts.semiBold, color: '#FFFBEB', letterSpacing: -0.3 },
  offerBtn: { backgroundColor: '#151515', borderRadius: 32, alignItems: 'center', justifyContent: 'center', padding: 16 },
  offerBtnDisabled: { backgroundColor: '#6B7573', opacity: 0.6 },
  offerBtnText: { fontSize: 17, fontFamily: fonts.regular, color: '#FFF', letterSpacing: -0.68 },
});

const sheet = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  container: {
    backgroundColor: '#E7ECEB', borderTopLeftRadius: 40, borderTopRightRadius: 40,
    paddingHorizontal: 24, paddingTop: 32, gap: 16,
  },
  closeBtn: { position: 'absolute', top: 32, right: 30, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  amountBlock: { gap: 4, paddingRight: 32 },
  ofertaLabel: { fontSize: 24, fontFamily: fonts.bold, color: '#586160', letterSpacing: -0.96 },
  amountRow: { flexDirection: 'row', alignItems: 'baseline' },
  amountCurrency: { fontSize: 56, fontFamily: fonts.bold, color: '#151515', letterSpacing: -0.6 },
  amountInput: { flex: 1, fontSize: 40, fontFamily: fonts.bold, color: '#151515', letterSpacing: -0.6 },
  amountInputError: { color: '#B3261E' },
  validationError: { fontSize: 12, fontFamily: fonts.medium, color: '#B3261E', marginTop: 2 },
  rangeHint: { flexDirection: 'row', gap: 16 },
  rangeHintItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rangeHintText: { fontSize: 12, fontFamily: fonts.regular, color: '#808A88', letterSpacing: -0.4 },
  feeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  feeLabel: { fontSize: 16, fontFamily: fonts.regular, color: '#586160', letterSpacing: -0.64 },
  feeValue: { fontSize: 16, fontFamily: fonts.medium, color: '#000', letterSpacing: -0.64 },
  methodSection: { gap: 8 },
  methodLabel: { fontSize: 14, fontFamily: fonts.regular, color: '#586160', letterSpacing: -0.56 },
  methodSelector: {
    borderBottomWidth: 0.4, borderBottomColor: 'rgba(106,104,104,0.69)',
  },
  methodRow: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 32, paddingVertical: 12,
  },
  methodName: { flex: 1, fontSize: 14, fontFamily: fonts.regular, color: '#808A88', letterSpacing: -0.56 },
  confirmBtn: {
    backgroundColor: '#FFFFFF', borderRadius: 32, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', height: 54, overflow: 'hidden',
    marginTop: 8,
  },
  confirmLeft: {
    position: 'absolute', left: 0, width: 56, height: 54,
    backgroundColor: '#151515', alignItems: 'center', justifyContent: 'center',
    borderRadius: 32,
  },
  confirmText: { fontSize: 17, fontFamily: fonts.regular, color: '#5B5F5C', letterSpacing: -0.68, flex: 1, textAlign: 'center' },
  confirmRight: {
    position: 'absolute', right: 0, width: 56, height: 54 - 4,
    borderWidth: 1, borderColor: '#E5E5E5', alignItems: 'center', justifyContent: 'center',
    borderRadius: 42, margin: 2,
  },
});

const adj = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'flex-end' },
  card: {
    width: '100%', backgroundColor: '#FFFFFF', borderTopLeftRadius: 40, borderTopRightRadius: 40,
    paddingHorizontal: 28, paddingTop: 36, gap: 16, alignItems: 'center',
  },
  iconWon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#FFF9C4', alignItems: 'center', justifyContent: 'center',
  },
  iconLost: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#F1F4F3', alignItems: 'center', justifyContent: 'center',
  },
  titleWon: { fontSize: 24, fontFamily: fonts.bold, color: '#2C3434', letterSpacing: -1, textAlign: 'center' },
  titleLost: { fontSize: 22, fontFamily: fonts.semiBold, color: '#2C3434', letterSpacing: -0.8, textAlign: 'center' },
  subtitle: { fontSize: 14, fontFamily: fonts.regular, color: '#586160', textAlign: 'center', lineHeight: 20 },
  breakdown: {
    width: '100%', backgroundColor: '#F1F4F3', borderRadius: 20,
    paddingHorizontal: 20, paddingVertical: 16, gap: 10,
  },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  breakdownLabel: { fontSize: 13, fontFamily: fonts.regular, color: '#586160' },
  breakdownValue: { fontSize: 13, fontFamily: fonts.semiBold, color: '#2C3434' },
  totalRow: {
    borderTopWidth: 1, borderTopColor: 'rgba(171,180,179,0.3)',
    paddingTop: 10, marginTop: 2,
  },
  totalLabel: { fontSize: 11, fontFamily: fonts.bold, color: '#2C3434', letterSpacing: 0.8, textTransform: 'uppercase' },
  totalValue: { fontSize: 18, fontFamily: fonts.bold, color: '#2C3434', letterSpacing: -0.6 },
  primaryBtn: {
    width: '100%', backgroundColor: '#151515', borderRadius: 32,
    alignItems: 'center', paddingVertical: 16,
  },
  primaryBtnText: { fontSize: 16, fontFamily: fonts.regular, color: '#FFFFFF', letterSpacing: -0.6 },
  secondaryBtn: { paddingVertical: 8 },
  secondaryBtnText: { fontSize: 14, fontFamily: fonts.regular, color: '#808A88', letterSpacing: -0.4 },
});
