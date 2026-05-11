import { View, Text, StyleSheet, Platform } from 'react-native';
import { ButtonOutline } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { colors, typography, spacing, fonts } from '@/constants/design';

export default function PendingScreen() {
  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.icon}>📋</Text>
        <Text style={styles.title}>Solicitud enviada</Text>
        <Text style={styles.subtitle}>Tu solicitud está siendo revisada</Text>
        <Text style={styles.body}>
          Recibirás un email cuando tu cuenta sea aprobada. El proceso puede demorar hasta 48 horas hábiles.
        </Text>
      </View>
      <View style={styles.footer}>
        <ButtonOutline
          label="Cerrar sesión"
          onPress={() => supabase.auth.signOut()}
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
    paddingHorizontal: spacing.lg,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  icon: {
    fontSize: 64,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
    fontFamily: fonts.semiBold,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  body: {
    ...typography.small,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  footer: {
    paddingBottom: Platform.OS === 'ios' ? 40 : spacing.lg,
    paddingTop: spacing.md,
  },
});
