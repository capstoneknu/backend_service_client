import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

const categories = ['전체', 'DR', '냉난방', '가전', '종합'];

const missions = [
  {
    id: 1,
    icon: '🌡️',
    title: '에어컨 1도 올리기',
    desc: '냉방 온도를 26°C 이상으로 설정',
    points: 50,
    progress: 3,
    total: 5,
    unit: '일',
    completed: false,
    category: '냉난방',
  },
  {
    id: 2,
    icon: '✅',
    title: '대기전력 차단',
    desc: '미사용 전자기기 플러그 뽑기',
    points: 30,
    progress: 7,
    total: 7,
    unit: '일',
    completed: true,
    category: '가전',
  },
  {
    id: 3,
    icon: '⏰',
    title: '피크시간 절전',
    desc: '14~17시 전력 사용량 20% 줄이기',
    points: 100,
    progress: 2,
    total: 5,
    unit: '회',
    completed: false,
    category: 'DR',
  },
  {
    id: 4,
    icon: '🧺',
    title: '세탁기 모아 돌리기',
    desc: '주 2회 이하로 세탁기 사용',
    points: 40,
    progress: 1,
    total: 4,
    unit: '주',
    completed: false,
    category: '가전',
  },
  {
    id: 5,
    icon: '📊',
    title: '월간 10% 절감 달성',
    desc: '전월 대비 전력 사용량 10% 감소',
    points: 200,
    progress: 0,
    total: 1,
    unit: '회',
    completed: false,
    category: '종합',
  },
];

const MissionCard = ({mission}) => {
  const percent = (mission.progress / mission.total) * 100;
  const isCompleted = mission.completed;

  return (
    <TouchableOpacity
      style={[
        styles.missionCard,
        isCompleted && styles.missionCardCompleted,
      ]}>
      <View style={styles.missionHeader}>
        <View style={styles.missionIconCircle}>
          <Text style={{fontSize: 20}}>{mission.icon}</Text>
        </View>
        <View style={styles.missionInfo}>
          <Text
            style={[
              styles.missionTitle,
              isCompleted && styles.missionTitleCompleted,
            ]}>
            {mission.title}
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

      {isCompleted && (
        <View style={styles.completedBadge}>
          <Text style={styles.completedIcon}>☑️</Text>
          <Text style={styles.completedText}>미션 완료! 포인트가 적립되었습니다</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const MissionScreen = () => {
  const [selectedCategory, setSelectedCategory] = useState('전체');

  const completedCount = missions.filter(m => m.completed).length;
  const totalPoints = missions.filter(m => m.completed).reduce((sum, m) => sum + m.points, 0);

  const filteredMissions =
    selectedCategory === '전체'
      ? missions
      : missions.filter(m => m.category === selectedCategory);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <Text style={styles.pageTitle}>에너지 미션</Text>
        <Text style={styles.pageSubtitle}>미션을 달성하고 포인트를 적립하세요</Text>

        {/* 상단 통계 */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={{fontSize: 22}}>🏆</Text>
            <Text style={styles.statValue}>
              {completedCount}/{missions.length}
            </Text>
            <Text style={styles.statLabel}>완료 미션</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={{fontSize: 22}}>⭐</Text>
            <Text style={styles.statValue}>{totalPoints}P</Text>
            <Text style={styles.statLabel}>획득 포인트</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={{fontSize: 22}}>🔥</Text>
            <Text style={styles.statValue}>3일</Text>
            <Text style={styles.statLabel}>연속 달성</Text>
          </View>
        </View>

        {/* 카테고리 필터 */}
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

        {/* 미션 목록 */}
        {filteredMissions.map(mission => (
          <MissionCard key={mission.id} mission={mission} />
        ))}

        <View style={{height: 20}} />
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
});

export default MissionScreen;
