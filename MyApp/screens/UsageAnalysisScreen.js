import React, {useEffect, useState} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator,
} from 'react-native';
import Svg, {Rect, Line, Text as SvgText, G} from 'react-native-svg';
import {useNavigation} from '@react-navigation/native';
import {energyAPI} from '../api/apiClient';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 64;
const CHART_HEIGHT = 200;

const UsageBarChart = ({series}) => {
  if (!series || series.length === 0) return null;

  const padLeft = 36;
  const padBottom = 24;
  const padTop = 10;
  const chartW = CHART_WIDTH - padLeft;
  const chartH = CHART_HEIGHT - padTop - padBottom;

  const values = series.map(p => p.value);
  const maxVal = Math.max(...values, 1);
  const barGap = 2;
  const barW = Math.max((chartW / series.length) - barGap, 1);

  const yTicks = [0, 0.5, 1].map(r => ({r, label: Math.round(maxVal * r)}));

  return (
    <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
      {yTicks.map((t, i) => {
        const y = padTop + chartH - t.r * chartH;
        return (
          <G key={`y-${i}`}>
            <Line x1={padLeft} y1={y} x2={padLeft + chartW} y2={y}
              stroke="#E5E7EB" strokeWidth={0.5} strokeDasharray="4,4" />
            <SvgText x={padLeft - 5} y={y + 4} fontSize={9} fill="#9CA3AF" textAnchor="end">
              {t.label}
            </SvgText>
          </G>
        );
      })}
      {series.map((p, i) => {
        const h = (p.value / maxVal) * chartH;
        const x = padLeft + i * (barW + barGap);
        const y = padTop + chartH - h;
        return <Rect key={`bar-${i}`} x={x} y={y} width={barW} height={Math.max(h, 0)} rx={1.5} fill="#22C55E" opacity={0.85} />;
      })}
      {series.map((p, i) => {
        if (i % 5 !== 0) return null;
        const x = padLeft + i * (barW + barGap) + barW / 2;
        const day = p.time.slice(5, 10); // MM-DD
        return (
          <SvgText key={`x-${i}`} x={x} y={CHART_HEIGHT - 6} fontSize={9} fill="#9CA3AF" textAnchor="middle">
            {day}
          </SvgText>
        );
      })}
    </Svg>
  );
};

const UsageAnalysisScreen = () => {
  const navigation = useNavigation();
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await energyAPI.getTimeseries('USER_0000', '1d');
        setSeries(res.data || []);
      } catch (e) {
        setSeries([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const values = series.map(p => p.value);
  const total = values.reduce((a, b) => a + b, 0);
  const avg = values.length ? total / values.length : 0;
  const peak = series.length ? series.reduce((m, p) => (p.value > m.value ? p : m), series[0]) : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={{fontSize: 22}}>‹</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>전력 사용량 분석</Text>
          <Text style={styles.headerSubtitle}>InfluxDB 시계열 · 일별 추이</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color="#22C55E" style={{paddingVertical: 60}} />
        ) : series.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={{fontSize: 40}}>📭</Text>
            <Text style={styles.emptyText}>시계열 데이터가 없습니다</Text>
          </View>
        ) : (
          <>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={{fontSize: 20}}>🔋</Text>
                <Text style={styles.statValue}>{Math.round(total).toLocaleString()}</Text>
                <Text style={styles.statLabel}>총 사용량(kWh)</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={{fontSize: 20}}>📊</Text>
                <Text style={styles.statValue}>{avg.toFixed(1)}</Text>
                <Text style={styles.statLabel}>일평균(kWh)</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={{fontSize: 20}}>🔥</Text>
                <Text style={styles.statValue}>{peak ? peak.value.toFixed(0) : 0}</Text>
                <Text style={styles.statLabel}>최대({peak ? peak.time.slice(5, 10) : '-'})</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>일별 전력 사용량 (최근 {series.length}일)</Text>
              <View style={styles.chartContainer}>
                <UsageBarChart series={series} />
              </View>
            </View>

            <View style={styles.sourceBox}>
              <Text style={styles.sourceText}>
                ⓘ 원본 시계열은 InfluxDB(power-data) 에서 1일 단위로 집계되어 표시됩니다.
              </Text>
            </View>
          </>
        )}
        <View style={{height: 20}} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F9FAFB'},
  header: {flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingBottom: 12, paddingHorizontal: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6'},
  backBtn: {width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 4},
  headerTitle: {fontSize: 18, fontWeight: '700', color: '#111827'},
  headerSubtitle: {fontSize: 12, color: '#6B7280', marginTop: 2},
  scrollContent: {paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20},
  statsRow: {flexDirection: 'row', gap: 10, marginBottom: 16},
  statCard: {flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, paddingVertical: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2},
  statValue: {fontSize: 17, fontWeight: '700', color: '#111827', marginTop: 6},
  statLabel: {fontSize: 10, color: '#6B7280', marginTop: 2},
  card: {backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, marginBottom: 16, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2},
  cardTitle: {fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 16},
  chartContainer: {alignItems: 'center'},
  sourceBox: {backgroundColor: '#F3F4F6', borderRadius: 10, padding: 12},
  sourceText: {fontSize: 12, color: '#6B7280', lineHeight: 18},
  emptyState: {alignItems: 'center', paddingVertical: 60},
  emptyText: {fontSize: 14, color: '#9CA3AF', marginTop: 10},
});

export default UsageAnalysisScreen;
