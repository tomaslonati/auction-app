import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { api } from '@/lib/api';
import { colors, spacing, fonts } from '@/constants/design';

type ConsignmentStatus =
  | 'en_evaluacion'
  | 'aceptado'
  | 'rechazado'
  | 'en_deposito'
  | 'subastado'
  | 'vendido';

type Consignment = {
  id: string;
  descripcion: string;
  categoria: string | null;
  valorEstimado: number | null;
  estado: ConsignmentStatus;
  photos: { url: string; orden: number }[];
};

const STATUS_LABELS: Record<ConsignmentStatus, string> = {
  en_evaluacion: 'EN EVALUACIÓN',
  aceptado: 'APROBADA',
  rechazado: 'RECHAZADA',
  en_deposito: 'EN DEPÓSITO',
  subastado: 'SUBASTADO',
  vendido: 'VENDIDO',
};

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function ConsignmentCard({ item, onPress }: { item: Consignment; onPress: () => void }) {
  const firstPhoto = item.photos.sort((a, b) => a.orden - b.orden)[0];

  return (
    <View style={card.container}>
      {/* Image */}
      <View style={card.imageContainer}>
        {firstPhoto ? (
          <Image source={{ uri: firstPhoto.url }} style={card.image} resizeMode="cover" />
        ) : (
          <View style={card.imagePlaceholder}>
            <Ionicons name="image-outline" size={40} color="#AAAAAA" />
          </View>
        )}
        <View style={card.badge}>
          <Text style={card.badgeText}>{STATUS_LABELS[item.estado]}</Text>
        </View>
      </View>

      {/* Content */}
      <View style={card.content}>
        <Text style={card.title} numberOfLines={2}>{item.descripcion}</Text>
        {item.categoria ? (
          <Text style={card.category}>{item.categoria.toUpperCase()}</Text>
        ) : null}

        <View style={card.footer}>
          <View style={card.priceBlock}>
            <Text style={card.priceLabel}>VALOR ESTIMADO</Text>
            <View style={card.priceRow}>
              <Text style={card.price}>
                {item.valorEstimado ? formatCurrency(Number(item.valorEstimado)) : '—'}
              </Text>
              {item.valorEstimado ? <Text style={card.priceCurrency}>USD</Text> : null}
            </View>
          </View>

          <TouchableOpacity style={card.button} onPress={onPress} activeOpacity={0.8}>
            <Text style={card.buttonText}>Ver detalle</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function ConsignmentScreen() {
  const router = useRouter();
  const [consignments, setConsignments] = useState<Consignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Consignment[]>('/api/consignments').then(({ data }) => {
      if (data) setConsignments(data);
      setLoading(false);
    });
  }, []);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader title="Consignaciones" />

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.textSecondary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.titleSection}>
            <Text style={styles.title}>Mis consignaciones</Text>
            <Text style={styles.subtitle}>Consulta el estado de tus consignaciones</Text>
          </View>

          {consignments.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="file-tray-outline" size={48} color="#AAAAAA" />
              <Text style={styles.emptyText}>Aún no tenés consignaciones</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {consignments.map((item) => (
                <ConsignmentCard
                  key={item.id}
                  item={item}
                  onPress={() => router.push(`/(app)/consignment/${item.id}` as never)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}
      <View style={styles.fab}>
        <TouchableOpacity style={styles.fabBtn} onPress={() => router.push('/(app)/consignment/new/item-data' as never)} activeOpacity={0.85}>
          <Ionicons name="add" size={22} color="#FFF" />
          <Text style={styles.fabText}>Nueva consignación</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
    gap: spacing.xl,
  },
  titleSection: {
    gap: 4,
    paddingTop: spacing.md,
  },
  title: {
    fontSize: 28,
    fontFamily: fonts.bold,
    color: '#191C1D',
    letterSpacing: -0.9,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: '#474747',
    lineHeight: 24,
  },
  list: {
    gap: spacing.lg,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    gap: spacing.md,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  fab: { position: 'absolute', bottom: 32, left: 20, right: 20 },
  fabBtn: { backgroundColor: '#151515', borderRadius: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, paddingHorizontal: 20 },
  fabText: { fontSize: 15, fontFamily: fonts.semiBold, color: '#FFFFFF' },
});

const card = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#F1F4F3',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F1F4F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#5B5F5C',
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: '#F6F9F4',
    letterSpacing: -0.4,
  },
  content: {
    padding: 28,
    gap: 4,
  },
  title: {
    fontSize: 20,
    fontFamily: fonts.semiBold,
    color: '#2C3434',
    letterSpacing: -0.5,
    lineHeight: 24,
  },
  category: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: '#586160',
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 20,
  },
  priceBlock: {
    gap: 2,
  },
  priceLabel: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: '#586160',
    textTransform: 'uppercase',
    lineHeight: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  price: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: '#2C3434',
    letterSpacing: -0.96,
    lineHeight: 32,
  },
  priceCurrency: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: '#586160',
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#151515',
    borderRadius: 9999,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  buttonText: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: '#F6F9F4',
    lineHeight: 20,
  },
  fab: { position: 'absolute', bottom: 32, left: 20, right: 20 },
  fabBtn: { backgroundColor: '#151515', borderRadius: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, paddingHorizontal: 20 },
  fabText: { fontSize: 15, fontFamily: fonts.semiBold, color: '#FFFFFF' },
});
