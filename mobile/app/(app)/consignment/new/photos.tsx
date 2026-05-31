import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { api } from '@/lib/api';
import { colors, spacing, fonts } from '@/constants/design';

const MIN_PHOTOS = 6;

type Photo = { uri: string; uploaded: boolean; publicUrl?: string };

export default function ConsignmentPhotosScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const newPhotos: Photo[] = result.assets.map((a) => ({ uri: a.uri, uploaded: false }));
      setPhotos((prev) => [...prev, ...newPhotos]);
    }
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara.'); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) {
      setPhotos((prev) => [...prev, { uri: result.assets[0].uri, uploaded: false }]);
    }
  }

  function removePhoto(idx: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  }

  async function uploadAndContinue() {
    if (photos.length < MIN_PHOTOS) {
      Alert.alert('Faltan fotos', `Necesitás al menos ${MIN_PHOTOS} fotos. Tenés ${photos.length}.`);
      return;
    }
    setLoading(true);

    const uploaded: { url: string; orden: number }[] = [];

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const filename = `photo_${i}.jpg`;

      // Get signed upload URL
      const { data: urlData, error: urlError } = await api.post<{ uploadUrl: string; publicUrl: string }>('/api/storage/upload-url', {
        filename, contentType: 'image/jpeg', folder: 'consignments',
      });
      if (urlError || !urlData) { Alert.alert('Error', `No se pudo subir la foto ${i + 1}.`); setLoading(false); return; }

      // Upload to Supabase Storage
      const blob = await (await fetch(photo.uri)).blob();
      const uploadRes = await fetch(urlData.uploadUrl, { method: 'PUT', body: blob, headers: { 'Content-Type': 'image/jpeg' } });
      if (!uploadRes.ok) { Alert.alert('Error', `Error al subir la foto ${i + 1}.`); setLoading(false); return; }

      uploaded.push({ url: urlData.publicUrl, orden: i });
    }

    // Save photos to consignment
    const { error } = await api.post(`/api/consignments/${id}/photos`, { photos: uploaded });
    setLoading(false);
    if (error) { Alert.alert('Error', typeof error === 'string' ? error : 'No se pudieron guardar las fotos.'); return; }
    router.push(`/(app)/consignment/new/declaration?id=${id}` as never);
  }

  const remaining = Math.max(0, MIN_PHOTOS - photos.length);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color="#171C26" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fotos del bien</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.stepBar}>
        <View style={styles.stepDone} /><View style={styles.stepActive} /><View style={styles.stepInactive} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>PASO 2 DE 3</Text>
        <Text style={styles.sectionMainTitle}>Fotos del bien</Text>

        <View style={styles.progressBox}>
          <Text style={styles.progressText}>
            {photos.length} / {MIN_PHOTOS} fotos mínimas
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(100, (photos.length / MIN_PHOTOS) * 100)}%` }]} />
          </View>
          {remaining > 0 && <Text style={styles.progressHint}>Faltan {remaining} foto{remaining > 1 ? 's' : ''}</Text>}
        </View>

        <View style={styles.grid}>
          {photos.map((p, i) => (
            <View key={i} style={styles.photoCard}>
              <Image source={{ uri: p.uri }} style={styles.photo} />
              <TouchableOpacity style={styles.removeBtn} onPress={() => removePhoto(i)}>
                <Ionicons name="close-circle" size={22} color="#DC2626" />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={styles.addCard} onPress={pickImage}>
            <Ionicons name="images-outline" size={28} color="#808A88" />
            <Text style={styles.addText}>Galería</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.addCard} onPress={takePhoto}>
            <Ionicons name="camera-outline" size={28} color="#808A88" />
            <Text style={styles.addText}>Cámara</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btn, (photos.length < MIN_PHOTOS || loading) && styles.btnDisabled]}
          onPress={uploadAndContinue}
          disabled={photos.length < MIN_PHOTOS || loading}
          activeOpacity={0.85}
        >
          {loading ? <ActivityIndicator color="#FFF" /> : (
            <>
              <Text style={styles.btnText}>Continuar — Declaración</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: 14 },
  headerTitle: { fontSize: 16, fontFamily: fonts.semiBold, color: '#18181B' },
  stepBar: { flexDirection: 'row', gap: 6, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  stepDone: { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#5b5f5c' },
  stepActive: { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#151515' },
  stepInactive: { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#D0D9D7' },
  sectionTitle: { fontSize: 12, fontFamily: fonts.semiBold, color: '#9ea8a6', letterSpacing: 1.2, textTransform: 'uppercase' },
  sectionMainTitle: { fontSize: 24, fontFamily: fonts.medium, color: '#6b7573', letterSpacing: -1.2, lineHeight: 28 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: 24, gap: spacing.lg },
  progressBox: { backgroundColor: '#F8FBFB', borderRadius: 16, padding: spacing.md, gap: 8 },
  progressText: { fontSize: 15, fontFamily: fonts.semiBold, color: '#171C26' },
  progressBar: { height: 6, borderRadius: 3, backgroundColor: '#E7ECEB', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: '#22C55E' },
  progressHint: { fontSize: 12, fontFamily: fonts.regular, color: '#808A88' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoCard: { width: '30%', aspectRatio: 1, borderRadius: 12, overflow: 'visible' },
  photo: { width: '100%', height: '100%', borderRadius: 12 },
  removeBtn: { position: 'absolute', top: -8, right: -8, backgroundColor: '#FFF', borderRadius: 12 },
  addCard: { width: '30%', aspectRatio: 1, borderRadius: 12, backgroundColor: '#F0F4F3', alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1.5, borderColor: '#D0D9D7', borderStyle: 'dashed' },
  addText: { fontSize: 11, fontFamily: fonts.regular, color: '#808A88' },
  footer: { paddingHorizontal: spacing.lg, paddingBottom: 40, paddingTop: 16 },
  btn: { backgroundColor: '#151515', borderRadius: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16 },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontSize: 16, fontFamily: fonts.semiBold, color: '#FFFFFF' },
});
