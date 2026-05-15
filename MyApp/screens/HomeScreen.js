import {useEnergyWebSocket} from '../api/useWebSocket';
import React, {useEffect} from 'react';
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

// 아키텍처 해상도 교정: 컨테이너 패딩(16px*2) + 카드 패딩(20px*2) = 총 72px 여백 확보
const {width: SCREEN_WIDTH} = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 72; 
const CHART_HEIGHT = 220; // 렌더링 최적화 높이

// 75:25 비율 및 뭉침 방지 엔진이 탑재된 차트 컴포넌트
const EnergyChart = () => {
  const { hourlyActual, hourlyPredicted } = useEnergyStore();
   
  if (!hourlyActual || hourlyActual.length === 0) return null;
   
  const safeActual = hourlyActual.map(v => isNaN(Number(v)) ? 0 : Number(v));
  const safePredicted = (hourlyPredicted || []).map(v => isNaN(Number(v)) ? 0 : Number(v));
   
  const actualLen = safeActual.length;
  const displayPredLen = Math.max(Math.floor(actualLen / 3), 1); 
  const displayPredicted = safePredicted.slice(0, displayPredLen);
  const predLen = displayPredicted.length;
   
  const maxActual = Math.max(...safeActual);
  const maxPred = Math.max(...(predLen > 0 ? displayPredicted : [0]));
  const dynamicMaxVal = Math.max(maxActual, maxPred) * 1.5 || 1;
   
  const padLeft = 40;
  const padTop = 10;
  const padBottom = 35; 
  const chartW = CHART_WIDTH - padLeft;
  const chartH = CHART_HEIGHT - padTop - padBottom;
   
  const actualW = chartW * 0.75; 
  const predW = chartW * 0.25;
   
  const getActualX = (i) => {
    if (actualLen <= 1) return padLeft + actualW; 
    return padLeft + (i / (actualLen - 1)) * actualW;
  };
   
  const getPredX = (i) => {
    if (predLen === 0) return padLeft + actualW;
    return padLeft + actualW + (i / predLen) * predW; 
  };
   
  const getY = (val) => padTop + chartH - (val / dynamicMaxVal) * chartH;
   
  const actualPoints = safeActual.map((v, i) => `${getActualX(i)},${getY(v)}`).join(' ');
  const lastActualX = getActualX(actualLen - 1);
  const lastActualY = getY(safeActual[actualLen - 1]);
  
  let predictedPoints = "";
  if (predLen > 0) {
    const predCoords = displayPredicted.map((v, i) => `${getPredX(i + 1)},${getY(v)}`).join(' ');
    predictedPoints = `${lastActualX},${lastActualY} ${predCoords}`;
  }
   
  const yLabels = [0, 1, 2, 3, 4].map(i => `${(dynamicMaxVal * (i / 4)).toFixed(1)}kW`);
   
  const xLabels = [];
  const now = new Date();
  now.setMinutes(Math.floor(now.getMinutes() / 15) * 15, 0, 0); 
  
  const getKSTLabel = (dateObj) => {
    const utc = dateObj.getTime() + (dateObj.getTimezoneOffset() * 60000);
    const kstDate = new Date(utc + (9 * 3600000));
    let hours = kstDate.getHours();
    const ampm = hours < 12 ? '오전' : '오후';
    hours = hours % 12;
    hours = hours === 0 ? 12 : hours; 
    return `${ampm} ${hours}시`;
  };
   
  const numLabels = 3;
  if (actualLen > 1) {
    const interval = Math.floor((actualLen - 1) / (numLabels - 1));
    for (let i = 0; i < numLabels - 1; i++) {
        const idx = i * interval;
        const minutesAgo = (actualLen - 1 - idx) * 15;
        const timePoint = new Date(now.getTime() - minutesAgo * 60000);
        xLabels.push({ index: idx, label: getKSTLabel(timePoint), isNow: false });
    }
  }
  xLabels.push({ index: actualLen - 1, label: '현재', isNow: true });
   
  return (
    <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
      <Line x1={lastActualX} y1={padTop} x2={lastActualX} y2={padTop + chartH} stroke="#EF4444" strokeWidth={1} strokeDasharray="4,4" opacity={0.6} />
      {yLabels.map((label, i) => {
        const y = padTop + chartH - (i / 4) * chartH;
        return (
          <G key={`y-${i}`}>
            <Line x1={padLeft} y1={y} x2={padLeft + chartW} y2={y} stroke="#E5E7EB" strokeWidth={0.5} />
            <SvgText x={padLeft - 5} y={y + 4} fontSize={10} fill="#9CA3AF" textAnchor="end">{label}</SvgText>
          </G>
        );
      })}
      {xLabels.map((item, i) => (
        <G key={`x-${item.index}-${i}`}>
          <SvgText 
            x={getActualX(item.index)} 
            y={padTop + chartH + 20} 
            fontSize={10} 
            fill={item.isNow ? "#EF4444" : "#9CA3AF"} 
            fontWeight={item.isNow ? "700" : "400"} 
            textAnchor="middle"
          >
            {item.label}
          </SvgText>
          <Line x1={getActualX(item.index)} y1={padTop + chartH} x2={getActualX(item.index)} y2={padTop + chartH + 4} stroke="#9CA3AF" strokeWidth={1} />
        </G>
      ))}
      {predLen > 0 && <Polyline points={predictedPoints} fill="none" stroke="#D1D5DB" strokeWidth={2} strokeDasharray="6,4" />}
      {actualLen > 1 && <Polyline points={actualPoints} fill="none" stroke="#22C55E" strokeWidth={2.5} />}
      <Circle cx={lastActualX} cy={lastActualY} r={5} fill="#EF4444" />
    </Svg>
  );
};

const DonutChart = ({value, maxValue, size = 120}) => {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / maxValue) * circumference;
  const center = size / 2;
  const safeValue = isNaN(Number(value)) ? 0 : Number(value);
  const displayValue = safeValue.toFixed(1);

  return (
    <View style={{width: size, height: size, alignItems: 'center', justifyContent: 'center'}}>
      <Svg width={size} height={size}>
        <Circle cx={center} cy={center} r={radius} stroke="#E5E7EB" strokeWidth={strokeWidth} fill="none" />
        <Circle cx={center} cy={center} r={radius} stroke="#22C55E"
          strokeWidth={strokeWidth} fill="none"
          strokeDasharray={`${progress},${circumference}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`} />
      </Svg>
      <View style={styles.donutCenter}>
        <Text style={styles.donutValue}>{displayValue}</Text>
        <Text style={styles.donutUnit}>kWh</Text>
      </View>
    </View>
  );
};

const HomeScreen = () => {
  const navigation = useNavigation();
  
  // 1. 로그인된 유저 정보를 먼저 가져옴.
  const {user} = useAuthStore();
  
  // 2. 유저의 고유 ID를 웹소켓 훅에 동적 전달. 
  // (옵셔널 체이닝 `?.`을 사용하여 로그아웃 상태일 때의 크래시를 방어)
  useEnergyWebSocket(user?.id);

  const {
    currentPower, todayAccumulated, monthlyTarget, monthlyUsed,
    savingPercent, monthlySaving, co2Reduction, simulateRealtime, isLoading,
    hourlyActual
  } = useEnergyStore();
  const {totalPoints, fetchPoints} = usePointStore();

  const userName = user?.name || '김에너지';
  const userLocation = user?.location || '강원도 춘천시';
  const monthlyPercent = monthlyTarget > 0 ? Math.round((monthlyUsed / monthlyTarget) * 100) : 0;

  // 현실 시간이 아닌 시뮬레이션 시간 동기화
  // 15분 단위 배열의 길이를 통해 현재 시뮬레이션이 몇 시를 지나고 있는지 역추적.
  const actualLen = hourlyActual ? hourlyActual.length : 0;
  let drStatus = '예정';
  let bannerBgColor = '#3B82F6'; // 파란색 (예정)

  if (actualLen >= 57 && actualLen <= 69) {
    // 56(14시) ~ 68(17시) 구간
    drStatus = '진행중';
    bannerBgColor = '#22C55E'; // 초록색 (진행중)
  } else if (actualLen > 69) {
    // 17시 이후
    drStatus = '종료';
    bannerBgColor = '#9CA3AF'; // 회색 (종료)
  }

  useEffect(() => {
    const interval = simulateRealtime();
    fetchPoints();
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
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

        {/* 다이내믹 DR 이벤트 배너 */}
        <TouchableOpacity
          style={[styles.drBanner, { backgroundColor: bannerBgColor }]} // 동적 색상 적용
          activeOpacity={0.85}
          onPress={() => navigation.navigate('DR 이벤트')}>
          <View style={styles.drBannerContent}>
            <View style={styles.drLiveIndicator}>
              {drStatus === '진행중' ? (
                <View style={styles.liveRedDot} />
              ) : (
                <Text style={{fontSize: 12, marginRight: 4}}>⏳</Text>
              )}
              <Text style={styles.drLiveText}>
                {drStatus === '진행중' ? 'DR 이벤트 진행 중' : drStatus === '예정' ? 'DR 이벤트 예정' : '금일 DR 이벤트 종료'}
              </Text>
            </View>
            <Text style={styles.drTimeText}>14:00 ~ 17:00 전력 피크 절감</Text>
            <Text style={styles.drParticipateText}>
              {drStatus === '진행중' ? '참여하고 500P 받기 →' : drStatus === '예정' ? '미리 알림 설정하기 →' : '내일 다시 참여해주세요 →'}
            </Text>
          </View>
          <View style={styles.drBannerIcon}>
            <Text style={{fontSize: 28, color: '#FFFFFF'}}>♻️</Text>
          </View>
        </TouchableOpacity>

        {/* 실시간 전력 사용량 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>실시간 전력 사용량</Text>
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

        {/* 시간대별 전력 사용량 차트 */}
        <View style={styles.card}>
          <View style={styles.chartHeader}>
            <Text style={styles.cardTitle}>시간대별 전력 사용량</Text>
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

        {/* 하단 요약 카드 */}
        <View style={styles.summaryRow}>
          <TouchableOpacity style={styles.summaryCard} activeOpacity={0.7}
            onPress={() => navigation.navigate('DR 이벤트')}>
            <Text style={{fontSize: 22}}>⚡</Text>
            <Text style={styles.summaryValue}>{Number(monthlySaving).toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})} kWh</Text>
            <Text style={styles.summaryLabel}>이번 달 절감</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.summaryCard} activeOpacity={0.7}
            onPress={() => navigation.navigate('마이페이지')}>
            <Text style={{fontSize: 22}}>🌍</Text>
            <Text style={styles.summaryValue}>{Number(co2Reduction).toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})} kg</Text>
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