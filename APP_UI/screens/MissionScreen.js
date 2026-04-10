import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuthStore } from '../store/authStore'; // Zustand 스토어 임포트

const categories = ['전체', 'DR', '냉난방', '가전', '종합'];

// 서버가 죽었을 때를 대비한 Fallback (대체용) 더미 데이터입니다.
const fallbackMissions = [
  {
    id: 99,
    icon: '🌡️',
    title: '에어컨 1도 올리기 (기본)',
    desc: '냉방 온도를 26°C 이상으로 설정',
    points: 50,
    progress: 3,
    total: 5,
    unit: '일',
    completed: false,
    category: '냉난방',
  }
];

const MissionCard = ({ mission }) => {
  const percent = Math.min((mission.progress / mission.total) * 100, 100);
  const isCompleted = mission.completed;

  return (
    <TouchableOpacity
      style={[
        styles.missionCard,
        isCompleted && styles.missionCardCompleted,
      ]}>
      <View style={styles.missionHeader}>
        <View style={styles.missionIconCircle}>
          <Text style={{ fontSize: 20 }}>{mission.icon}</Text>
        </View>
        <View style={styles.missionInfo}>
          <Text
            style={[
              styles.missionTitle,
              isCompleted && styles.missionTitleCompleted,
            ]}>
            {mission.title}
            {/* 난이도 뱃지 추가 */}
            {mission.difficulty && (
              <Text style={styles.difficultyBadge}>  [{mission.difficulty}]</Text>
            )}
          </Text>
          <Text style={styles.missionDesc}>{mission.desc}</Text>
        </View>
        <View style={styles.pointBadge}>
          <Text style={styles.pointBadgeText}>+{mission.points}P</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>

      <View style={styles.missionProgress}>
        <View style={styles.progressBg}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${percent}%`,
                backgroundColor: isCompleted ? '#22C55E' : '#22C55E',
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {mission.progress}/{mission.total}{mission.unit}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const MissionScreen = () => {
  const [selectedCategory, setSelectedCategory] = useState('전체');
  
  // API 데이터를 담을 동적 State 세팅
  const [missions, setMissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Zustand에서 로그인한 유저 정보 가져오기
  const user = useAuthStore(state => state.user);

  // 컴포넌트가 마운트될 때 FastAPI 서버 찌르기
  useEffect(() => {
    fetchAImission();
  }, []);

  const fetchAImission = async () => {
    setIsLoading(true);
    try {
      // 🚨 중요: 안드로이드 에뮬레이터는 10.0.2.2 사용. 실기기나 iOS는 PC의 내부 IP(예: 192.168.x.x) 입력!
      const API_URL = 'http://192.168.0.38:8000/api/v1/missions/generate'; 
      
      // 유저가 없으면(로그아웃 상태) 중단
      if (!user) {
        setMissions(fallbackMissions);
        setIsLoading(false);
        return;
      }

      // FastAPI 스펙에 맞춘 Request Body 구성
      const requestBody = {
        user_id: String(user.id), // Int -> String 강제 형변환 (422 에러 방어)
        predicted_cbl: 10.5,      // 향후 실제 유저의 전력 데이터로 치환할 변수
        reliability: 0.5,
        stress: 0.1
      };

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('API 연동 실패');
      }

      const aiData = await response.json();

      // API JSON 응답을 React Native UI 배열 규격에 맞게 매핑(Mapping)
      const dynamicMission = {
        id: 1,
        icon: '🤖',
        title: '오늘의 AI 맞춤 수요반응',
        desc: `오늘 누적 전력량을 ${aiData.mission_target_kwh}kWh 이하로 유지하세요! (예측 대비 ${aiData.curtailment_ratio_percent}% 절감)`,
        points: aiData.expected_reward_points,
        progress: 0.0, // 현재 사용량 (추후 센서 데이터 연동)
        total: aiData.mission_target_kwh,
        unit: 'kWh',
        completed: false,
        category: 'DR',
        difficulty: aiData.difficulty // Easy, Medium, Hard
      };

      setMissions([dynamicMission, ...fallbackMissions]); // AI 미션을 최상단에, 기존 더미를 아래에 배치

    } catch (error) {
      console.log('AI 서버 접속 에러:', error);
      // 서버가 꺼져있을 경우 앱이 뻗지 않도록 기존 하드코딩 미션 세팅
      setMissions(fallbackMissions);
      Alert.alert('알림', 'AI 서버에 접속할 수 없어 기본 미션을 제공합니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const completedCount = missions.filter(m => m.completed).length;
  const totalPoints = missions.filter(m => m.completed).reduce((sum, m) => sum + m.points, 0);

  const filteredMissions = selectedCategory === '전체'
    ? missions
    : missions.filter(m => m.category === selectedCategory);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        
        <Text style={styles.pageTitle}>에너지 미션</Text>
        <Text style={styles.pageSubtitle}>AI가 분석한 맞춤형 미션을 달성하세요</Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={{ fontSize: 22 }}>🏆</Text>
            <Text style={styles.statValue}>{completedCount}/{missions.length}</Text>
            <Text style={styles.statLabel}>완료 미션</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={{ fontSize: 22 }}>⭐</Text>
            <Text style={styles.statValue}>{totalPoints}P</Text>
            <Text style={styles.statLabel}>획득 포인트</Text>
          </View>
        </View>

        <View style={styles.categoryRow}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryBtn,
                selectedCategory === cat && styles.categoryBtnActive,
              ]}
              onPress={() => setSelectedCategory(cat)}>
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === cat && styles.categoryTextActive,
                ]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 로딩 스피너 적용 */}
        {isLoading ? (
          <ActivityIndicator size="large" color="#22C55E" style={{ marginTop: 50 }} />
        ) : (
          filteredMissions.map(mission => (
            <MissionCard key={mission.id} mission={mission} />
          ))
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 20,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 16,
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  // Category
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  categoryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryBtnActive: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  // Mission card
  missionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  missionCardCompleted: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  missionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  missionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  missionInfo: {
    flex: 1,
  },
  missionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  missionTitleCompleted: {
    color: '#16A34A',
  },
  missionDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  pointBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  pointBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
  },
  chevron: {
    fontSize: 20,
    color: '#9CA3AF',
  },
  // Progress
  missionProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 10,
  },
  progressBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    minWidth: 40,
    textAlign: 'right',
  },
  // Completed
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  completedIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  completedText: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '600',
  },
  difficultyBadge: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '800',
  },
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 50, paddingBottom: 20 },
  pageTitle: { fontSize: 24, fontWeight: '700', color: '#111827' },
  pageSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 4, marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#ECFDF5', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#111827', marginTop: 4 },
  statLabel: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  categoryRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  categoryBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' },
  categoryBtnActive: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
  categoryText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  categoryTextActive: { color: '#FFFFFF' },
  missionCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  missionCardCompleted: { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0' },
  missionHeader: { flexDirection: 'row', alignItems: 'center' },
  missionIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  missionInfo: { flex: 1 },
  missionTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  missionTitleCompleted: { color: '#16A34A' },
  missionDesc: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  pointBadge: { backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 8 },
  pointBadgeText: { fontSize: 12, fontWeight: '700', color: '#16A34A' },
  chevron: { fontSize: 20, color: '#9CA3AF' },
  missionProgress: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 10 },
  progressBg: { flex: 1, height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressText: { fontSize: 12, color: '#6B7280', fontWeight: '500', minWidth: 40, textAlign: 'right' },
});

export default MissionScreen;
