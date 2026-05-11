import { Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, typography, spacing } from '@/constants/design';

type SectionLabelProps = {
  children: string;
  style?: TextStyle;
  containerStyle?: ViewStyle;
};

export function SectionLabel({ children, style }: SectionLabelProps) {
  return (
    <Text style={[styles.label, style]}>{children}</Text>
  );
}

const styles = StyleSheet.create({
  label: {
    ...typography.label,
    color: colors.textTertiary,
    marginBottom: spacing.sm,
  },
});
