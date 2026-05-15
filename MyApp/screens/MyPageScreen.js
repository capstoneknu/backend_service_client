import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import {useProfileStore, usePointStore} from '../store/store';
import {useAuthStore} from '../store/authStore';
import {ConfirmModal} from '../components/Modals';

// 설정 상세 모달
const SettingsModal = ({visible, title, onClose, children}) => (
  <Modal visible={visible} transparent animationType="slide">
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback>
          <View style={styles.settingsModalBox}>
            <View style={styles.modalHandle} />
            <Text style={styles.settingsModalTitle}>{title}</Text>
            {children}
            <TouchableOpacity style={styles.settingsCloseBtn} onPress={onClose}>
              <Text style={styles.settingsCloseBtnText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  </Modal>
);

const MyPageScreen = () => {
  const {
    name, location, household, ecoLevel, ecoLevelProgress,
    pointsToNextLevel, stats, monthlyReport, settings, toggleSetting,
  } = useProfileStore();
  const {totalPoints} = usePointStore();
  const {logout, user} = useAuthStore();

  const [activeModal, setActiveModal] = useState(null);
  const [logoutModal, setLogoutModal] = useState(false);

  const displayName = user?.name || name;
  const displayLocation = user?.location || location;
  const displayHousehold = user?.household || household;

// 1. 버그 수정: 월 목표가 0일 경우 NaN 또는 Infinity가 되어 앱이 크래시되는 현상 방어
// 수정 전: const goalPercent = Math.round((monthlyReport.used / monthlyReport.target) * 100);
  const goalPercent = monthlyReport.target > 0 
    ? Math.round((monthlyReport.used / monthlyReport.target) * 100) 
    : 0;

  const handleLogout = () => {
    setLogoutModal(false);
    logout();
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 프로필 */}
        <View style={styles.profileSection}>
          <View style={styles.profileAvatar}>
            <Text style={{fontSize: 32}}>👤</Text>
          </View>
          <View>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileLocation}>{displayLocation} · {displayHousehold}</Text>
            <View style={styles.levelBadge}>
              <Text style={{fontSize: 12}}>🌱</Text>
              <Text style={styles.levelText}>에코 실천가 Lv.{ecoLevel}</Text>
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
            {/*  수정 전 */}
            {/* <Text style={styles.statValue}>{stats.totalSaving} kWh</Text> */}
            {/* <Text style={styles.statValue}>{stats.co2Reduction} kg</Text> */}
            {/* <Text style={styles.statValue}>약 {stats.treesPlanted}그루</Text> */}

            {/* 수정 후 (천 단위 콤마 및 소수점 1자리 고정 포맷팅) */}
            <View style={styles.statItem}>
              <Text style={{fontSize: 22}}>⚡</Text>
              <Text style={styles.statValue}>{Number(stats.totalSaving).toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})} kWh</Text>
              <Text style={styles.statLabel}>총 절감량</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={{fontSize: 22}}>🌍</Text>
              <Text style={styles.statValue}>{Number(stats.co2Reduction).toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})} kg</Text>
              <Text style={styles.statLabel}>CO₂ 감축</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={{fontSize: 22}}>🌲</Text>
              <Text style={styles.statValue}>약 {Number(stats.treesPlanted).toLocaleString()}그루</Text>
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
            <TouchableOpacity onPress={() => setActiveModal('report')}>
              <Text style={styles.detailLink}>상세보기 →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.goalRow}>
            <Text style={styles.goalLabel}>월 사용량 목표</Text>
            <Text style={styles.goalValue}>
              {monthlyReport.used} / {monthlyReport.target} kWh
            </Text>
          </View>
          <View style={styles.goalProgressBg}>
            <View style={[styles.goalProgressFill, {width: `${goalPercent}%`}]} />
          </View>
          <Text style={styles.goalMessage}>
            목표 대비 {goalPercent}% · 잘하고 있어요! 🎉
          </Text>

          <View style={styles.reportStatsRow}>
            <View style={styles.reportStatCard}>
              <Text style={styles.reportStatLabel}>전월 대비</Text>
              <Text style={styles.reportStatDown}>▼ {monthlyReport.prevMonthSaving}% 절감</Text>
            </View>
            <View style={styles.reportStatCard}>
              <Text style={styles.reportStatLabel}>DR 참여</Text>
              <Text style={styles.reportStatValue}>
                {monthlyReport.drParticipation}회 / 성공 {monthlyReport.drSuccess}회
              </Text>
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
            <Text style={styles.levelRange}>Lv.{ecoLevel} → Lv.{ecoLevel + 1}</Text>
          </View>
          <View style={styles.ecoProgressBg}>
            <View style={[styles.ecoProgressFill, {width: `${ecoLevelProgress}%`}]} />
          </View>
          <Text style={styles.ecoRemainingText}>
            다음 레벨까지 {pointsToNextLevel}P 남았어요
          </Text>
        </View>

        {/* 설정 */}
        <Text style={styles.sectionTitle}>설정</Text>
        <View style={styles.settingsCard}>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setActiveModal('notification')}>
            <View style={styles.settingIcon}>
              <Text style={{fontSize: 20}}>🔔</Text>
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>알림 설정</Text>
              <Text style={styles.settingDesc}>DR 이벤트, 절약 미션 알림</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <View style={styles.settingDivider} />

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setActiveModal('iot')}>
            <View style={styles.settingIcon}>
              <Text style={{fontSize: 20}}>📡</Text>
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>IoT 기기 연결</Text>
              <Text style={styles.settingDesc}>
                스마트 플러그 {settings.iotDevices}개 연결됨
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <View style={styles.settingDivider} />

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setActiveModal('app')}>
            <View style={styles.settingIcon}>
              <Text style={{fontSize: 20}}>⚙️</Text>
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>앱 설정</Text>
              <Text style={styles.settingDesc}>언어, 테마, 계정 관리</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* 로그아웃 버튼 */}
        <TouchableOpacity
          style={styles.logoutBtn}
          activeOpacity={0.7}
          onPress={() => setLogoutModal(true)}>
          <Text style={styles.logoutBtnText}>로그아웃</Text>
        </TouchableOpacity>

        <View style={{height: 20}} />
      </ScrollView>

      {/* 알림 설정 모달 */}
      <SettingsModal
        visible={activeModal === 'notification'}
        title="알림 설정"
        onClose={() => setActiveModal(null)}>
        <View style={styles.settingsModalContent}>
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>DR 이벤트 알림</Text>
              <Text style={styles.switchDesc}>수요 반응 이벤트 시작 시 알림</Text>
            </View>
            <Switch
              value={settings.notificationDR}
              onValueChange={() => toggleSetting('notificationDR')}
              trackColor={{false: '#D1D5DB', true: '#86EFAC'}}
              thumbColor={settings.notificationDR ? '#22C55E' : '#F3F4F6'}
            />
          </View>
          <View style={styles.switchDivider} />
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>미션 알림</Text>
              <Text style={styles.switchDesc}>절약 미션 달성 및 새 미션 알림</Text>
            </View>
            <Switch
              value={settings.notificationMission}
              onValueChange={() => toggleSetting('notificationMission')}
              trackColor={{false: '#D1D5DB', true: '#86EFAC'}}
              thumbColor={settings.notificationMission ? '#22C55E' : '#F3F4F6'}
            />
          </View>
        </View>
      </SettingsModal>

      {/* IoT 기기 모달 */}
      <SettingsModal
        visible={activeModal === 'iot'}
        title="IoT 기기 연결"
        onClose={() => setActiveModal(null)}>
        <View style={styles.settingsModalContent}>
          <View style={styles.deviceItem}>
            <View style={styles.deviceIcon}>
              <Text style={{fontSize: 24}}>🔌</Text>
            </View>
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceName}>거실 스마트 플러그</Text>
              <Text style={styles.deviceStatus}>연결됨 · 현재 대기전력 0.3W</Text>
            </View>
            <View style={styles.deviceOnline} />
          </View>
          <View style={styles.switchDivider} />
          <View style={styles.deviceItem}>
            <View style={styles.deviceIcon}>
              <Text style={{fontSize: 24}}>🔌</Text>
            </View>
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceName}>서재 스마트 플러그</Text>
              <Text style={styles.deviceStatus}>연결됨 · 현재 대기전력 0.1W</Text>
            </View>
            <View style={styles.deviceOnline} />
          </View>
          <View style={styles.switchDivider} />
          <TouchableOpacity style={styles.addDeviceBtn}>
            <Text style={styles.addDeviceBtnText}>+ 새 기기 추가</Text>
          </TouchableOpacity>
        </View>
      </SettingsModal>

      {/* 앱 설정 모달 */}
      <SettingsModal
        visible={activeModal === 'app'}
        title="앱 설정"
        onClose={() => setActiveModal(null)}>
        <View style={styles.settingsModalContent}>
          <View style={styles.appSettingRow}>
            <Text style={styles.appSettingLabel}>언어</Text>
            <Text style={styles.appSettingValue}>한국어</Text>
          </View>
          <View style={styles.switchDivider} />
          <View style={styles.appSettingRow}>
            <Text style={styles.appSettingLabel}>테마</Text>
            <Text style={styles.appSettingValue}>라이트</Text>
          </View>
          <View style={styles.switchDivider} />
          <View style={styles.appSettingRow}>
            <Text style={styles.appSettingLabel}>계정</Text>
            <Text style={styles.appSettingValue}>{displayName}</Text>
          </View>
          <View style={styles.switchDivider} />
          <View style={styles.appSettingRow}>
            <Text style={styles.appSettingLabel}>앱 버전</Text>
            <Text style={styles.appSettingValue}>1.0.0</Text>
          </View>
        </View>
      </SettingsModal>

      {/* 월간 리포트 상세 모달 */}
      <SettingsModal
        visible={activeModal === 'report'}
        title="6월 월간 리포트"
        onClose={() => setActiveModal(null)}>
        <View style={styles.settingsModalContent}>
          <View style={styles.reportDetailRow}>
            <Text style={styles.reportDetailLabel}>총 전력 사용량</Text>
            <Text style={styles.reportDetailValue}>{monthlyReport.used} kWh</Text>
          </View>
          <View style={styles.switchDivider} />
          <View style={styles.reportDetailRow}>
            <Text style={styles.reportDetailLabel}>월 목표</Text>
            <Text style={styles.reportDetailValue}>{monthlyReport.target} kWh</Text>
          </View>
          <View style={styles.switchDivider} />
          <View style={styles.reportDetailRow}>
            <Text style={styles.reportDetailLabel}>전월 대비 절감</Text>
            <Text style={[styles.reportDetailValue, {color: '#EF4444'}]}>
              ▼ {monthlyReport.prevMonthSaving}%
            </Text>
          </View>
          <View style={styles.switchDivider} />
          <View style={styles.reportDetailRow}>
            <Text style={styles.reportDetailLabel}>DR 참여 횟수</Text>
            <Text style={styles.reportDetailValue}>{monthlyReport.drParticipation}회</Text>
          </View>
          <View style={styles.switchDivider} />
          <View style={styles.reportDetailRow}>
            <Text style={styles.reportDetailLabel}>DR 성공 횟수</Text>
            <Text style={[styles.reportDetailValue, {color: '#22C55E'}]}>
              {monthlyReport.drSuccess}회
            </Text>
          </View>
          <View style={styles.switchDivider} />
          <View style={styles.reportDetailRow}>
            <Text style={styles.reportDetailLabel}>획득 포인트</Text>
            <Text style={[styles.reportDetailValue, {color: '#22C55E'}]}>
              {totalPoints.toLocaleString()}P
            </Text>
          </View>
        </View>
      </SettingsModal>

      {/* 로그아웃 확인 모달 */}
      <ConfirmModal
        visible={logoutModal}
        title="로그아웃"
        message="정말 로그아웃하시겠습니까?"
        confirmText="로그아웃"
        cancelText="취소"
        onConfirm={handleLogout}
        onCancel={() => setLogoutModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F9FAFB'},
  scrollContent: {paddingHorizontal: 16, paddingTop: 50, paddingBottom: 20},
  // Profile
  profileSection: {flexDirection: 'row', alignItems: 'center', marginBottom: 20},
  profileAvatar: {width: 64, height: 64, borderRadius: 32, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', marginRight: 14},
  profileName: {fontSize: 22, fontWeight: '700', color: '#111827'},
  profileLocation: {fontSize: 13, color: '#6B7280', marginTop: 2},
  levelBadge: {flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 6, alignSelf: 'flex-start', gap: 4},
  levelText: {fontSize: 12, fontWeight: '600', color: '#16A34A'},
  // Card
  card: {backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2},
  cardHeader: {flexDirection: 'row', alignItems: 'center', gap: 6},
  cardTitle: {fontSize: 16, fontWeight: '700', color: '#111827'},
  statsRow: {flexDirection: 'row', marginTop: 16, gap: 10},
  statItem: {flex: 1, backgroundColor: '#F9FAFB', borderRadius: 14, paddingVertical: 14, alignItems: 'center'},
  statValue: {fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 6},
  statLabel: {fontSize: 11, color: '#6B7280', marginTop: 2},
  reportHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16},
  detailLink: {fontSize: 13, color: '#22C55E', fontWeight: '600'},
  goalRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8},
  goalLabel: {fontSize: 14, color: '#6B7280'},
  goalValue: {fontSize: 15, fontWeight: '700', color: '#111827'},
  goalProgressBg: {height: 10, backgroundColor: '#E5E7EB', borderRadius: 5, overflow: 'hidden', marginBottom: 8},
  goalProgressFill: {height: '100%', backgroundColor: '#22C55E', borderRadius: 5},
  goalMessage: {fontSize: 13, color: '#22C55E', fontWeight: '600', marginBottom: 14},
  reportStatsRow: {flexDirection: 'row', gap: 10},
  reportStatCard: {flex: 1, backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14, alignItems: 'center'},
  reportStatLabel: {fontSize: 12, color: '#6B7280', marginBottom: 4},
  reportStatDown: {fontSize: 15, fontWeight: '700', color: '#EF4444'},
  reportStatValue: {fontSize: 14, fontWeight: '700', color: '#111827'},
  ecoHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12},
  levelRange: {fontSize: 14, color: '#6B7280', fontWeight: '500'},
  ecoProgressBg: {height: 10, backgroundColor: '#E5E7EB', borderRadius: 5, overflow: 'hidden', marginBottom: 8},
  ecoProgressFill: {height: '100%', borderRadius: 5, backgroundColor: '#22C55E'},
  ecoRemainingText: {fontSize: 13, color: '#6B7280'},
  sectionTitle: {fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12, marginTop: 4},
  settingsCard: {backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2},
  settingItem: {flexDirection: 'row', alignItems: 'center', padding: 16},
  settingIcon: {width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 12},
  settingInfo: {flex: 1},
  settingTitle: {fontSize: 15, fontWeight: '600', color: '#111827'},
  settingDesc: {fontSize: 12, color: '#6B7280', marginTop: 2},
  settingDivider: {height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 16},
  chevron: {fontSize: 20, color: '#9CA3AF'},
  // Modals
  overlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end'},
  settingsModalBox: {backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '70%'},
  modalHandle: {width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', alignSelf: 'center', marginBottom: 16},
  settingsModalTitle: {fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 20},
  settingsModalContent: {marginBottom: 16},
  settingsCloseBtn: {backgroundColor: '#F3F4F6', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 10},
  settingsCloseBtnText: {fontSize: 16, fontWeight: '600', color: '#374151'},
  switchRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14},
  switchLabel: {fontSize: 15, fontWeight: '600', color: '#111827'},
  switchDesc: {fontSize: 12, color: '#6B7280', marginTop: 2},
  switchDivider: {height: 1, backgroundColor: '#F3F4F6'},
  // Device
  deviceItem: {flexDirection: 'row', alignItems: 'center', paddingVertical: 14},
  deviceIcon: {width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 12},
  deviceInfo: {flex: 1},
  deviceName: {fontSize: 15, fontWeight: '600', color: '#111827'},
  deviceStatus: {fontSize: 12, color: '#6B7280', marginTop: 2},
  deviceOnline: {width: 10, height: 10, borderRadius: 5, backgroundColor: '#22C55E'},
  addDeviceBtn: {backgroundColor: '#F0FDF4', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 14, borderWidth: 1, borderColor: '#BBF7D0', borderStyle: 'dashed'},
  addDeviceBtnText: {fontSize: 15, fontWeight: '600', color: '#16A34A'},
  // App setting
  appSettingRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14},
  appSettingLabel: {fontSize: 15, color: '#374151'},
  appSettingValue: {fontSize: 15, fontWeight: '600', color: '#111827'},
  // Report detail
  reportDetailRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12},
  reportDetailLabel: {fontSize: 14, color: '#6B7280'},
  reportDetailValue: {fontSize: 16, fontWeight: '700', color: '#111827'},
  // Logout
  logoutBtn: {backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 16, borderWidth: 1, borderColor: '#FCA5A5'},
  logoutBtnText: {fontSize: 16, fontWeight: '600', color: '#EF4444'},
});

export default MyPageScreen;