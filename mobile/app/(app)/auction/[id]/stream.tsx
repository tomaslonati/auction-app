import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useState } from 'react';
import { fonts, spacing } from '@/constants/design';

const STREAMING_URL = 'https://jugá.en.fantasy.ciranops.club';

export default function StreamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Streaming en vivo</Text>
        <View style={{ width: 24 }} />
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="wifi-outline" size={40} color="rgba(255,255,255,0.5)" />
          <Text style={styles.errorTitle}>Error de conexión</Text>
          <Text style={styles.errorDesc}>No se pudo cargar el streaming. Verificá tu conexión a internet.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => setError(false)}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator color="#FFFFFF" size="large" />
              <Text style={styles.loadingText}>Cargando stream...</Text>
            </View>
          )}
          <WebView
            source={{ uri: STREAMING_URL }}
            style={styles.webview}
            onLoadEnd={() => setLoading(false)}
            onError={() => { setError(true); setLoading(false); }}
            allowsFullscreenVideo
            mediaPlaybackRequiresUserAction={false}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: 14, backgroundColor: '#000' },
  headerTitle: { fontSize: 16, fontFamily: fonts.semiBold, color: '#FFFFFF' },
  webview: { flex: 1 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', gap: 16, zIndex: 10 },
  loadingText: { fontSize: 14, fontFamily: fonts.regular, color: 'rgba(255,255,255,0.7)' },
  errorBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 40 },
  errorTitle: { fontSize: 20, fontFamily: fonts.semiBold, color: '#FFFFFF' },
  errorDesc: { fontSize: 14, fontFamily: fonts.regular, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 20 },
  retryBtn: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 32, paddingVertical: 12, paddingHorizontal: 28, marginTop: 8 },
  retryText: { fontSize: 15, fontFamily: fonts.semiBold, color: '#FFFFFF' },
});
