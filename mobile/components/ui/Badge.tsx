import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography, radius, spacing } from '@/constants/design';

type BadgeVariant = 'success' | 'error' | 'warning' | 'pending' | 'default';

type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
};

const variantMap: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: colors.successBg, text: colors.success },
  error: { bg: colors.errorBg, text: colors.error },
  warning: { bg: colors.warningBg, text: colors.warning },
  pending: { bg: colors.pendingBg, text: colors.pending },
  default: { bg: colors.pendingBg, text: colors.textSecondary },
};

export function Badge({ label, variant = 'default', style }: BadgeProps) {
  const { bg, text } = variantMap[variant];

  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={[styles.label, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  label: {
    ...typography.label,
    textTransform: 'uppercase',
  },
});
