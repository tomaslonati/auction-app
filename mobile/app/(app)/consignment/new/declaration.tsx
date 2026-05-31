import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { fonts } from '@/constants/design';

const TERMS_TEXT = `Términos y Condiciones de Consignación

El presente Acuerdo de Consignación regula la relación entre el Consignante y la Casa de Subastas. Al continuar, reconocés que tenés el derecho legal de vender el bien consignado y que el mismo está libre de gravámenes o impedimentos legales.

1. Autenticación: Todos los bienes están sujetos a inspección física y autenticación profesional. La Casa de Subastas se reserva el derecho de rechazar cualquier bien que no cumpla con los estándares de calidad o los requisitos de procedencia.

2. Comisión: Se descontará una comisión estándar del precio final de martillo según el arancel vigente. Pueden aplicarse costos adicionales por fotografía, seguro y catalogación.

3. Precio de reserva: Si se acuerda un precio de reserva, el bien no se venderá por debajo de ese monto. Si no se establece reserva, el bien se adjudicará al mejor postor sin importar el precio.

4. Responsabilidad: Mientras el bien esté bajo nuestra custodia, estará asegurado contra pérdida o daño por su valor de mercado. Sin embargo, la Casa de Subastas no se responsabiliza por defectos inherentes ni por el deterioro natural del bien.

5. Retiro: Retirar un bien una vez que ha sido catalogado genera un cargo equivalente a la comisión sobre el precio de reserva estimado.`;

function CheckRow({ checked, onToggle, children }: { checked: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <TouchableOpacity style={chk.row} onPress={onToggle} activeOpacity={0.7}>
      <View style={chk.margin}>
        <View style={[chk.box, checked && chk.boxChecked]}>
          {checked && <Ionicons name="checkmark" size={14} color="#FFF" />}
        </View>
      </View>
      <View style={{ flex: 1 }}>{children}</View>
    </TouchableOpacity>
  );
}

export default function DeclarationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [declaraTitularidad, setDeclaraTitularidad] = useState(false);
  const [declaraOrigenLicito, setDeclaraOrigenLicito] = useState(false);
  const [aceptaDevolucion, setAceptaDevolucion] = useState(false);
  const [loading, setLoading] = useState(false);

  const allChecked = declaraTitularidad && declaraOrigenLicito && aceptaDevolucion;

  async function handleSubmit() {
    if (!allChecked) { Alert.alert('Requerido', 'Debés aceptar todas las condiciones para continuar.'); return; }
    setLoading(true);
    const { error } = await api.post(`/api/consignments/${id}/declaration`, {
      declaraTitularidad: true,
      declaraOrigenLicito: true,
      aceptaDevolucionConCargo: true,
    });
    setLoading(false);
    if (error) { Alert.alert('Error', typeof error === 'string' ? error : 'No se pudo enviar la declaración.'); return; }
    router.replace('/(app)/consignment' as never);
  }

  return (
    <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={s.headerBtn}>
          <Ionicons name="arrow-back" size={16} color="#000" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Consignar bien</Text>
        <TouchableOpacity hitSlop={12} style={s.headerBtn}>
          <Ionicons name="help-circle-outline" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Progress */}
        <View style={s.progressSection}>
          <View style={s.progressTop}>
            <View>
              <Text style={s.stepLabel}>PASO 3 DE 3</Text>
              <Text style={s.stepTitle}>Declaración{'\n'}jurada</Text>
            </View>
            <Text style={s.stepPct}>100%{'\n'}completado</Text>
          </View>
          <View style={s.progressTrack}>
            <View style={s.progressFill} />
          </View>
        </View>

        {/* Intro */}
        <View style={s.introSection}>
          <Text style={s.introText}>
            Revisá con atención las siguientes obligaciones legales. Tu consignación queda sujeta a los términos del Acuerdo de Consignación.
          </Text>
          <View style={s.legalTag}>
            <Ionicons name="hammer-outline" size={19} color="#191C1D" />
            <Text style={s.legalTagText}>El envío genera un vínculo legal vinculante.</Text>
          </View>
        </View>

        {/* Terms box */}
        <View style={s.termsBox}>
          <Text style={s.termsTitle}>Términos y condiciones{'\n'}de consignación</Text>
          <Text style={s.termsBody}>{TERMS_TEXT.split('\n').slice(2).join('\n')}</Text>
        </View>

        {/* Checkboxes */}
        <View style={s.checksSection}>
          <CheckRow checked={declaraTitularidad} onToggle={() => setDeclaraTitularidad(!declaraTitularidad)}>
            <Text style={chk.text}>
              Declaro ser el/la titular del bien o tener la autorización legal suficiente para su venta en consignación.
            </Text>
          </CheckRow>
          <CheckRow checked={declaraOrigenLicito} onToggle={() => setDeclaraOrigenLicito(!declaraOrigenLicito)}>
            <Text style={chk.text}>
              Declaro que el bien tiene origen lícito y puedo acreditar su procedencia ante la empresa o autoridades competentes.
            </Text>
          </CheckRow>
          <CheckRow checked={aceptaDevolucion} onToggle={() => setAceptaDevolucion(!aceptaDevolucion)}>
            <Text style={chk.text}>
              Acepto que si rechazo la oferta de valoración final o retiro el lote, la devolución se realizará con cargo a mi cuenta.
            </Text>
          </CheckRow>
        </View>

        {/* Submit */}
        <View style={s.submitSection}>
          <TouchableOpacity
            style={[s.submitBtn, !allChecked && s.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!allChecked || loading}
            activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator color="#1B1C1C" /> : <Text style={s.submitText}>Enviar solicitud</Text>}
          </TouchableOpacity>
          <Text style={s.submitNote}>Todas las declaraciones son obligatorias para continuar.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16 },
  headerBtn: { padding: 8, borderRadius: 9999 },
  headerTitle: { fontSize: 16, fontFamily: fonts.semiBold, color: '#18181B', letterSpacing: -0.4 },
  content: { paddingHorizontal: 24, paddingBottom: 48, gap: 48 },
  progressSection: { paddingTop: 8, gap: 16 },
  progressTop: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  stepLabel: { fontSize: 12, fontFamily: fonts.semiBold, color: '#9ea8a6', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 },
  stepTitle: { fontSize: 24, fontFamily: fonts.medium, color: '#6b7573', letterSpacing: -1.2, lineHeight: 28 },
  stepPct: { fontSize: 13, fontFamily: fonts.medium, color: '#6b7573', textAlign: 'right', lineHeight: 20 },
  progressTrack: { height: 8, backgroundColor: '#E7E8E9', borderRadius: 99, overflow: 'hidden' },
  progressFill: { width: '100%', height: '100%', backgroundColor: '#000', borderRadius: 99 },
  introSection: { gap: 24 },
  introText: { fontSize: 14, fontFamily: fonts.regular, color: '#474747', lineHeight: 22.75 },
  legalTag: { flexDirection: 'row', gap: 8, backgroundColor: '#F3F4F5', borderRadius: 32, padding: 24, alignItems: 'flex-start' },
  legalTagText: { fontSize: 12, fontFamily: fonts.medium, color: '#191C1D', flex: 1 },
  termsBox: {
    backgroundColor: '#FFF', borderRadius: 32, padding: 32, gap: 0,
    maxHeight: 400, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  termsTitle: { fontSize: 18, fontFamily: fonts.bold, color: '#191C1D', lineHeight: 28, marginBottom: 24 },
  termsBody: { fontSize: 14, fontFamily: fonts.regular, color: '#474747', lineHeight: 22.75 },
  checksSection: { gap: 24 },
  submitSection: { alignItems: 'center', paddingTop: 16, gap: 16 },
  submitBtn: { backgroundColor: '#D5D4D4', borderRadius: 9999, paddingVertical: 20, width: '100%', alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: { fontSize: 16, fontFamily: fonts.bold, color: '#1B1C1C' },
  submitNote: { fontSize: 12, fontFamily: fonts.regular, color: '#474747' },
});

const chk = StyleSheet.create({
  row: { flexDirection: 'row', gap: 16, backgroundColor: '#F3F4F5', borderRadius: 16, padding: 20, alignItems: 'flex-start' },
  margin: { paddingTop: 4 },
  box: { width: 24, height: 24, borderRadius: 6, borderWidth: 1, borderColor: '#C6C6C6', backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  boxChecked: { backgroundColor: '#000', borderColor: '#000' },
  text: { fontSize: 14, fontFamily: fonts.medium, color: '#191C1D', lineHeight: 17.5, flex: 1 },
});
