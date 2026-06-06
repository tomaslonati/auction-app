import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ButtonPrimary } from '@/components/ui/Button';
import { colors, spacing, fonts } from '@/constants/design';

const GREEN = '#2D5A27';
const GREEN_LIGHT = '#EAF3E8';

export default function PendingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    email?: string;
    nombre?: string;
    apellido?: string;
    domicilio?: string;
    paisNombre?: string;
  }>();

  const nombreCompleto = [params.nombre, params.apellido].filter(Boolean).join(' ') || '—';
  const email      = params.email      || '—';
  const domicilio  = params.domicilio  || '—';
  const paisNombre = params.paisNombre || '—';

  return (
    <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Ícono */}
        <View style={s.iconWrap}>
          <Ionicons name="hourglass-outline" size={40} color={GREEN} />
        </View>

        {/* Título */}
        <Text style={s.title}>Estamos revisando{'\n'}tu solicitud</Text>
        <Text style={s.subtitle}>
          Te notificaremos por email una vez que hayamos validado tus documentos.
        </Text>

        {/* Email card */}
        <View style={s.card}>
          <View style={s.emailRow}>
            <View style={s.emailIconBox}>
              <Ionicons name="mail-outline" size={20} color="#474747" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.rowLabel}>Email de contacto</Text>
              <Text style={s.rowValueBold}>{email}</Text>
            </View>
          </View>
        </View>

        {/* Datos enviados */}
        <View style={s.card}>
          <Text style={s.sectionLabel}>TUS DATOS ENVIADOS</Text>

          <View style={s.dataRow}>
            <Text style={s.rowLabel}>Nombre completo</Text>
            <Text style={s.rowValue}>{nombreCompleto}</Text>
          </View>

          <View style={s.divider} />

          <View style={s.dataRow}>
            <Text style={s.rowLabel}>Domicilio declarado</Text>
            <Text style={s.rowValue}>{domicilio}</Text>
          </View>

          <View style={s.divider} />

          <View style={s.dataRow}>
            <Text style={s.rowLabel}>País</Text>
            <Text style={s.rowValue}>{paisNombre}</Text>
          </View>

          <View style={s.divider} />

          <View style={s.dataRowInline}>
            <View style={{ flex: 1 }}>
              <Text style={s.rowLabel}>Documento de identidad</Text>
              <Text style={s.rowValue}>Frente y dorso enviados</Text>
            </View>
            <View style={s.checkBadge}>
              <Ionicons name="checkmark" size={14} color="#FFF" />
            </View>
          </View>
        </View>

        {/* Info */}
        <View style={s.infoBox}>
          <Text style={s.infoText}>
            El proceso de revisión suele demorar entre 24 y 48 horas hábiles. Agradecemos tu paciencia.
          </Text>
        </View>
      </ScrollView>

      <View style={s.footer}>
        <ButtonPrimary
          label="Volver al inicio"
          onPress={() => router.replace('/(auth)')}
        />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.backgroundApp,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl * 2,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
    alignItems: 'stretch',
  },

  // Icon
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E4EAE3',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },

  // Texts
  title: {
    fontSize: 26,
    fontFamily: fonts.bold,
    color: '#191C1D',
    textAlign: 'center',
    letterSpacing: -0.8,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: '#474747',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },

  // Cards
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    color: '#808A88',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Email row
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  emailIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F3F4',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Data rows
  dataRow: {
    gap: 4,
  },
  dataRowInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowLabel: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: '#808A88',
  },
  rowValue: {
    fontSize: 15,
    fontFamily: fonts.medium,
    color: '#191C1D',
  },
  rowValueBold: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: '#191C1D',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E4E4E7',
  },

  // Check badge
  checkBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Info box
  infoBox: {
    backgroundColor: GREEN_LIGHT,
    borderRadius: 16,
    padding: spacing.lg,
  },
  infoText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: GREEN,
    lineHeight: 22,
  },

  // Footer
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.backgroundApp,
  },
});
