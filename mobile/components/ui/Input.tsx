import { TextInput, View, Text, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { colors, typography, radius, spacing } from '@/constants/design';

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  variant?: 'auth' | 'app';
  containerStyle?: ViewStyle;
};

export function Input({ label, error, variant = 'app', containerStyle, style, ...props }: InputProps) {
  const isAuth = variant === 'auth';

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && (
        <Text style={[styles.label, isAuth && styles.labelAuth]}>{label}</Text>
      )}
      <TextInput
        style={[
          styles.input,
          isAuth ? styles.inputAuth : styles.inputApp,
          error && styles.inputError,
          style,
        ]}
        placeholderTextColor={isAuth ? 'rgba(255,255,255,0.5)' : colors.textPlaceholder}
        {...props}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
  },
  labelAuth: {
    color: 'rgba(255,255,255,0.7)',
  },
  input: {
    borderRadius: radius.full,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    minHeight: 48,
  },
  inputAuth: {
    backgroundColor: colors.inputAuthBg,
    color: colors.textInverted,
  },
  inputApp: {
    backgroundColor: colors.inputAppBg,
    color: colors.textPrimary,
  },
  inputError: {
    borderWidth: 1,
    borderColor: colors.error,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 2,
  },
});
