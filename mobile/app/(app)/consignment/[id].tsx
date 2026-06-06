import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Image, Alert, Dimensions, TextInput, Modal,
  KeyboardAvoidingView, Platform,
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
type InsurancePolicy = {
  numeroPoliza: string;
  compania: string;
  telefonoCompania?: string;
  emailCompania?: string;
  valorAsegurado: number;
  fechaInicio: string;
  fechaVencimiento: string;
};
type PayoutAccount = {
  id: string; banco: string; numeroCuenta: string;
  titular: string; moneda: string; pais?: string;
  swiftBic?: string; iban?: string;
};
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
  payoutAccounts: PayoutAccount[];
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
  const [insurancePolicies, setInsurancePolicies] = useState<InsurancePolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutForm, setPayoutForm] = useState({ banco: '', numeroCuenta: '', titular: '', moneda: 'ARS', swiftBic: '', iban: '' });
  const [savingPayout, setSavingPayout] = useState(false);

  async function load() {
    const [{ data }, { data: policies }] = await Promise.all([
      api.get<Consignment>(`/api/consignments/${id}`),
      api.get<InsurancePolicy[]>(`/api/consignments/${id}/insurance`),
    ]);
    if (data) setConsignment(data);
    if (policies) setInsurancePolicies(policies);
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

  async function handleSavePayout() {
    if (!payoutForm.banco.trim() || !payoutForm.numeroCuenta.trim() || !payoutForm.titular.trim() || !payoutForm.moneda.trim()) {
      Alert.alert('Campos requeridos', 'Completá banco, número de cuenta, titular y moneda.');
      return;
    }
    setSavingPayout(true);
    const { error } = await api.post(`/api/consignments/${id}/payout-account`, {
      banco: payoutForm.banco.trim(),
      numeroCuenta: payoutForm.numeroCuenta.trim(),
      titular: payoutForm.titular.trim(),
      numeroPaisId: 54,
      moneda: payoutForm.moneda.trim(),
      ...(payoutForm.swiftBic.trim() ? { swiftBic: payoutForm.swiftBic.trim() } : {}),
      ...(payoutForm.iban.trim() ? { iban: payoutForm.iban.trim() } : {}),
    });
    setSavingPayout(false);
    if (error) { Alert.alert('Error', typeof error === 'string' ? error : 'No se pudo guardar la cuenta.'); return; }
    setShowPayoutModal(false);
    setPayoutForm({ banco: '', numeroCuenta: '', titular: '', moneda: 'ARS', swiftBic: '', iban: '' });
    await load();
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

        {/* Póliza de seguro — visible cuando el bien está en depósito o fue subastado/vendido */}
        {(['en_deposito', 'subastado', 'vendido'] as ConsignmentStatus[]).includes(consignment.estado) &&
          insurancePolicies.length > 0 && (
          <View style={s.insuranceCard}>
            <View style={s.insuranceHeader}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#1E3A5F" />
              <Text style={s.insuranceTitle}>PÓLIZA DE SEGURO</Text>
            </View>
            {insurancePolicies.map((policy, i) => (
              <View key={i} style={s.insuranceBody}>
                <View style={s.insuranceRow}>
                  <Text style={s.insuranceLabel}>N° DE PÓLIZA</Text>
                  <Text style={s.insuranceValue}>{policy.numeroPoliza}</Text>
                </View>
                <View style={s.insuranceRow}>
                  <Text style={s.insuranceLabel}>COMPAÑÍA</Text>
                  <Text style={s.insuranceValue}>{policy.compania}</Text>
                </View>
                <View style={s.insuranceRow}>
                  <Text style={s.insuranceLabel}>VALOR ASEGURADO</Text>
                  <Text style={[s.insuranceValue, s.insuranceValueBold]}>
                    ${Number(policy.valorAsegurado).toLocaleString('es-AR')}
                  </Text>
                </View>
                <View style={s.insuranceDivider} />
                <View style={s.insuranceDatesRow}>
                  <View style={s.insuranceDateItem}>
                    <Text style={s.insuranceLabel}>INICIO</Text>
                    <Text style={s.insuranceValue}>{formatDate(policy.fechaInicio)}</Text>
                  </View>
                  <View style={s.insuranceDateItem}>
                    <Text style={s.insuranceLabel}>VENCIMIENTO</Text>
                    <Text style={s.insuranceValue}>{formatDate(policy.fechaVencimiento)}</Text>
                  </View>
                </View>
                {(policy.telefonoCompania || policy.emailCompania) && (
                  <>
                    <View style={s.insuranceDivider} />
                    <Text style={[s.insuranceLabel, { marginBottom: 6 }]}>CONTACTO ASEGURADORA</Text>
                    {policy.telefonoCompania && (
                      <View style={s.insuranceContactRow}>
                        <Ionicons name="call-outline" size={14} color="#3D5A80" />
                        <Text style={s.insuranceContactText}>{policy.telefonoCompania}</Text>
                      </View>
                    )}
                    {policy.emailCompania && (
                      <View style={s.insuranceContactRow}>
                        <Ionicons name="mail-outline" size={14} color="#3D5A80" />
                        <Text style={s.insuranceContactText}>{policy.emailCompania}</Text>
                      </View>
                    )}
                  </>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Cuenta de cobro — visible cuando inspección aprobada y aceptada */}
        {inspectionPassed && (
          <View style={s.payoutCard}>
            <View style={s.payoutHeader}>
              <Ionicons name="wallet-outline" size={18} color="#191C1D" />
              <Text style={s.payoutTitle}>CUENTA DE COBRO</Text>
            </View>
            {consignment.payoutAccounts.length > 0 ? (
              <View style={s.payoutBody}>
                <Text style={s.payoutInfo}>
                  Cuenta declarada para recibir el resultado de la venta.
                </Text>
                <View style={s.payoutRow}>
                  <Text style={s.payoutLabel}>BANCO</Text>
                  <Text style={s.payoutValue}>{consignment.payoutAccounts[0].banco}</Text>
                </View>
                <View style={s.payoutRow}>
                  <Text style={s.payoutLabel}>CUENTA</Text>
                  <Text style={s.payoutValue}>{consignment.payoutAccounts[0].numeroCuenta}</Text>
                </View>
                <View style={s.payoutRow}>
                  <Text style={s.payoutLabel}>TITULAR</Text>
                  <Text style={s.payoutValue}>{consignment.payoutAccounts[0].titular}</Text>
                </View>
                <View style={s.payoutRow}>
                  <Text style={s.payoutLabel}>MONEDA</Text>
                  <Text style={s.payoutValue}>{consignment.payoutAccounts[0].moneda}</Text>
                </View>
                <TouchableOpacity style={s.payoutChangeBtn} onPress={() => setShowPayoutModal(true)}>
                  <Text style={s.payoutChangeBtnText}>Cambiar cuenta</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={s.payoutBody}>
                <Text style={s.payoutInfo}>
                  Declarás la cuenta bancaria donde recibirás el dinero de la venta. Debe hacerse antes del inicio de la subasta.
                </Text>
                <TouchableOpacity style={s.payoutDeclareBtn} onPress={() => setShowPayoutModal(true)} activeOpacity={0.8}>
                  <Ionicons name="add-circle-outline" size={18} color="#191C1D" />
                  <Text style={s.payoutDeclareBtnText}>Declarar cuenta de cobro</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Modal: Declarar cuenta de cobro */}
      <Modal visible={showPayoutModal} animationType="slide" transparent onRequestClose={() => setShowPayoutModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={pm.overlay}>
            <View style={pm.sheet}>
              <View style={pm.sheetHeader}>
                <Text style={pm.sheetTitle}>Cuenta de cobro</Text>
                <TouchableOpacity onPress={() => setShowPayoutModal(false)} hitSlop={12}>
                  <Ionicons name="close" size={20} color="#474747" />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={pm.form}>
                {[
                  { key: 'banco', label: 'BANCO', placeholder: 'Banco Galicia' },
                  { key: 'numeroCuenta', label: 'NÚMERO DE CUENTA / CBU', placeholder: '0720...' },
                  { key: 'titular', label: 'TITULAR', placeholder: 'Juan Pérez' },
                  { key: 'moneda', label: 'MONEDA', placeholder: 'ARS / USD' },
                  { key: 'swiftBic', label: 'SWIFT / BIC (opcional)', placeholder: 'GALVARAB' },
                  { key: 'iban', label: 'IBAN (opcional)', placeholder: 'AR...' },
                ].map(({ key, label, placeholder }) => (
                  <View key={key} style={pm.field}>
                    <Text style={pm.fieldLabel}>{label}</Text>
                    <TextInput
                      style={pm.fieldInput}
                      value={payoutForm[key as keyof typeof payoutForm]}
                      onChangeText={(v) => setPayoutForm((prev) => ({ ...prev, [key]: v }))}
                      placeholder={placeholder}
                      placeholderTextColor="#9CA3AF"
                      autoCapitalize="characters"
                    />
                  </View>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={[pm.saveBtn, savingPayout && { opacity: 0.6 }]}
                onPress={handleSavePayout}
                disabled={savingPayout}
                activeOpacity={0.85}
              >
                {savingPayout
                  ? <ActivityIndicator color="#FFF" size="small" />
                  : <Text style={pm.saveBtnText}>Guardar cuenta</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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

  // Insurance policy
  insuranceCard: { marginHorizontal: 16, backgroundColor: '#EDF3FA', borderRadius: 32, borderWidth: 1, borderColor: 'rgba(61,90,128,0.2)', overflow: 'hidden' },
  insuranceHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(61,90,128,0.15)' },
  insuranceTitle: { fontSize: 12, fontFamily: fonts.bold, color: '#1E3A5F', letterSpacing: 1.2, textTransform: 'uppercase' },
  insuranceBody: { padding: 24, gap: 10 },
  insuranceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  insuranceLabel: { fontSize: 10, fontFamily: fonts.semiBold, color: '#3D5A80', letterSpacing: 0.5, textTransform: 'uppercase' },
  insuranceValue: { fontSize: 13, fontFamily: fonts.medium, color: '#1E3A5F' },
  insuranceValueBold: { fontSize: 18, fontFamily: fonts.bold, letterSpacing: -0.5 },
  insuranceDivider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(61,90,128,0.2)', marginVertical: 4 },
  insuranceDatesRow: { flexDirection: 'row', gap: 16 },
  insuranceDateItem: { flex: 1, gap: 3 },
  insuranceContactRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  insuranceContactText: { fontSize: 13, fontFamily: fonts.regular, color: '#3D5A80' },

  // Payout account
  payoutCard: { marginHorizontal: 16, backgroundColor: '#FFF', borderRadius: 32, borderWidth: 1, borderColor: '#E4E4E7', overflow: 'hidden' },
  payoutHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F1F3F4' },
  payoutTitle: { fontSize: 12, fontFamily: fonts.bold, color: '#191C1D', letterSpacing: 1.2, textTransform: 'uppercase' },
  payoutBody: { padding: 24, gap: 12 },
  payoutInfo: { fontSize: 13, fontFamily: fonts.regular, color: '#474747', lineHeight: 20 },
  payoutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E4E4E7' },
  payoutLabel: { fontSize: 10, fontFamily: fonts.semiBold, color: '#808A88', letterSpacing: 0.5, textTransform: 'uppercase' },
  payoutValue: { fontSize: 13, fontFamily: fonts.medium, color: '#191C1D' },
  payoutDeclareBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F1F3F4', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16, marginTop: 4 },
  payoutDeclareBtnText: { fontSize: 14, fontFamily: fonts.semiBold, color: '#191C1D' },
  payoutChangeBtn: { alignSelf: 'flex-start', paddingTop: 4 },
  payoutChangeBtnText: { fontSize: 13, fontFamily: fonts.semiBold, color: '#3B82F6' },
});

const pm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingTop: 24, paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '85%',
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  sheetTitle: { fontSize: 18, fontFamily: fonts.semiBold, color: '#191C1D', letterSpacing: -0.5 },
  form: { gap: 16, paddingBottom: 16 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 10, fontFamily: fonts.semiBold, color: '#474747', letterSpacing: 0.8, textTransform: 'uppercase' },
  fieldInput: {
    backgroundColor: '#F4F5F5', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 14, fontFamily: fonts.regular, color: '#191C1D',
    borderWidth: 1, borderColor: '#E4E4E7',
  },
  saveBtn: {
    backgroundColor: '#191C1D', borderRadius: 32,
    alignItems: 'center', paddingVertical: 16, marginTop: 8,
  },
  saveBtnText: { fontSize: 16, fontFamily: fonts.semiBold, color: '#FFF', letterSpacing: -0.4 },
});
