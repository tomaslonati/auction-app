import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import { colors, spacing, fonts } from '@/constants/design';

function SettingRow({ icon, label, onPress, danger = false }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; danger?: boolean }) {
  return (
    <TouchableOpacity style={row.container} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon} size={20} color={danger ? '#DC2626' : '#586160'} />
      <Text style={[row.label, danger && row.labelDanger]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color="#D0D9D7" />
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { setSession, setUser } = useAuthStore();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    Alert.alert('Cerrar sesión', '¿Estás seguro de que querés cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión', style: 'destructive', onPress: async () => {
          setLoggingOut(true);
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setLoggingOut(false);
        },
      },
    ]);
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Eliminar cuenta',
      'Esta acción es irreversible. Tu cuenta quedará bloqueada. No podrás hacerlo si tenés compras pendientes.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive', onPress: async () => {
            const { error } = await api.delete('/api/users/me');
            if (error) { Alert.alert('Error', typeof error === 'string' ? error : 'No se pudo eliminar la cuenta.'); return; }
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color="#171C26" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuración</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CUENTA</Text>
          <View style={styles.group}>
            <SettingRow icon="key-outline" label="Cambiar contraseña" onPress={() => router.push('/(auth)/set-password' as never)} />
            <View style={styles.divider} />
            <SettingRow icon="card-outline" label="Métodos de pago" onPress={() => router.push('/(app)/payment-methods/index' as never)} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>NOTIFICACIONES</Text>
          <View style={styles.group}>
            <View style={row.container}>
              <Ionicons name="notifications-outline" size={20} color="#586160" />
              <Text style={row.label}>Notificaciones push</Text>
              <Text style={styles.comingSoon}>Próximamente</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SOPORTE</Text>
          <View style={styles.group}>
            <View style={row.container}>
              <Ionicons name="mail-outline" size={20} color="#586160" />
              <Text style={row.label}>soporte@aucty.com.ar</Text>
            </View>
            <View style={styles.divider} />
            <View style={row.container}>
              <Ionicons name="document-text-outline" size={20} color="#586160" />
              <Text style={row.label}>Términos y condiciones</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.group}>
            <SettingRow icon="log-out-outline" label="Cerrar sesión" onPress={handleLogout} />
            <View style={styles.divider} />
            <SettingRow icon="trash-outline" label="Eliminar cuenta" onPress={handleDeleteAccount} danger />
          </View>
        </View>

        <Text style={styles.version}>Aucty v1.0.0 · Desarrollado para DAI 2026</Text>
      </ScrollView>

      {loggingOut && (
        <View style={styles.overlay}>
          <ActivityIndicator color="#FFF" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.backgroundApp },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: 14 },
  headerTitle: { fontSize: 16, fontFamily: fonts.semiBold, color: '#171C26' },
  content: { paddingHorizontal: spacing.lg, paddingBottom: 40, gap: 24 },
  section: { gap: 8 },
  sectionLabel: { fontSize: 10, fontFamily: fonts.bold, color: '#6A7472', letterSpacing: 0.5, textTransform: 'uppercase', paddingHorizontal: 4 },
  group: { backgroundColor: '#F8FBFB', borderRadius: 20, overflow: 'hidden' },
  divider: { height: 1, backgroundColor: '#F0F4F3', marginHorizontal: spacing.md },
  comingSoon: { fontSize: 11, fontFamily: fonts.regular, color: '#D0D9D7', marginLeft: 'auto' },
  version: { fontSize: 12, fontFamily: fonts.regular, color: '#D0D9D7', textAlign: 'center', marginTop: 8 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
});

const row = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: spacing.md, paddingVertical: 16 },
  label: { flex: 1, fontSize: 15, fontFamily: fonts.regular, color: '#1F2937' },
  labelDanger: { color: '#DC2626' },
});
