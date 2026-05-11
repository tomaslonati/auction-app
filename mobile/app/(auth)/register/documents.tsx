import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ButtonPrimary } from '@/components/ui/Button';
import { uploadImageToStorage } from '@/lib/uploadImage';
import { useAuthStore } from '@/lib/store';
import { colors, typography, spacing, radius, fonts } from '@/constants/design';

type Step = 'frente' | 'dorso' | 'foto';

const STEPS: Step[] = ['frente', 'dorso', 'foto'];

const STEP_LABELS: Record<Step, string> = {
  frente: 'Frente del DNI',
  dorso: 'Dorso del DNI',
  foto: 'Foto de perfil',
};

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export default function DocumentsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    email: string;
    nombre: string;
    apellido: string;
    domicilio: string;
    numeroPais: string;
  }>();

  const setPendingRegistration = useAuthStore((s) => s.setPendingRegistration);

  const [currentStep, setCurrentStep] = useState<Step>('frente');
  const [images, setImages] = useState<Partial<Record<Step, string>>>({});
  const [loading, setLoading] = useState(false);

  const stepIndex = STEPS.indexOf(currentStep);
  const progress = (stepIndex + 1) / STEPS.length;

  async function pickImage(source: 'camera' | 'gallery') {
    let result;

    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a tu cámara.');
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        quality: 0.8,
        allowsEditing: true,
        aspect: currentStep === 'foto' ? [1, 1] : [4, 3],
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        quality: 0.8,
        allowsEditing: true,
        aspect: currentStep === 'foto' ? [1, 1] : [4, 3],
      });
    }

    if (!result.canceled && result.assets[0]) {
      setImages((prev) => ({ ...prev, [currentStep]: result.assets[0].uri }));
    }
  }

  function showImagePicker() {
    Alert.alert('Seleccionar imagen', 'Elegí una opción', [
      { text: 'Cámara', onPress: () => pickImage('camera') },
      { text: 'Galería', onPress: () => pickImage('gallery') },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  function handleContinue() {
    if (!images[currentStep]) {
      Alert.alert('Imagen requerida', 'Por favor seleccioná una imagen antes de continuar.');
      return;
    }

    const nextIndex = stepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex]);
    } else {
      handleSubmit();
    }
  }

  async function handleSubmit() {
    if (!images.frente || !images.dorso || !images.foto) return;
    setLoading(true);

    try {
      // Upload document images to Supabase Storage
      const [frenteUrl, dorsoUrl] = await Promise.all([
        uploadImageToStorage(images.frente, 'docs'),
        uploadImageToStorage(images.dorso, 'docs'),
      ]);

      // Call public registration endpoint (no auth required)
      const response = await fetch(`${API_URL}/api/auth/register/step1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: params.email,
          nombre: params.nombre,
          apellido: params.apellido,
          domicilio: params.domicilio,
          numeroPais: parseInt(params.numeroPais, 10),
          fotoDocFrenteUrl: frenteUrl,
          fotoDocDorsoUrl: dorsoUrl,
        }),
      });

      const json = await response.json();
      console.log('[step1] status:', response.status, 'body:', JSON.stringify(json));

      if (!response.ok || json.error) {
        const msg =
          typeof json.error === 'string'
            ? json.error
            : JSON.stringify(json.error) ?? 'Revisá los datos ingresados e intentá nuevamente.';
        Alert.alert(`Error ${response.status}`, msg);
        return;
      }

      // Store userId and email so set-password can complete registration
      setPendingRegistration(json.data.userId, params.email);

      router.replace('/(auth)/register/pending');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[documents] upload error:', msg);
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  const currentImage = images[currentStep];
  const isProfile = currentStep === 'foto';

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Onboarding" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Step indicator */}
        <View style={styles.stepContainer}>
          <Text style={styles.stepNumber}>02</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
        </View>

        <Text style={styles.title}>{STEP_LABELS[currentStep]}</Text>

        {/* Image upload area */}
        <TouchableOpacity onPress={showImagePicker} activeOpacity={0.8} style={styles.uploadArea}>
          {currentImage ? (
            isProfile ? (
              <View style={styles.profileImageWrapper}>
                <Image source={{ uri: currentImage }} style={styles.profileImage} />
                <View style={styles.profileEditBadge}>
                  <Text style={styles.profileEditIcon}>✎</Text>
                </View>
              </View>
            ) : (
              <Image source={{ uri: currentImage }} style={styles.docImage} resizeMode="cover" />
            )
          ) : isProfile ? (
            <View style={styles.profilePlaceholder}>
              <Text style={styles.profilePlaceholderIcon}>◉</Text>
              <View style={styles.profileEditBadge}>
                <Text style={styles.profileEditIcon}>✎</Text>
              </View>
            </View>
          ) : (
            <View style={styles.docPlaceholder}>
              <Text style={styles.docPlaceholderIcon}>🪪</Text>
              <Text style={styles.docPlaceholderText}>Tocá para agregar</Text>
            </View>
          )}
        </TouchableOpacity>

        {isProfile && (
          <Text style={styles.profileHint}>Seleccioná una imagen</Text>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <ButtonPrimary
          label={stepIndex < STEPS.length - 1 ? 'Continuar' : 'Enviar solicitud'}
          onPress={handleContinue}
          loading={loading}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.backgroundApp,
    paddingTop: Platform.OS === 'ios' ? 56 : 32,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 120,
    gap: spacing.xl,
  },
  stepContainer: {
    gap: spacing.sm,
  },
  stepNumber: {
    fontSize: 48,
    fontFamily: fonts.regular,
    color: colors.textTertiary,
    lineHeight: 52,
  },
  progressBar: {
    height: 3,
    backgroundColor: colors.divider,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.textSecondary,
    borderRadius: radius.full,
  },
  title: {
    ...typography.h1,
    color: colors.textTertiary,
    fontFamily: fonts.regular,
  },
  uploadArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  docPlaceholder: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.divider,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  docPlaceholderIcon: {
    fontSize: 48,
  },
  docPlaceholderText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  docImage: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: radius.xl,
  },
  profilePlaceholder: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.textTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePlaceholderIcon: {
    fontSize: 64,
    color: 'rgba(255,255,255,0.4)',
  },
  profileImageWrapper: {
    position: 'relative',
  },
  profileImage: {
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  profileEditBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileEditIcon: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  profileHint: {
    ...typography.body,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.backgroundApp,
  },
});
