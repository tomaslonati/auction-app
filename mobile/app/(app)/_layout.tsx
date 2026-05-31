import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />

      {/* Medios de pago */}
      <Stack.Screen name="payment-methods/index" />
      <Stack.Screen name="payment-methods/add" options={{ presentation: 'modal' }} />
      <Stack.Screen name="payment-methods/add-credit-card" options={{ presentation: 'modal' }} />
      <Stack.Screen name="payment-methods/add-bank-account" options={{ presentation: 'modal' }} />
      <Stack.Screen name="payment-methods/add-check" options={{ presentation: 'modal' }} />

      {/* Subastas */}
      <Stack.Screen name="auction/[id]/index" />
      <Stack.Screen name="auction/[id]/catalog" />
      <Stack.Screen name="auction/[id]/item/[itemId]" />
      <Stack.Screen name="auction/[id]/room" />
      <Stack.Screen name="auction/[id]/stream" />

      {/* Consignación */}
      <Stack.Screen name="consignment/index" />
      <Stack.Screen name="consignment/new/item-data" />
      <Stack.Screen name="consignment/new/photos" />
      <Stack.Screen name="consignment/new/declaration" />
      <Stack.Screen name="consignment/[id]" />

      {/* Historial */}
      <Stack.Screen name="history/index" />
      <Stack.Screen name="history/[auctionId]" />

      {/* Multas */}
      <Stack.Screen name="penalties" />

      {/* Configuración */}
      <Stack.Screen name="settings" />
    </Stack>
  );
}
