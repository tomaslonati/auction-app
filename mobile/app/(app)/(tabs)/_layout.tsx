import { Tabs } from 'expo-router';
import { StyleSheet, View, Text } from 'react-native';
import { colors, fonts, spacing, radius } from '@/constants/design';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={[styles.tabItem, focused && styles.tabItemActive]}>
      <Text style={[styles.tabEmoji, focused && styles.tabEmojiActive]}>{emoji}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="⌂" label="Inicio" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="auctions"
        options={{
          title: 'Subastas',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="⚖" label="Subastas" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="◉" label="Profile" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 20,
    left: 24,
    right: 24,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderTopWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    paddingHorizontal: spacing.sm,
    paddingBottom: 0,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    gap: 2,
    minWidth: 80,
  },
  tabItemActive: {
    backgroundColor: '#F5F5F5',
  },
  tabEmoji: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  tabEmojiActive: {
    color: colors.textPrimary,
  },
  tabLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: fonts.medium,
  },
  tabLabelActive: {
    color: colors.textPrimary,
    fontFamily: fonts.semiBold,
  },
});
