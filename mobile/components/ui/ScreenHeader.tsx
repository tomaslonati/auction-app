import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography, spacing } from '@/constants/design';

type ScreenHeaderProps = {
  title: string;
  onBack?: () => void;
  style?: ViewStyle;
  rightElement?: React.ReactNode;
};

export function ScreenHeader({ title, onBack, style, rightElement }: ScreenHeaderProps) {
  const router = useRouter();
  const handleBack = onBack ?? (() => router.back());

  return (
    <View style={[styles.header, style]}>
      <TouchableOpacity onPress={handleBack} style={styles.backButton} hitSlop={8}>
        <Text style={styles.backArrow}>‹</Text>
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.right}>{rightElement ?? null}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  backButton: {
    width: 32,
    alignItems: 'flex-start',
  },
  backArrow: {
    fontSize: 28,
    color: colors.textPrimary,
    lineHeight: 32,
    fontWeight: '300',
  },
  title: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  right: {
    width: 32,
    alignItems: 'flex-end',
  },
});
