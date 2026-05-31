import { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, Modal, Image,
  Dimensions, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
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

function useCountdown(seconds: number) {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    const id = setInterval(() => setRemaining((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);
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
    if (mins < 60) return `${mins} min${mins !== 1 ? 's' : ''} ago`;
    return `${Math.floor(mins / 60)} hour ago`;
  })();
  return (
    <View style={bh.row}>
      <View style={bh.left}>
        <View style={bh.avatar}>
          <Text style={bh.avatarText}>{masked}</Text>
        </View>
        <Text style={bh.username}>User {masked.toLowerCase()}</Text>
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

export default function AuctionRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [currentData, setCurrentData] = useState<CurrentItemData | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOffer, setShowOffer] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timer = useCountdown(2 * 3600 + 14 * 60 + 5);

  async function poll() {
    const { data } = await api.get<CurrentItemData>(`/api/auctions/${id}/current-item`);
    if (!data) return;
    setCurrentData(data);
    const { data: bidData } = await api.get<Bid[]>(`/api/auctions/${id}/catalog/${data.item.id}/bids`);
    if (bidData) setBids(bidData.slice(0, 3));
  }

  useEffect(() => {
    async function init() {
      const { data: mData } = await api.get<PaymentMethod[]>('/api/users/me/payment-methods');
      if (mData) {
        const verified = mData.filter((m) => m.estado === 'verificado');
        setMethods(verified);
        if (verified.length > 0) setSelectedMethod(verified[0]);
      }
      await poll();
      setLoading(false);
    }
    init();
    intervalRef.current = setInterval(poll, 4000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [id]);

  async function handleLeave() {
    Alert.alert('Salir de la subasta', '¿Querés abandonar la sala?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: async () => { await api.post(`/api/auctions/${id}/leave`, {}); router.back(); } },
    ]);
  }

  async function handleConfirmOffer() {
    if (!currentData || !selectedMethod) return;
    const montoNum = parseFloat(offerAmount.replace(/\./g, '').replace(',', '.'));
    if (isNaN(montoNum) || montoNum <= 0) { Alert.alert('Error', 'Monto inválido'); return; }
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

  if (!currentData) return (
    <LinearGradient colors={['#E8EDEC', '#ABB4B2']} style={s.loaderBg}>
      <View style={s.noItemBox}>
        <Ionicons name="hourglass-outline" size={40} color="#586160" />
        <Text style={s.noItemText}>Sin piezas en subasta en este momento</Text>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backBtnText}>Salir</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );

  const { item, highestBid, precioBase } = currentData;
  const currentBid = highestBid ? Number(highestBid.monto) : Number(precioBase);
  const fee = currentBid * 0.025;

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
        <View style={[s.timerOverlay, { top: insets.top + 8 }]}>
          <Text style={s.timerLabel}>FINALIZA EN</Text>
          <Text style={s.timerValue}>{timer}</Text>
        </View>
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
            <Text style={s.auctionLive}>AUCTION LIVE</Text>
            <Text style={s.itemTitle}>{item.descripcion}</Text>
            {item.artistaDisenador && (
              <Text style={s.itemSub}>{item.artistaDisenador} • Pieza #{item.numeroPieza}</Text>
            )}
          </View>

          {/* Technical Specs */}
          <View style={s.specsSection}>
            <Text style={s.sectionLabel}>TECHNICAL SPECIFICATIONS</Text>
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
            <Text style={s.sectionLabel}>PROVENANCE & DETAILS</Text>
            <Text style={s.provenanceText}>{item.descripcion}</Text>
          </View>

          {/* Current Bid Card */}
          <View style={s.bidCard}>
            <View style={s.bidCardTop}>
              <Text style={s.currentBidLabel}>CURRENT BID</Text>
              <Text style={s.currentBidAmount}>${currentBid.toLocaleString('es-AR')}</Text>
            </View>
            <View style={s.reserveRow}>
              <Ionicons name="checkmark-circle-outline" size={13} color="#586160" />
              <Text style={s.reserveText}>RESERVE PRICE REACHED</Text>
            </View>
            <View style={s.timerInCard}>
              <Text style={s.timerLabel}>FINALIZA EN</Text>
              <Text style={s.timerValue}>{timer}</Text>
            </View>
          </View>

          {/* Bid History */}
          {bids.length > 0 && (
            <View style={s.historyCard}>
              <Text style={s.sectionLabel}>BIDDING HISTORY</Text>
              <View style={s.historyList}>
                {bids.map((b, i) => <BidHistoryRow key={b.id} bid={b} isTop={i === 0} />)}
              </View>
              <TouchableOpacity style={s.viewAllBtn}>
                <Text style={s.viewAllText}>VIEW ALL BIDS</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Bottom button */}
      <View style={[s.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={s.offerBtn} onPress={() => setShowOffer(true)} activeOpacity={0.9}>
          <Text style={s.offerBtnText}>Crear oferta</Text>
        </TouchableOpacity>
      </View>

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
                    style={sheet.amountInput}
                    value={offerAmount}
                    onChangeText={setOfferAmount}
                    keyboardType="decimal-pad"
                    placeholder={currentBid.toLocaleString('es-AR')}
                    placeholderTextColor="#ABB4B3"
                    autoFocus
                  />
                </View>
              </View>

              {/* Fee */}
              <View style={sheet.feeRow}>
                <Text style={sheet.feeLabel}>Fee</Text>
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
                style={[sheet.confirmBtn, submitting && { opacity: 0.7 }]}
                onPress={handleConfirmOffer}
                disabled={submitting || !selectedMethod}
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
  footer: { paddingHorizontal: 20, paddingTop: 12, backgroundColor: 'transparent' },
  offerBtn: { backgroundColor: '#151515', borderRadius: 32, alignItems: 'center', justifyContent: 'center', padding: 16 },
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
