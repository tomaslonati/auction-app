import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, fonts } from '@/constants/design';

// P-13: Home — implementado en Fase 2
export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.greeting}>Hola 👋</Text>
        <Text style={styles.subtitle}>Pantalla Home — Fase 2</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.backgroundApp,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.sm,
  },
  greeting: {
    ...typography.h2,
    color: colors.textPrimary,
    fontFamily: fonts.semiBold,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
