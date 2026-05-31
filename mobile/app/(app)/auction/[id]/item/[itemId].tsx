import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { colors, spacing, fonts } from '@/constants/design';

const { width } = Dimensions.get('window');

type Item = {
  id: string; numeroPieza: number; descripcion: string;
  estado: string; esObraArte: boolean; esCompuesto: boolean;
  precioBase?: number; artistaDisenador?: string;
  fechaCreacion?: string; historia?: string;
  images: { url: string; orden: number }[];
  components: { id: string; descripcion: string; orden: number }[];
  previousOwners: { nombre: string; orden: number }[];
  duenUser: { nombre: string; apellido: string } | null;
};

export default function ItemDetailScreen() {
  const { id, itemId } = useLocalSearchParams<{ id: string; itemId: string }>();
  const router = useRouter();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    api.get<Item>(`/api/auctions/${id}/catalog/${itemId}`).then(({ data }) => {
      if (data) setItem(data);
      setLoading(false);
    });
  }, [itemId]);

  if (loading) return <View style={styles.loader}><ActivityIndicator color={colors.textSecondary} /></View>;
  if (!item) return null;

  const inAuction = item.estado === 'en_subasta';

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color="#171C26" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pieza #{item.numeroPieza}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Gallery */}
        {item.images.length > 0 ? (
          <View>
            <Image source={{ uri: item.images[imgIdx]?.url }} style={styles.mainImg} resizeMode="cover" />
            {item.images.length > 1 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbRow} contentContainerStyle={{ gap: 8, paddingHorizontal: spacing.lg }}>
                {item.images.map((img, i) => (
                  <TouchableOpacity key={i} onPress={() => setImgIdx(i)}>
                    <Image source={{ uri: img.url }} style={[styles.thumb, i === imgIdx && styles.thumbActive]} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        ) : (
          <View style={styles.imgPlaceholder}>
            <Ionicons name="image-outline" size={48} color="#D0D9D7" />
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text style={styles.pieceNum}>Pieza #{item.numeroPieza}</Text>
            {item.precioBase != null && (
              <Text style={styles.price}>Base: ${Number(item.precioBase).toLocaleString('es-AR')}</Text>
            )}
          </View>

          <Text style={styles.desc}>{item.descripcion}</Text>

          {item.esObraArte && (
            <View style={styles.artCard}>
              <Text style={styles.sectionLabel}>OBRA DE ARTE</Text>
              {item.artistaDisenador && <Text style={styles.artText}>Artista: {item.artistaDisenador}</Text>}
              {item.fechaCreacion && <Text style={styles.artText}>Año: {new Date(item.fechaCreacion).getFullYear()}</Text>}
              {item.historia && <Text style={styles.artText}>{item.historia}</Text>}
              {item.previousOwners.length > 0 && (
                <>
                  <Text style={[styles.artText, { fontFamily: fonts.semiBold, marginTop: 6 }]}>Dueños anteriores:</Text>
                  {item.previousOwners.map((o, i) => <Text key={i} style={styles.artText}>• {o.nombre}</Text>)}
                </>
              )}
            </View>
          )}

          {item.esCompuesto && item.components.length > 0 && (
            <View style={styles.artCard}>
              <Text style={styles.sectionLabel}>ÍTEM COMPUESTO — {item.components.length} PIEZAS</Text>
              {item.components.map((c, i) => <Text key={i} style={styles.artText}>• {c.descripcion}</Text>)}
            </View>
          )}

          {item.duenUser && (
            <Text style={styles.owner}>Propietario actual: {item.duenUser.nombre} {item.duenUser.apellido}</Text>
          )}
        </View>
      </ScrollView>

      {inAuction && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.btn} onPress={() => router.push(`/(app)/auction/${id}/room` as never)} activeOpacity={0.85}>
            <Ionicons name="flash-outline" size={18} color="#FFF" />
            <Text style={styles.btnText}>Ir a la sala de subasta</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.backgroundApp },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: 14 },
  headerTitle: { fontSize: 16, fontFamily: fonts.semiBold, color: '#171C26' },
  mainImg: { width, height: 260 },
  imgPlaceholder: { width, height: 200, backgroundColor: '#E7ECEB', alignItems: 'center', justifyContent: 'center' },
  thumbRow: { marginTop: 10 },
  thumb: { width: 60, height: 60, borderRadius: 10, opacity: 0.6 },
  thumbActive: { opacity: 1, borderWidth: 2, borderColor: '#151515' },
  content: { padding: spacing.lg, gap: 14 },
  topRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  pieceNum: { fontSize: 13, fontFamily: fonts.semiBold, color: '#808A88' },
  price: { fontSize: 18, fontFamily: fonts.bold, color: '#171C26' },
  desc: { fontSize: 15, fontFamily: fonts.regular, color: '#1F2937', lineHeight: 22 },
  artCard: { backgroundColor: '#F8FBFB', borderRadius: 16, padding: spacing.md, gap: 6 },
  sectionLabel: { fontSize: 10, fontFamily: fonts.bold, color: '#6A7472', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 },
  artText: { fontSize: 14, fontFamily: fonts.regular, color: '#586160', lineHeight: 20 },
  owner: { fontSize: 13, fontFamily: fonts.regular, color: '#808A88' },
  footer: { paddingHorizontal: spacing.lg, paddingBottom: 40, paddingTop: 16 },
  btn: { backgroundColor: '#151515', borderRadius: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16 },
  btnText: { fontSize: 16, fontFamily: fonts.semiBold, color: '#FFFFFF' },
});
