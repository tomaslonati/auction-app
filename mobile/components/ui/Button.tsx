import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { colors, typography, radius, spacing } from '@/constants/design';

type ButtonProps = {
  onPress: () => void;
  label: string;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
};

export function ButtonPrimary({ onPress, label, loading, disabled, style, icon }: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.primary, (disabled || loading) && styles.disabled, style]}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={colors.textOnPrimary} />
      ) : (
        <>
          {icon}
          <Text style={styles.primaryText}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

export function ButtonOutline({ onPress, label, loading, disabled, style, icon }: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.outline, (disabled || loading) && styles.disabled, style]}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <>
          {icon}
          <Text style={styles.outlineText}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  primary: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 56,
  },
  primaryText: {
    ...typography.bodyMedium,
    color: colors.textOnPrimary,
  },
  outline: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 56,
    backgroundColor: 'transparent',
  },
  outlineText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  disabled: {
    opacity: 0.5,
  },
});
