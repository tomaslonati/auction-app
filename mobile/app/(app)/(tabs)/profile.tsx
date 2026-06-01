import { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import { colors, typography, spacing, radius, fonts, shadow } from '@/constants/design';

const CATEGORIA_LABELS: Record<string, string> = {
  comun: 'CATEGORÍA COMÚN',
  especial: 'CATEGORÍA ESPECIAL',
  plata: 'CATEGORÍA PLATA',
  oro: 'CATEGORÍA ORO',
  platino: 'CATEGORÍA PLATINO',
};

type MenuItem = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
};

const MENU_ITEMS: MenuItem[] = [
  { label: 'Medios de pago', icon: 'card-outline', route: '/(app)/payment-methods' },
  { label: 'Historial', icon: 'time-outline', route: '/(app)/history' },
  { label: 'Métricas', icon: 'bar-chart-outline', route: '/(app)/metrics' },
  { label: 'Mis consignaciones', icon: 'file-tray-full-outline', route: '/(app)/consignment' },
  { label: 'Multas e impagos', icon: 'alert-circle-outline', route: '/(app)/penalties' },
  { label: 'Configuración', icon: 'settings-outline', route: '/(app)/settings' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, setUser, reset } = useAuthStore();

  useEffect(() => {
    api.get<typeof user>('/api/users/me').then(({ data }) => {
      if (data) setUser(data);
    });
  }, []);

  function handleLogout() {
    Alert.alert('Cerrar sesión', '¿Seguro que querés salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          reset();
          router.replace('/(auth)');
        },
      },
    ]);
  }

  const fullName = user ? `${user.nombre} ${user.apellido}` : '—';
  const categoria = user ? (CATEGORIA_LABELS[user.categoria] ?? (user.categoria ? user.categoria.toUpperCase() : '')) : '';

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Perfil</Text>
        </View>

        {/* Avatar + name */}
        <View style={styles.profileSection}>
          <View style={styles.avatarWrapper}>
            <LinearGradient
              colors={['#CCD4D2', '#6B7573']}
              style={styles.avatarGradient}
            >
              {user?.fotoPerfilUrl ? (
                <Image source={{ uri: user.fotoPerfilUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={48} color="rgba(255,255,255,0.6)" />
                </View>
              )}
            </LinearGradient>
            <TouchableOpacity style={styles.editButton} activeOpacity={0.8}>
              <Ionicons name="pencil" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.nameContainer}>
            <Text style={styles.name}>{fullName}</Text>
            <Text style={styles.categoria}>{categoria}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCIONES</Text>
          <View style={styles.menuList}>
            {MENU_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.route}
                style={styles.menuItem}
                onPress={() => router.push(item.route as never)}
                activeOpacity={0.7}
              >
                <View style={styles.iconCircle}>
                  <Ionicons name={item.icon} size={20} color={colors.textPrimary} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
          <Text style={styles.logoutText}>CERRAR SESIÓN</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.backgroundApp,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
    gap: spacing.lg,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? spacing.md : spacing.sm,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.textPrimary,
    letterSpacing: -0.64,
  },
  profileSection: {
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    padding: 3,
  },
  avatar: {
    width: 114,
    height: 114,
    borderRadius: 57,
  },
  avatarPlaceholder: {
    width: 114,
    height: 114,
    borderRadius: 57,
    backgroundColor: colors.textTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#182D28',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameContainer: {
    alignItems: 'center',
    gap: 4,
  },
  name: {
    fontSize: 20,
    fontFamily: fonts.medium,
    color: colors.textPrimary,
    letterSpacing: -1,
    lineHeight: 24,
  },
  categoria: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  section: {
    gap: spacing.md,
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: '#6A7472',
    letterSpacing: -0.42,
    textTransform: 'uppercase',
  },
  menuList: {
    gap: spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FBFB',
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.md,
    ...shadow.card,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EDEEEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: '#1F2937',
    letterSpacing: -0.64,
  },
  logoutButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  logoutText: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: '#BA1A1A',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
});
