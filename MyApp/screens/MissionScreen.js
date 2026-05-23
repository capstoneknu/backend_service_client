import React, {useState, useEffect} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import {useMissionStore} from '../store/store';
import {ConfirmModal, ToastModal} from '../components/Modals';

const categories = ['전체', 'DR', '냉난방', '가전', '종합'];

const MissionCard = ({mission, onPress}) => {
  const percent = mission.total > 0 ? (mission.progress / mission.total) * 100 : 0;
  const isCompleted = mission.completed;

  return (
    <TouchableOpacity
      style={[styles.missionCard, isCompleted && styles.missionCardCompleted]}
      activeOpacity={0.7} onPress={() => onPress(mission)} disabled={isCompleted}>
      <View style={styles.missionHeader}>
        <View style={[styles.missionIconCircle, isCompleted && {backgroundColor: '#DCFCE7'}]}>
          <Text style={{fontSize: 20}}>{mission.icon}</Text>
        </View>
        <View style={styles.missionInfo}>
          <Text style={[styles.missionTitle, isCompleted && styles.missionTitleCompleted]}>
            {mission.title}
          </Text>
          <Text style={styles.missionDesc}>{mission.description}</Text>
        </View>
        <View style={[styles.pointBadge, isCompleted && {backgroundColor: '#DCFCE7'}]}>
          <Text style={styles.pointBadgeText}>+{mission.points}P</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>
      <View style={styles.missionProgress}>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, {width: `${percent}%`}]} />
        </View>
        <Text style={styles.progressText}>{mission.progress}/{mission.total}{mission.unit}</Text>
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
  const {
    missions, selectedCategory, setCategory, fetchMissions,
    incrementProgress, getCompletedCount, getEarnedPoints, isLoading,
  } = useMissionStore();

  const [confirmModal, setConfirmModal] = useState({visible: false, mission: null});
  const [toast, setToast] = useState({visible: false, message: '', type: 'success'});

  // API에서 데이터 로드
  useEffect(() => {
    fetchMissions();
  }, []);

  const completedCount = getCompletedCount();
  const earnedPoints = getEarnedPoints();
  const streakDays = 3;

  const handleMissionPress = (mission) => {
    if (mission.completed) return;
    setConfirmModal({visible: true, mission});
  };

  const confirmIncrement = async () => {
    const mission = confirmModal.mission;
    if (!mission) return;
    setConfirmModal({visible: false, mission: null});

    const result = await incrementProgress(mission.id);
    if (result.success) {
      const msg = result.data?.completed
        ? `🎉 "${mission.title}" 미션 완료! +${mission.points}P 적립!`
        : `✓ 진행도가 업데이트되었습니다`;
      showToast(msg, result.data?.completed ? 'success' : 'info');
    } else {
      showToast(result.error || '업데이트에 실패했습니다.', 'error');
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({visible: true, message, type});
    setTimeout(() => setToast({visible: false, message: '', type: 'success'}), 2500);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>에너지 미션</Text>
        <Text style={styles.pageSubtitle}>미션을 달성하고 포인트를 적립하세요</Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={{fontSize: 22}}>🏆</Text>
            <Text style={styles.statValue}>{completedCount}/{missions.length}</Text>
            <Text style={styles.statLabel}>완료 미션</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={{fontSize: 22}}>⭐</Text>
            <Text style={styles.statValue}>{earnedPoints}P</Text>
            <Text style={styles.statLabel}>획득 포인트</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={{fontSize: 22}}>🔥</Text>
            <Text style={styles.statValue}>{streakDays}일</Text>
            <Text style={styles.statLabel}>연속 달성</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          <View style={styles.categoryRow}>
            {categories.map(cat => (
              <TouchableOpacity key={cat}
                style={[styles.categoryBtn, selectedCategory === cat && styles.categoryBtnActive]}
                activeOpacity={0.7} onPress={() => setCategory(cat)}>
                <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {isLoading && missions.length === 0 ? (
          <ActivityIndicator size="large" color="#22C55E" style={{paddingVertical: 30}} />
        ) : missions.length > 0 ? (
          missions.map(mission => (
            <MissionCard key={mission.id} mission={mission} onPress={handleMissionPress} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={{fontSize: 40}}>📋</Text>
            <Text style={styles.emptyText}>해당 카테고리에 미션이 없습니다</Text>
          </View>
        )}
        <View style={{height: 20}} />
      </ScrollView>

      <ConfirmModal visible={confirmModal.visible}
        title={confirmModal.mission?.title || ''}
        message={`오늘 미션을 수행하셨나요?\n진행도: ${confirmModal.mission?.progress || 0}/${confirmModal.mission?.total || 0}${confirmModal.mission?.unit || ''} → ${Math.min((confirmModal.mission?.progress || 0) + 1, confirmModal.mission?.total || 0)}/${confirmModal.mission?.total || 0}${confirmModal.mission?.unit || ''}`}
        confirmText="완료 체크" onConfirm={confirmIncrement}
        onCancel={() => setConfirmModal({visible: false, mission: null})} />
      <ToastModal visible={toast.visible} message={toast.message} type={toast.type}
        onClose={() => setToast({...toast, visible: false})} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F9FAFB'},
  scrollContent: {paddingHorizontal: 16, paddingTop: 50, paddingBottom: 20},
  pageTitle: {fontSize: 24, fontWeight: '700', color: '#111827'},
  pageSubtitle: {fontSize: 14, color: '#6B7280', marginTop: 4, marginBottom: 16},
  statsRow: {flexDirection: 'row', gap: 10, marginBottom: 16},
  statCard: {flex: 1, backgroundColor: '#ECFDF5', borderRadius: 14, paddingVertical: 14, alignItems: 'center'},
  statValue: {fontSize: 18, fontWeight: '700', color: '#111827', marginTop: 4},
  statLabel: {fontSize: 11, color: '#6B7280', marginTop: 2},
  categoryScroll: {marginBottom: 16},
  categoryRow: {flexDirection: 'row', gap: 8},
  categoryBtn: {paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB'},
  categoryBtnActive: {backgroundColor: '#22C55E', borderColor: '#22C55E'},
  categoryText: {fontSize: 13, fontWeight: '600', color: '#6B7280'},
  categoryTextActive: {color: '#FFFFFF'},
  missionCard: {backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2},
  missionCardCompleted: {backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0'},
  missionHeader: {flexDirection: 'row', alignItems: 'center'},
  missionIconCircle: {width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 12},
  missionInfo: {flex: 1},
  missionTitle: {fontSize: 15, fontWeight: '700', color: '#111827'},
  missionTitleCompleted: {color: '#16A34A'},
  missionDesc: {fontSize: 12, color: '#6B7280', marginTop: 2},
  pointBadge: {backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 8},
  pointBadgeText: {fontSize: 12, fontWeight: '700', color: '#16A34A'},
  chevron: {fontSize: 20, color: '#9CA3AF'},
  missionProgress: {flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 10},
  progressBg: {flex: 1, height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden'},
  progressFill: {height: '100%', borderRadius: 4, backgroundColor: '#22C55E'},
  progressText: {fontSize: 12, color: '#6B7280', fontWeight: '500', minWidth: 40, textAlign: 'right'},
  completedBadge: {flexDirection: 'row', alignItems: 'center', marginTop: 10},
  completedIcon: {fontSize: 14, marginRight: 6},
  completedText: {fontSize: 12, color: '#16A34A', fontWeight: '600'},
  emptyState: {alignItems: 'center', paddingVertical: 40},
  emptyText: {fontSize: 14, color: '#9CA3AF', marginTop: 10},
});

export default MissionScreen;
