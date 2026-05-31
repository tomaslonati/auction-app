import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Image, Alert, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { colors, spacing, fonts } from '@/constants/design';

const { width } = Dimensions.get('window');

type ConsignmentStatus = 'en_evaluacion' | 'aceptado' | 'rechazado' | 'en_deposito' | 'subastado' | 'vendido';
type Inspection = {
  resultado: string;
  valorBaseAsignado?: number;
  comisionPorcentaje?: number;
  userAcepta: boolean | null;
  costoDevolucion?: number;
  notas?: string;
};
type Location = {
  deposit: { nombre: string; direccion: string };
  sector: string;
  fechaIngreso: string;
};
type Spec = { clave: string; valor: string };
type Consignment = {
  id: string;
  descripcion: string;
  categoria?: string;
  valorEstimado?: number;
  estado: ConsignmentStatus;
  esObraArte: boolean;
  esCompuesto: boolean;
  artistaDisenador?: string;
  fechaCreacionObra?: string;
  historia?: string;
  photos: { url: string; orden: number }[];
  specs: Spec[];
  inspection: Inspection | null;
  location: Location | null;
};

const STATUS_LABELS: Record<ConsignmentStatus, string> = {
  en_evaluacion: 'En evaluación', aceptado: 'Aprobado', rechazado: 'Rechazado',
  en_deposito: 'En depósito', subastado: 'Subastado', vendido: 'Vendido',
};
const STATUS_COLORS: Record<ConsignmentStatus, string> = {
  en_evaluacion: '#F59E0B', aceptado: '#22C55E', rechazado: '#DC2626',
  en_deposito: '#3B82F6', subastado: '#8B5CF6', vendido: '#16A34A',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function ConsignmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [consignment, setConsignment] = useState<Consignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);

  async function load() {
    const { data } = await api.get<Consignment>(`/api/consignments/${id}`);
    if (data) setConsignment(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  async function handleResponse(acepta: boolean) {
    Alert.alert(
      acepta ? 'Aceptar condiciones' : 'Rechazar condiciones',
      acepta
        ? '¿Confirmás que aceptás el valor base y condiciones de subasta?'
        : '¿Confirmás que rechazás? El bien será devuelto con cargo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: acepta ? 'Aceptar' : 'Rechazar',
          style: acepta ? 'default' : 'destructive',
          onPress: async () => {
            setResponding(true);
            const { error } = await api.post(`/api/consignments/${id}/inspection-response`, { userAcepta: acepta });
            setResponding(false);
            if (error) { Alert.alert('Error', typeof error === 'string' ? error : 'No se pudo procesar.'); return; }
            await load();
          },
        },
      ]
    );
  }

  if (loading) return <View style={s.loader}><ActivityIndicator color={colors.textSecondary} /></View>;
  if (!consignment) return null;

  const { inspection, location } = consignment;
  const showResponse = inspection && inspection.resultado === 'aceptado' && inspection.userAcepta === null;
  const inspectionPassed = inspection && inspection.resultado === 'aceptado' && inspection.userAcepta === true;
  const inspectionRejected = inspection && inspection.resultado === 'rechazado';

  return (
    <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color="#2C3434" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{consignment.esObraArte ? 'Obra de arte' : 'Bien consignado'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        {/* Photo Carousel */}
        {consignment.photos.length > 0 ? (
          <View style={s.carouselBox}>
            <Image
              source={{ uri: consignment.photos[imgIdx]?.url }}
              style={s.carouselImg}
              resizeMode="cover"
            />
            {consignment.photos.length > 1 && (
              <View style={s.dots}>
                {consignment.photos.map((_, i) => (
                  <TouchableOpacity key={i} onPress={() => setImgIdx(i)}>
                    <View style={[s.dot, i === imgIdx ? s.dotActive : s.dotInactive]} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {consignment.photos.length > 1 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.thumbRow} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
                {consignment.photos.map((p, i) => (
                  <TouchableOpacity key={i} onPress={() => setImgIdx(i)}>
                    <Image source={{ uri: p.url }} style={[s.thumb, i === imgIdx && s.thumbActive]} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        ) : (
          <View style={s.imgPlaceholder}>
            <Ionicons name="image-outline" size={48} color="#D0D9D7" />
          </View>
        )}

        {/* Info Header */}
        <View style={s.infoHeader}>
          <View style={s.tagsRow}>
            {consignment.categoria && (
              <View style={s.tagDark}>
                <Text style={s.tagDarkText}>{consignment.categoria.toUpperCase()}</Text>
              </View>
            )}
            {consignment.esObraArte && (
              <View style={s.tagLight}>
                <Ionicons name="color-palette-outline" size={11} color="#474747" />
                <Text style={s.tagLightText}>OBRA DE ARTE</Text>
              </View>
            )}
            {consignment.esCompuesto && (
              <View style={s.tagLight}>
                <Ionicons name="layers-outline" size={11} color="#474747" />
                <Text style={s.tagLightText}>BIEN COMPUESTO</Text>
              </View>
            )}
            <View style={[s.tagStatus, { backgroundColor: STATUS_COLORS[consignment.estado] + '20' }]}>
              <Text style={[s.tagStatusText, { color: STATUS_COLORS[consignment.estado] }]}>
                {STATUS_LABELS[consignment.estado]}
              </Text>
            </View>
          </View>

          <Text style={s.title}>{consignment.descripcion}</Text>

          {consignment.historia && (
            <Text style={s.historyText}>{consignment.historia}</Text>
          )}
        </View>

        {/* Object Provenance */}
        {(consignment.artistaDisenador || consignment.valorEstimado || consignment.fechaCreacionObra) && (
          <View style={s.provenanceCard}>
            <Text style={s.sectionLabel}>PROCEDENCIA DEL BIEN</Text>
            <View style={s.provenanceGrid}>
              {consignment.artistaDisenador && (
                <View style={s.provenanceItem}>
                  <Text style={s.provenanceItemLabel}>ARTISTA / CREADOR</Text>
                  <Text style={s.provenanceItemValue}>{consignment.artistaDisenador}</Text>
                </View>
              )}
              {consignment.fechaCreacionObra && (
                <View style={s.provenanceItem}>
                  <Text style={s.provenanceItemLabel}>FECHA DE CREACIÓN</Text>
                  <Text style={s.provenanceItemValue}>{formatDate(consignment.fechaCreacionObra)}</Text>
                </View>
              )}
              {consignment.valorEstimado && (
                <View style={s.provenanceItemFull}>
                  <Text style={s.provenanceItemLabel}>VALOR ESTIMADO</Text>
                  <Text style={s.provenanceValueLarge}>${Number(consignment.valorEstimado).toLocaleString('es-AR')}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Technical Specs */}
        {consignment.specs.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>ESPECIFICACIONES TÉCNICAS</Text>
            {consignment.specs.map((spec, i) => (
              <View key={i} style={[s.specRow, i < consignment.specs.length - 1 && s.specRowBorder]}>
                <Text style={s.specKey}>{spec.clave}</Text>
                <Text style={s.specVal}>{spec.valor}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Vault Location */}
        {location && (
          <View style={s.vaultCard}>
            <View style={s.vaultHeader}>
              <Ionicons name="location-outline" size={18} color="#191C1D" />
              <Text style={s.vaultTitle}>DEPÓSITO ASIGNADO</Text>
            </View>
            <View style={s.vaultBody}>
              <Text style={s.vaultName}>{location.deposit.nombre}</Text>
              <Text style={s.vaultAddress}>{location.deposit.direccion}</Text>
              <View style={s.vaultMeta}>
                <View style={s.vaultMetaItem}>
                  <Text style={s.vaultMetaLabel}>SECTOR</Text>
                  <Text style={s.vaultMetaValue}>{location.sector}</Text>
                </View>
                <View style={s.vaultMetaItem}>
                  <Text style={s.vaultMetaLabel}>FECHA DE INGRESO</Text>
                  <Text style={s.vaultMetaValue}>{formatDate(location.fechaIngreso)}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Inspection Passed */}
        {(inspectionPassed || showResponse) && inspection && (
          <View style={s.inspectionPassedCard}>
            <View style={s.inspectionPassedBadge}>
              <Text style={s.inspectionPassedBadgeText}>INSPECCIÓN APROBADA</Text>
            </View>
            <View style={s.inspectionPassedBody}>
              <Text style={s.sectionLabel}>PROYECCIÓN DE SUBASTA</Text>
              <View style={s.auctionProjectionGrid}>
                {inspection.valorBaseAsignado != null && (
                  <View>
                    <Text style={s.projLabel}>VALOR BASE</Text>
                    <Text style={s.projValue}>${Number(inspection.valorBaseAsignado).toLocaleString('es-AR')}</Text>
                  </View>
                )}
                {inspection.comisionPorcentaje != null && (
                  <View>
                    <Text style={s.projLabel}>COMISIÓN</Text>
                    <Text style={s.projValue}>{inspection.comisionPorcentaje}%</Text>
                  </View>
                )}
              </View>

              {showResponse && (
                <View style={s.responseActions}>
                  <TouchableOpacity style={s.rejectBtn} onPress={() => handleResponse(false)} disabled={responding}>
                    <Text style={s.rejectBtnText}>Rechazar condiciones</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.acceptBtn} onPress={() => handleResponse(true)} disabled={responding}>
                    {responding
                      ? <ActivityIndicator color="#FFF" size="small" />
                      : <Text style={s.acceptBtnText}>Aceptar oferta</Text>
                    }
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Inspection Rejected */}
        {inspectionRejected && inspection && (
          <View style={s.inspectionRejectedCard}>
            <View style={s.rejectedHeader}>
              <Ionicons name="close-circle-outline" size={18} color="#410002" />
              <Text style={s.rejectedTitle}>INSPECCIÓN RECHAZADA</Text>
            </View>
            {inspection.notas && (
              <Text style={s.rejectedNote}>"{inspection.notas}"</Text>
            )}
            {inspection.costoDevolucion != null && (
              <Text style={s.rejectedCost}>
                Costo de devolución: ${Number(inspection.costoDevolucion).toLocaleString('es-AR')}
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8F9FA' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: 14,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E4E4E7',
  },
  headerTitle: { fontSize: 18, fontFamily: fonts.semiBold, color: '#2C3434', letterSpacing: -0.5 },
  content: { paddingBottom: 48, gap: 24 },

  // Carousel
  carouselBox: { backgroundColor: '#EDEEEF', borderRadius: 32, overflow: 'hidden', margin: 16 },
  carouselImg: { width: '100%', height: 280 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 12 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { backgroundColor: '#FFFFFF' },
  dotInactive: { backgroundColor: '#A9C6CF' },
  thumbRow: { marginBottom: 12 },
  thumb: { width: 56, height: 56, borderRadius: 10, opacity: 0.55 },
  thumbActive: { opacity: 1, borderWidth: 2, borderColor: '#191C1D' },
  imgPlaceholder: { height: 200, margin: 16, backgroundColor: '#EDEEEF', borderRadius: 32, alignItems: 'center', justifyContent: 'center' },

  // Info Header
  infoHeader: { paddingHorizontal: 16, gap: 12 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagDark: { backgroundColor: '#3A3C3C', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 4 },
  tagDarkText: { fontSize: 10, fontFamily: fonts.semiBold, color: '#E2E2E2', letterSpacing: 1 },
  tagLight: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EDEEEF', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 4 },
  tagLightText: { fontSize: 10, fontFamily: fonts.semiBold, color: '#474747', letterSpacing: 0.5 },
  tagStatus: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  tagStatusText: { fontSize: 10, fontFamily: fonts.semiBold, letterSpacing: 0.5 },
  title: { fontSize: 28, fontFamily: fonts.bold, color: '#191C1D', letterSpacing: -1.4, lineHeight: 34 },
  historyText: { fontSize: 16, fontFamily: fonts.regular, color: '#474747', lineHeight: 26 },

  // Provenance
  provenanceCard: { marginHorizontal: 16, backgroundColor: '#FFF', borderRadius: 32, padding: 24, gap: 20, borderWidth: 1, borderColor: 'rgba(198,198,198,0.1)' },
  sectionLabel: { fontSize: 12, fontFamily: fonts.bold, color: '#474747', letterSpacing: 1.2, textTransform: 'uppercase' },
  provenanceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  provenanceItem: { width: '45%', gap: 3 },
  provenanceItemFull: { width: '100%', gap: 3 },
  provenanceItemLabel: { fontSize: 10, fontFamily: fonts.semiBold, color: '#474747', textTransform: 'uppercase', letterSpacing: 0.5 },
  provenanceItemValue: { fontSize: 14, fontFamily: fonts.medium, color: '#191C1D' },
  provenanceValueLarge: { fontSize: 24, fontFamily: fonts.bold, color: '#191C1D', letterSpacing: -0.96 },

  // Specs
  section: { marginHorizontal: 16, gap: 8 },
  specRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13 },
  specRowBorder: { borderBottomWidth: 1, borderBottomColor: '#E1E3E4' },
  specKey: { fontSize: 14, fontFamily: fonts.regular, color: '#474747' },
  specVal: { fontSize: 14, fontFamily: fonts.medium, color: '#191C1D' },

  // Vault
  vaultCard: { marginHorizontal: 16, backgroundColor: '#EDEEEF', borderRadius: 32, padding: 24, gap: 16, borderWidth: 1, borderColor: 'rgba(198,198,198,0.2)' },
  vaultHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  vaultTitle: { fontSize: 12, fontFamily: fonts.bold, color: '#191C1D', letterSpacing: 1.2, textTransform: 'uppercase' },
  vaultBody: { gap: 12 },
  vaultName: { fontSize: 14, fontFamily: fonts.semiBold, color: '#191C1D', lineHeight: 20 },
  vaultAddress: { fontSize: 14, fontFamily: fonts.regular, color: '#474747' },
  vaultMeta: { flexDirection: 'row', gap: 16, borderTopWidth: 1, borderTopColor: 'rgba(25,28,29,0.05)', paddingTop: 16 },
  vaultMetaItem: { flex: 1, gap: 2 },
  vaultMetaLabel: { fontSize: 10, fontFamily: fonts.semiBold, color: '#474747', textTransform: 'uppercase', letterSpacing: 0.5 },
  vaultMetaValue: { fontSize: 14, fontFamily: fonts.regular, color: '#191C1D' },

  // Inspection Passed
  inspectionPassedCard: { marginHorizontal: 16, backgroundColor: '#FFF', borderRadius: 32, borderWidth: 2, borderColor: '#191C1D', overflow: 'hidden' },
  inspectionPassedBadge: { backgroundColor: '#191C1D', alignSelf: 'flex-end', paddingHorizontal: 16, paddingVertical: 4 },
  inspectionPassedBadgeText: { fontSize: 10, fontFamily: fonts.semiBold, color: '#E5E2E1', textTransform: 'uppercase', letterSpacing: 0.5 },
  inspectionPassedBody: { padding: 28, gap: 20 },
  auctionProjectionGrid: { flexDirection: 'row', gap: 24 },
  projLabel: { fontSize: 10, fontFamily: fonts.regular, color: '#474747', textTransform: 'uppercase', letterSpacing: 0.5 },
  projValue: { fontSize: 20, fontFamily: fonts.semiBold, color: '#191C1D', lineHeight: 28 },
  responseActions: { flexDirection: 'row', gap: 16 },
  rejectBtn: { flex: 1, height: 48, borderRadius: 99, borderWidth: 2, borderColor: '#191C1D', alignItems: 'center', justifyContent: 'center' },
  rejectBtnText: { fontSize: 14, fontFamily: fonts.semiBold, color: '#191C1D' },
  acceptBtn: { flex: 1, height: 48, borderRadius: 99, backgroundColor: '#191C1D', alignItems: 'center', justifyContent: 'center' },
  acceptBtnText: { fontSize: 14, fontFamily: fonts.semiBold, color: '#E5E2E1' },

  // Inspection Rejected
  inspectionRejectedCard: { marginHorizontal: 16, backgroundColor: '#FFDAD6', borderRadius: 32, borderWidth: 1, borderColor: 'rgba(186,26,26,0.2)', padding: 28, gap: 12 },
  rejectedHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rejectedTitle: { fontSize: 12, fontFamily: fonts.semiBold, color: '#410002', letterSpacing: 1.2, textTransform: 'uppercase' },
  rejectedNote: { fontSize: 14, fontFamily: fonts.regular, color: '#410002', fontStyle: 'italic', lineHeight: 22 },
  rejectedCost: { fontSize: 13, fontFamily: fonts.semiBold, color: '#410002' },
});
