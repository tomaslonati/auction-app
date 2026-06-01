import { Tabs } from 'expo-router';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '@/constants/design';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({
  icon, iconActive, label, focused,
}: { icon: IconName; iconActive: IconName; label: string; focused: boolean }) {
  return (
    <View style={styles.tabItem}>
      <Ionicons
        name={focused ? iconActive : icon}
        size={24}
        color={focused ? '#1A1A1A' : '#9EA8A6'}
      />
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
        {label}
      </Text>
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
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="home-outline" iconActive="home" label="Inicio" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="auctions"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="scale-outline" iconActive="scale" label="Subastas" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="person-outline" iconActive="person" label="Perfil" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E4E4E7',
    height: 80,
    paddingBottom: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: '#9EA8A6',
  },
  tabLabelActive: {
    fontFamily: fonts.semiBold,
    color: '#1A1A1A',
  },
});
