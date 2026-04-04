import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

const SettingItem = ({icon, title, desc, onPress}) => (
  <TouchableOpacity style={styles.settingItem} onPress={onPress}>
    <View style={styles.settingIcon}>
      <Text style={{fontSize: 20}}>{icon}</Text>
    </View>
    <View style={styles.settingInfo}>
      <Text style={styles.settingTitle}>{title}</Text>
      <Text style={styles.settingDesc}>{desc}</Text>
    </View>
    <Text style={styles.chevron}>›</Text>
  </TouchableOpacity>
);

const MyPageScreen = () => {
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* 프로필 */}
        <View style={styles.profileSection}>
          <View style={styles.profileAvatar}>
            <Text style={{fontSize: 32}}>👤</Text>
          </View>
          <View>
            <Text style={styles.profileName}>김에너지</Text>
            <Text style={styles.profileLocation}>강원도 춘천시 · 3인 가구</Text>
            <View style={styles.levelBadge}>
              <Text style={{fontSize: 12}}>🌱</Text>
              <Text style={styles.levelText}>에코 실천가 Lv.3</Text>
            </View>
          </View>
        </View>

        {/* 에너지 절약 통계 */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={{fontSize: 14}}>♻️</Text>
            <Text style={styles.cardTitle}>에너지 절약 통계</Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={{fontSize: 22}}>⚡</Text>
              <Text style={styles.statValue}>248 kWh</Text>
              <Text style={styles.statLabel}>총 절감량</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={{fontSize: 22}}>🌍</Text>
              <Text style={styles.statValue}>108 kg</Text>
              <Text style={styles.statLabel}>CO₂ 감축</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={{fontSize: 22}}>🌲</Text>
              <Text style={styles.statValue}>약 5그루</Text>
              <Text style={styles.statLabel}>심은 나무</Text>
            </View>
          </View>
        </View>

        {/* 6월 월간 리포트 */}
        <View style={styles.card}>
          <View style={styles.reportHeader}>
            <View style={styles.cardHeader}>
              <Text style={{fontSize: 14}}>📊</Text>
              <Text style={styles.cardTitle}>6월 월간 리포트</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.detailLink}>상세보기 →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.goalRow}>
            <Text style={styles.goalLabel}>월 사용량 목표</Text>
            <Text style={styles.goalValue}>285 / 400 kWh</Text>
          </View>
          <View style={styles.goalProgressBg}>
            <View style={[styles.goalProgressFill, {width: '71%'}]} />
          </View>
          <Text style={styles.goalMessage}>
            목표 대비 71% · 잘하고 있어요! 🎉
          </Text>

          <View style={styles.reportStatsRow}>
            <View style={styles.reportStatCard}>
              <Text style={styles.reportStatLabel}>전월 대비</Text>
              <Text style={styles.reportStatDown}>▼ 15% 절감</Text>
            </View>
            <View style={styles.reportStatCard}>
              <Text style={styles.reportStatLabel}>DR 참여</Text>
              <Text style={styles.reportStatValue}>8회 / 성공 6회</Text>
            </View>
          </View>
        </View>

        {/* 에코 레벨 */}
        <View style={styles.card}>
          <View style={styles.ecoHeader}>
            <View style={styles.cardHeader}>
              <Text style={{fontSize: 14}}>🔔</Text>
              <Text style={styles.cardTitle}>에코 레벨</Text>
            </View>
            <Text style={styles.levelRange}>Lv.3 → Lv.4</Text>
          </View>
          <View style={styles.ecoProgressBg}>
            <View style={[styles.ecoProgressFill, {width: '65%'}]} />
          </View>
          <Text style={styles.ecoRemainingText}>
            다음 레벨까지 320P 남았어요
          </Text>
        </View>

        {/* 설정 */}
        <Text style={styles.sectionTitle}>설정</Text>
        <View style={styles.settingsCard}>
          <SettingItem
            icon="🔔"
            title="알림 설정"
            desc="DR 이벤트, 절약 미션 알림"
          />
          <View style={styles.settingDivider} />
          <SettingItem
            icon="📡"
            title="IoT 기기 연결"
            desc="스마트 플러그 2개 연결됨"
          />
          <View style={styles.settingDivider} />
          <SettingItem
            icon="⚙️"
            title="앱 설정"
            desc="언어, 테마, 계정 관리"
          />
        </View>

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
  // Profile
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  profileLocation: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
    alignSelf: 'flex-start',
    gap: 4,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },
  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 10,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 6,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  // Report
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailLink: {
    fontSize: 13,
    color: '#22C55E',
    fontWeight: '600',
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  goalValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  goalProgressBg: {
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  goalProgressFill: {
    height: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 5,
  },
  goalMessage: {
    fontSize: 13,
    color: '#22C55E',
    fontWeight: '600',
    marginBottom: 14,
  },
  reportStatsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  reportStatCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  reportStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  reportStatDown: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EF4444',
  },
  reportStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  // Eco level
  ecoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelRange: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  ecoProgressBg: {
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  ecoProgressFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: '#22C55E',
  },
  ecoRemainingText: {
    fontSize: 13,
    color: '#6B7280',
  },
  // Settings
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    marginTop: 4,
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  settingDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  settingDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
  },
  chevron: {
    fontSize: 20,
    color: '#9CA3AF',
  },
});

export default MyPageScreen;
