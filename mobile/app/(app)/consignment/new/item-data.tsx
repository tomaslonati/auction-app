import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { spacing, fonts } from '@/constants/design';

function FieldCard({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <View style={fc.card}>
      <Text style={fc.label}>{label}{required ? ' *' : ''}</Text>
      {children}
    </View>
  );
}

const fc = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 32, padding: 32, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 1, elevation: 1,
  },
  label: { fontSize: 12, fontFamily: fonts.semiBold, color: '#474747', letterSpacing: 0.6, textTransform: 'uppercase' },
});

function TogglePill({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <TouchableOpacity style={[tp.pill, checked && tp.pillChecked]} onPress={onToggle} activeOpacity={0.7}>
      <View style={[tp.box, checked && tp.boxChecked]}>
        {checked && <Ionicons name="checkmark" size={12} color="#FFF" />}
      </View>
      <Text style={tp.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const tp = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: '#E7E8E9', borderRadius: 9999, height: 52, paddingHorizontal: 24 },
  pillChecked: { backgroundColor: '#E7E8E9' },
  box: { width: 20, height: 20, borderRadius: 6, borderWidth: 1, borderColor: '#C6C6C6', backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  boxChecked: { backgroundColor: '#000', borderColor: '#000' },
  label: { fontSize: 14, fontFamily: fonts.semiBold, color: '#191C1D' },
});

const INPUT = StyleSheet.create({
  base: { backgroundColor: '#F3F4F5', borderRadius: 6, padding: 16, fontSize: 16, fontFamily: fonts.regular, color: '#191C1D' },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  placeholder: { color: '#C6C6C6' },
  dollar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F5', borderRadius: 6, height: 60, paddingHorizontal: 16 },
  dollarSign: { fontSize: 18, fontFamily: fonts.semiBold, color: '#191C1D', marginRight: 4 },
  dollarInput: { flex: 1, fontSize: 18, fontFamily: fonts.semiBold, color: '#6B7280' },
});

export default function ConsignmentItemDataScreen() {
  const router = useRouter();
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('');
  const [valorEstimado, setValorEstimado] = useState('');
  const [esObraArte, setEsObraArte] = useState(true);
  const [esCompuesto, setEsCompuesto] = useState(false);
  const [artista, setArtista] = useState('');
  const [fechaCreacion, setFechaCreacion] = useState('');
  const [historia, setHistoria] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleNext() {
    if (!descripcion.trim()) { Alert.alert('Error', 'Ingresá una descripción del bien.'); return; }
    setLoading(true);
    const { data, error } = await api.post<{ id: string }>('/api/consignments', {
      descripcion: descripcion.trim(),
      categoria: categoria.trim() || undefined,
      valorEstimado: valorEstimado ? parseFloat(valorEstimado) : undefined,
      esObraArte, esCompuesto,
      artistaDisenador: artista.trim() || undefined,
      historia: historia.trim() || undefined,
    });
    setLoading(false);
    if (error || !data) { Alert.alert('Error', typeof error === 'string' ? error : 'No se pudo crear la consignación.'); return; }
    router.push(`/(app)/consignment/new/photos?id=${data.id}` as never);
  }

  return (
    <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={16} color="#000" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Consignar bien</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Progress */}
        <View style={s.progressSection}>
          <View style={s.progressTop}>
            <View style={s.progressLeft}>
              <Text style={s.stepLabel}>PASO 1 DE 3</Text>
              <Text style={s.stepTitle}>Datos del bien</Text>
            </View>
            <Text style={s.stepPct}>33% completado</Text>
          </View>
          <View style={s.progressTrack}>
            <View style={s.progressFill} />
          </View>
        </View>

        {/* Form */}
        <View style={s.form}>
          <FieldCard label="DESCRIPCIÓN DEL BIEN" required>
            <TextInput
              style={[INPUT.base, INPUT.multiline]}
              value={descripcion}
              onChangeText={setDescripcion}
              placeholder="Describí el estado, características únicas y origen del bien..."
              placeholderTextColor="#C6C6C6"
              multiline
              numberOfLines={4}
            />
          </FieldCard>

          <FieldCard label="CATEGORÍA">
            <View style={INPUT.base}>
              <TextInput
                style={{ fontSize: 16, fontFamily: fonts.medium, color: '#191C1D' }}
                value={categoria}
                onChangeText={setCategoria}
                placeholder="Arte, antigüedad, joyería..."
                placeholderTextColor="#6B7280"
              />
            </View>
          </FieldCard>

          <FieldCard label="VALOR ESTIMADO (ARS)">
            <View style={INPUT.dollar}>
              <Text style={INPUT.dollarSign}>$</Text>
              <TextInput
                style={INPUT.dollarInput}
                value={valorEstimado}
                onChangeText={setValorEstimado}
                placeholder="0.00"
                placeholderTextColor="#6B7280"
                keyboardType="decimal-pad"
              />
            </View>
          </FieldCard>

          {/* Toggles */}
          <View style={s.toggles}>
            <TogglePill label="Bien compuesto" checked={esCompuesto} onToggle={() => setEsCompuesto(!esCompuesto)} />
            <TogglePill label="Obra de arte" checked={esObraArte} onToggle={() => setEsObraArte(!esObraArte)} />
          </View>

          {/* Artwork section */}
          {esObraArte && (
            <View style={s.artworkOuter}>
              <View style={s.artworkInner}>
                <View style={s.artworkHeader}>
                  <Ionicons name="color-palette-outline" size={20} color="#191C1D" />
                  <Text style={s.artworkTitle}>Detalles de la obra</Text>
                </View>
                <View style={s.artworkFields}>
                  <View style={s.artworkField}>
                    <Text style={s.artworkFieldLabel}>ARTISTA / DISEÑADOR</Text>
                    <TextInput
                      style={INPUT.base}
                      value={artista}
                      onChangeText={setArtista}
                      placeholder="Nombre completo del creador"
                      placeholderTextColor="#6B7280"
                    />
                  </View>
                  <View style={s.artworkField}>
                    <Text style={s.artworkFieldLabel}>FECHA DE CREACIÓN</Text>
                    <TextInput
                      style={INPUT.base}
                      value={fechaCreacion}
                      onChangeText={setFechaCreacion}
                      placeholder="dd/mm/aaaa"
                      placeholderTextColor="#191C1D"
                      keyboardType="numbers-and-punctuation"
                    />
                  </View>
                  <View style={s.artworkField}>
                    <Text style={s.artworkFieldLabel}>HISTORIA / PROCEDENCIA</Text>
                    <TextInput
                      style={[INPUT.base, INPUT.multiline]}
                      value={historia}
                      onChangeText={setHistoria}
                      placeholder="Dueños anteriores, exposiciones, registros de subastas..."
                      placeholderTextColor="#C6C6C6"
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Submit */}
          <View style={s.submitSection}>
            <TouchableOpacity
              style={[s.submitBtn, loading && { opacity: 0.7 }]}
              onPress={handleNext}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? <ActivityIndicator color="#FFF" /> : (
                <>
                  <Text style={s.submitText}>Continuar</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFF" />
                </>
              )}
            </TouchableOpacity>
            <Text style={s.submitNote}>Toda la información es confidencial y está protegida.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#FFFFFF' },
  headerTitle: { fontSize: 16, fontFamily: fonts.semiBold, color: '#18181B', letterSpacing: -0.4 },
  content: { paddingHorizontal: 24, paddingBottom: 48, gap: 48 },
  progressSection: { paddingTop: 8, gap: 16 },
  progressTop: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  progressLeft: { gap: 4 },
  stepLabel: { fontSize: 12, fontFamily: fonts.semiBold, color: '#9ea8a6', letterSpacing: 1.2, textTransform: 'uppercase' },
  stepTitle: { fontSize: 24, fontFamily: fonts.medium, color: '#6b7573', letterSpacing: -1.2, lineHeight: 28 },
  stepPct: { fontSize: 13, fontFamily: fonts.medium, color: '#6b7573' },
  progressTrack: { height: 6, backgroundColor: '#EDEEEF', borderRadius: 99, overflow: 'hidden' },
  progressFill: { width: '25%', height: '100%', backgroundColor: '#000', borderRadius: 99 },
  form: { gap: 24 },
  toggles: { gap: 16 },
  artworkOuter: { backgroundColor: '#EDEEEF', borderRadius: 32, padding: 4 },
  artworkInner: { backgroundColor: '#FFF', borderRadius: 32, padding: 32, gap: 32 },
  artworkHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  artworkTitle: { fontSize: 20, fontFamily: fonts.bold, color: '#191C1D', lineHeight: 28, flex: 1 },
  artworkFields: { gap: 32 },
  artworkField: { gap: 8 },
  artworkFieldLabel: { fontSize: 12, fontFamily: fonts.semiBold, color: '#474747', letterSpacing: 0.6, textTransform: 'uppercase' },
  submitSection: { alignItems: 'center', paddingTop: 40, gap: 24 },
  submitBtn: {
    backgroundColor: '#000', borderRadius: 9999, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 12,
    paddingVertical: 20, paddingHorizontal: 48, width: '100%',
    shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.1, shadowRadius: 25, elevation: 8,
  },
  submitText: { fontSize: 18, fontFamily: fonts.semiBold, color: '#FFF' },
  submitNote: { fontSize: 12, fontFamily: fonts.medium, color: '#777', textAlign: 'center' },
});
