import React, {useEffect, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Svg, {
  Circle,
  Line,
  Polyline,
  Text as SvgText,
  G,
} from 'react-native-svg';
import {useNavigation} from '@react-navigation/native';
import {useEnergyStore, usePointStore} from '../store/store';
import {useAuthStore} from '../store/authStore';
import {useEnergyWebSocket} from '../api/useWebSocket';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 80;
const CHART_HEIGHT = 180;

/**
 * 현재 시간 기준 최근 8시간 라벨 생성
 * 예: 현재 14시 → ['07', '08', '09', '10', '11', '12', '13', '14']
 * 예: 현재 01시 → ['18', '19', '20', '21', '22', '23', '00', '01']
 */
const getDynamicTimeLabels = () => {
  const currentHour = new Date().getHours();
  const labels = [];
  for (let i = 0; i < 8; i++) {
    const offset = i - 7; // -7, -6, ..., -1, 0
    const hour = (currentHour + offset + 24) % 24;
    labels.push(String(hour).padStart(2, '0'));
  }
  return labels;
};

const EnergyChart = () => {
  const {hourlyActual, hourlyPredicted} = useEnergyStore();

  // 1분마다 라벨 재계산 (자정을 넘어가는 경우 대응)
  const timeLabels = useMemo(() => getDynamicTimeLabels(), [hourlyActual]);

  if (!hourlyActual || hourlyActual.length === 0) return null;

  const maxVal = 8;
  const padLeft = 40;
  const padTop = 10;
  const padBottom = 30;
  const chartW = CHART_WIDTH - padLeft;
  const chartH = CHART_HEIGHT - padTop - padBottom;

  const getX = (i) => padLeft + (i / (hourlyActual.length - 1)) * chartW;
  const getY = (val) => padTop + chartH - (val / maxVal) * chartH;

  const actualPoints = hourlyActual.map((v, i) => `${getX(i)},${getY(v)}`).join(' ');
  const predictedPoints = hourlyPredicted.map((v, i) => `${getX(i)},${getY(v)}`).join(' ');

  const yLabels = ['0kW', '2kW', '4kW', '6kW', '8kW'];

  return (
    <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
      {yLabels.map((label, i) => {
        const y = padTop + chartH - (i / 4) * chartH;
        return (
          <G key={`y-${i}`}>
            <Line x1={padLeft} y1={y} x2={padLeft + chartW} y2={y}
              stroke="#E5E7EB" strokeWidth={0.5} strokeDasharray="4,4" />
            <SvgText x={padLeft - 5} y={y + 4} fontSize={10} fill="#9CA3AF" textAnchor="end">
              {label}
            </SvgText>
          </G>
        );
      })}
      {timeLabels.map((label, i) => {
        const x = padLeft + (i / (timeLabels.length - 1)) * chartW;
        return (
          <SvgText key={`x-${i}`} x={x} y={CHART_HEIGHT - 5}
            fontSize={10} fill="#9CA3AF" textAnchor="middle">{label}</SvgText>
        );
      })}
      <Polyline points={predictedPoints} fill="none" stroke="#D1D5DB"
        strokeWidth={2} strokeDasharray="6,4" />
      <Polyline points={actualPoints} fill="none" stroke="#22C55E" strokeWidth={2.5} />
      {hourlyActual.map((v, i) => (
        <Circle key={`dot-${i}`} cx={getX(i)} cy={getY(v)} r={3} fill="#22C55E" />
      ))}
    </Svg>
  );
};

const DonutChart = ({value, maxValue, size = 120}) => {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / maxValue) * circumference;
  const center = size / 2;

  return (
    <View style={{width: size, height: size, alignItems: 'center', justifyContent: 'center'}}>
      <Svg width={size} height={size}>
        <Circle cx={center} cy={center} r={radius} stroke="#E5E7EB"
          strokeWidth={strokeWidth} fill="none" />
        <Circle cx={center} cy={center} r={radius} stroke="#22C55E"
          strokeWidth={strokeWidth} fill="none"
          strokeDasharray={`${progress},${circumference}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`} />
      </Svg>
      <View style={styles.donutCenter}>
        <Text style={styles.donutValue}>{value}</Text>
        <Text style={styles.donutUnit}>kW</Text>
      </View>
    </View>
  );
};

const HomeScreen = () => {
  const navigation = useNavigation();
  const {
    currentPower, todayAccumulated, monthlyTarget, monthlyUsed,
    savingPercent, monthlySaving, co2Reduction, fetchDashboard, isLoading,
  } = useEnergyStore();
  const {totalPoints, fetchPoints} = usePointStore();
  const {user} = useAuthStore();

  useEnergyWebSocket();

  const userName = user?.name || '김에너지';
  const userLocation = user?.location || '강원도 원주시';
  const monthlyPercent = monthlyTarget > 0 ? Math.round((monthlyUsed / monthlyTarget) * 100) : 0;

  useEffect(() => {
    fetchDashboard();
    fetchPoints();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Text style={{fontSize: 20}}>🌿</Text>
            </View>
            <View>
              <Text style={styles.headerTitle}>에너지 대시보드</Text>
              <Text style={styles.headerSubtitle}>{userLocation} · {userName}님</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.notificationBtn}
            onPress={() => navigation.navigate('마이페이지')}>
            <Text style={{fontSize: 18}}>🔔</Text>
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.drBanner}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('DR 이벤트')}>
          <View style={styles.drBannerContent}>
            <View style={styles.drLiveIndicator}>
              <View style={styles.liveRedDot} />
              <Text style={styles.drLiveText}>DR 이벤트 진행 중</Text>
            </View>
            <Text style={styles.drTimeText}>14:00 ~ 17:00 전력 피크 절감</Text>
            <Text style={styles.drParticipateText}>참여하고 500P 받기 →</Text>
          </View>
          <View style={styles.drBannerIcon}>
            <Text style={{fontSize: 28, color: '#FFFFFF'}}>♻️</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>실시간 전력 사용량 (1분 평균)</Text>
          {isLoading && !currentPower ? (
            <ActivityIndicator size="large" color="#22C55E" style={{paddingVertical: 30}} />
          ) : (
            <View style={styles.realTimeRow}>
              <DonutChart value={currentPower} maxValue={10} />
              <View style={styles.realTimeStats}>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>오늘 누적</Text>
                  <Text style={styles.statValue}>{todayAccumulated.toFixed(1)} kWh</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, {width: `${Math.min((todayAccumulated / 30) * 100, 100)}%`}]} />
                </View>
                <View style={[styles.statRow, {marginTop: 12}]}>
                  <Text style={styles.statLabel}>월 목표 대비</Text>
                  <Text style={styles.statValue}>{monthlyPercent}%</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, {width: `${monthlyPercent}%`, backgroundColor: '#3B82F6'}]} />
                </View>
                <View style={styles.savingBadge}>
                  <Text style={{fontSize: 12}}>🌱</Text>
                  <Text style={styles.savingText}>어제보다 {savingPercent}% 절감 중!</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.chartHeader}>
            <Text style={styles.cardTitle}>시간대별 전력 사용량 (최근 8시간)</Text>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, {backgroundColor: '#22C55E'}]} />
                <Text style={styles.legendText}>실제</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, {backgroundColor: '#D1D5DB'}]} />
                <Text style={styles.legendText}>AI 예측</Text>
              </View>
            </View>
          </View>
          <View style={styles.chartContainer}>
            <EnergyChart />
          </View>
        </View>

        <View style={styles.summaryRow}>
          <TouchableOpacity style={styles.summaryCard} activeOpacity={0.7}
            onPress={() => navigation.navigate('DR 이벤트')}>
            <Text style={{fontSize: 22}}>⚡</Text>
            <Text style={styles.summaryValue}>{monthlySaving} kWh</Text>
            <Text style={styles.summaryLabel}>이번 달 절감</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.summaryCard} activeOpacity={0.7}
            onPress={() => navigation.navigate('마이페이지')}>
            <Text style={{fontSize: 22}}>🌍</Text>
            <Text style={styles.summaryValue}>{co2Reduction} kg</Text>
            <Text style={styles.summaryLabel}>CO₂ 감축</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.summaryCard} activeOpacity={0.7}
            onPress={() => navigation.navigate('포인트')}>
            <Text style={{fontSize: 22}}>🎁</Text>
            <Text style={styles.summaryValue}>{totalPoints.toLocaleString()}P</Text>
            <Text style={styles.summaryLabel}>적립 포인트</Text>
          </TouchableOpacity>
        </View>
        <View style={{height: 20}} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F9FAFB'},
  scrollContent: {paddingHorizontal: 16, paddingTop: 50, paddingBottom: 20},
  header: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16},
  headerLeft: {flexDirection: 'row', alignItems: 'center'},
  headerIcon: {width: 44, height: 44, borderRadius: 22, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', marginRight: 10},
  headerTitle: {fontSize: 20, fontWeight: '700', color: '#111827'},
  headerSubtitle: {fontSize: 13, color: '#6B7280', marginTop: 2},
  notificationBtn: {width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', position: 'relative', shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2},
  notificationBadge: {position: 'absolute', top: 8, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444'},
  drBanner: {backgroundColor: '#22C55E', borderRadius: 16, padding: 18, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  drBannerContent: {flex: 1},
  drLiveIndicator: {flexDirection: 'row', alignItems: 'center', marginBottom: 6},
  liveRedDot: {width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', marginRight: 6},
  drLiveText: {fontSize: 13, color: '#FFFFFF', fontWeight: '500'},
  drTimeText: {fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 4},
  drParticipateText: {fontSize: 13, color: '#DCFCE7', fontWeight: '500'},
  drBannerIcon: {width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center'},
  card: {backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2},
  cardTitle: {fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 16},
  realTimeRow: {flexDirection: 'row', alignItems: 'center'},
  donutCenter: {position: 'absolute', alignItems: 'center'},
  donutValue: {fontSize: 28, fontWeight: '700', color: '#111827'},
  donutUnit: {fontSize: 12, color: '#6B7280', marginTop: -2},
  realTimeStats: {flex: 1, marginLeft: 20},
  statRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6},
  statLabel: {fontSize: 13, color: '#6B7280'},
  statValue: {fontSize: 15, fontWeight: '700', color: '#111827'},
  progressBarBg: {height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden'},
  progressBarFill: {height: '100%', backgroundColor: '#22C55E', borderRadius: 3},
  savingBadge: {flexDirection: 'row', alignItems: 'center', marginTop: 12},
  savingText: {fontSize: 12, color: '#22C55E', fontWeight: '600', marginLeft: 4},
  chartHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8},
  chartLegend: {flexDirection: 'row', gap: 12},
  legendItem: {flexDirection: 'row', alignItems: 'center'},
  legendDot: {width: 8, height: 8, borderRadius: 4, marginRight: 4},
  legendText: {fontSize: 11, color: '#6B7280'},
  chartContainer: {alignItems: 'center', paddingTop: 8},
  summaryRow: {flexDirection: 'row', gap: 10},
  summaryCard: {flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2},
  summaryValue: {fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 6},
  summaryLabel: {fontSize: 11, color: '#6B7280', marginTop: 2},
});

export default HomeScreen;
