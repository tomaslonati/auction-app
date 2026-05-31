import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { api } from '@/lib/api';
import { spacing, fonts } from '@/constants/design';

type CategoryBreakdown = Record<string, { subastas: number; ganados: number }>;
type Metrics = {
  categoria: string | null; totalSubastas: number; itemsGanados: number;
  ratioExito: number; totalOfertado: number; totalPagado: number;
  desglosePorCategoria: CategoryBreakdown;
};

const CAT_LABELS: Record<string, string> = { comun: 'Común', especial: 'Especial', plata: 'Plata', oro: 'Oro', platino: 'Platino' };
const CAT_COLORS = ['#000000', '#3A3C3C', '#6B7280', '#9CA3AF', '#D1D5DB'];

function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const size = 128;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((acc, d) => acc + d.value, 0) || 1;
  const totalItems = data.reduce((acc, d) => acc + d.value, 0);

  let offset = 0;
  const segments = data.map((d) => {
    const ratio = d.value / total;
    const dash = ratio * circumference;
    const gap = circumference - dash;
    const seg = { ...d, dash, gap, offset, ratio };
    offset += dash;
    return seg;
  });

  return (
    <View style={dc.container}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#E5E7EB" strokeWidth={strokeWidth} fill="none" />
        {segments.map((seg, i) => (
          <Circle
            key={i}
            cx={size / 2} cy={size / 2} r={radius}
            stroke={seg.color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${seg.dash} ${seg.gap}`}
            strokeDashoffset={-seg.offset}
            strokeLinecap="butt"
          />
        ))}
      </Svg>
      <View style={dc.center}>
        <Text style={dc.centerText}>{totalItems}</Text>
      </View>
    </View>
  );
}

const dc = StyleSheet.create({
  container: { width: 128, height: 128, alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  centerText: { fontSize: 20, fontFamily: fonts.bold, color: '#191C1D' },
});

function MetricSection({ label, value, description }: { label: string; value: string; description: string }) {
  return (
    <View style={ms.container}>
      <Text style={ms.label}>{label}</Text>
      <Text style={ms.value}>{value}</Text>
      <View style={ms.divider} />
      <Text style={ms.desc}>{description}</Text>
    </View>
  );
}

const ms = StyleSheet.create({
  container: { paddingVertical: 16, gap: 4 },
  label: { fontSize: 12, fontFamily: fonts.regular, color: '#000', textTransform: 'uppercase' },
  value: { fontSize: 30, fontFamily: fonts.regular, color: '#000', lineHeight: 36, paddingBottom: 4 },
  divider: { height: 1, backgroundColor: '#000', marginBottom: 0 },
  desc: { fontSize: 10, fontFamily: fonts.regular, color: '#000', marginTop: 9 },
});

export default function MetricsScreen() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Metrics>('/api/users/me/metrics').then(({ data }) => {
      if (data) setMetrics(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <View style={s.loader}><ActivityIndicator color="#6B7573" /></View>;
  if (!metrics) return null;

  const cats = Object.entries(metrics.desglosePorCategoria);
  const totalBids = cats.reduce((acc, [, v]) => acc + v.subastas, 0);
  const chartData = cats.map(([cat, val], i) => ({
    label: CAT_LABELS[cat] ?? cat,
    value: val.subastas,
    color: CAT_COLORS[i % CAT_COLORS.length],
    pct: totalBids > 0 ? Math.round((val.subastas / totalBids) * 100) : 0,
  }));

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={20} color="#000" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Métricas</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        {/* Title block */}
        <View style={s.titleBlock}>
          <Text style={s.title}>Métricas estadísticas</Text>
          <Text style={s.subtitle}>Algunos datos sobre tu participación en subastas a lo largo del año</Text>
        </View>

        {/* Top stats cards */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statLabel}>TOTAL SUBASTAS</Text>
            <Text style={s.statValue}>{metrics.totalSubastas}</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statLabel}>ITEMS GANADOS</Text>
            <Text style={s.statValue}>{metrics.itemsGanados}</Text>
          </View>
        </View>

        {/* Big metric sections */}
        <View style={s.sections}>
          <MetricSection
            label="TOTAL PAGADO"
            value={`$${Number(metrics.totalPagado).toLocaleString('es-AR')}`}
            description="Por la compra de artículos de subasta"
          />
          <MetricSection
            label="RATIO DE ÉXITO"
            value={`${(metrics.ratioExito * 100).toFixed(0)}%`}
            description="Porcentaje de éxito en las subastas en las que has participado"
          />
          <MetricSection
            label="TOTAL OFERTADO"
            value={`$${Number(metrics.totalOfertado).toLocaleString('es-AR')}`}
            description="Valor total de las pujas que has realizado"
          />
        </View>

        {/* Donut chart section */}
        {chartData.length > 0 && (
          <View style={s.chartSection}>
            <Text style={s.chartTitle}>DISTRIBUCIÓN POR CATEGORÍA</Text>
            <View style={s.chartCard}>
              <DonutChart data={chartData} />
              <View style={s.legend}>
                {chartData.map((d, i) => (
                  <View key={i} style={s.legendRow}>
                    <View style={[s.legendDot, { backgroundColor: d.color }]} />
                    <Text style={s.legendLabel}>{d.label}</Text>
                    <Text style={s.legendPct}>{d.pct}%</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, height: 64 },
  headerTitle: { fontSize: 16, fontFamily: fonts.semiBold, color: '#000', letterSpacing: -0.64 },
  content: { paddingHorizontal: 24, paddingBottom: 48, gap: 0 },
  titleBlock: { paddingTop: 32, gap: 4, paddingBottom: 24 },
  title: { fontSize: 24, fontFamily: fonts.semiBold, color: '#2C3434', letterSpacing: -1.8, lineHeight: 29 },
  subtitle: { fontSize: 16, fontFamily: fonts.regular, color: '#6B6F6F', lineHeight: 22 },
  statsRow: { flexDirection: 'row', gap: 8, paddingVertical: 12 },
  statCard: { flex: 1, backgroundColor: '#F1F4F3', borderRadius: 6, padding: 16, gap: 4 },
  statLabel: { fontSize: 10, fontFamily: fonts.regular, color: '#747C7C', letterSpacing: 1, textTransform: 'uppercase' },
  statValue: { fontSize: 16, fontFamily: fonts.semiBold, color: '#2C3434', lineHeight: 20 },
  sections: { gap: 0 },
  chartSection: { gap: 24, paddingVertical: 16 },
  chartTitle: { fontSize: 14, fontFamily: fonts.bold, color: '#6A7472', letterSpacing: -0.42, textTransform: 'uppercase' },
  chartCard: { flexDirection: 'row', gap: 32, alignItems: 'center', backgroundColor: '#F3F4F5', borderRadius: 48, padding: 32 },
  legend: { flex: 1, gap: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  legendDot: { width: 8, height: 8, borderRadius: 99 },
  legendLabel: { flex: 1, marginLeft: 8, fontSize: 12, fontFamily: fonts.semiBold, color: '#474747' },
  legendPct: { fontSize: 12, fontFamily: fonts.semiBold, color: '#191C1D' },
});
