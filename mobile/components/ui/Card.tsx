import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, shadow } from '@/constants/design';

type CardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
};

export function Card({ children, style, elevated = false }: CardProps) {
  return (
    <View style={[styles.card, elevated && shadow.card, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
});
