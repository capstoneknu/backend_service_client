import React, {useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {useProfileStore} from '../store/store';
import {useAuthStore} from '../store/authStore';

const MyPageScreen = () => {
  const {
    name, location, household,
    ecoLevel, ecoLevelProgress, pointsToNextLevel,
    stats, monthlyReport, settings,
    fetchProfile, toggleSetting, isLoading,
  } = useProfileStore();
  const {logout} = useAuthStore();
  const navigation = useNavigation();

  // ⭐ 화면 진입할 때마다 항상 최신 데이터 가져오기 (force=true)
  useFocusEffect(
    useCallback(() => {
      fetchProfile(true);
    }, []),
  );

  // ⭐ 화면 머무는 동안 1분마다 자동 갱신
  useEffect(() => {
    const timer = setInterval(() => {
      fetchProfile(true);
    }, 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃 하시겠습니까?',
      [
        {text: '취소', style: 'cancel'},
        {text: '로그아웃', onPress: logout, style: 'destructive'},
      ],
    );
  };

  const usedPercent = monthlyReport.target > 0
    ? Math.min(Math.round((monthlyReport.used / monthlyReport.target) * 100), 100)
    : 0;

  const drSuccessRate = monthlyReport.drParticipation > 0
    ? Math.round((monthlyReport.drSuccess / monthlyReport.drParticipation) * 100)
    : 0;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 프로필 헤더 */}
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={styles.avatarCircle}>
              <Text style={{fontSize: 30}}>👤</Text>
            </View>
            <View style={{flex: 1, marginLeft: 16}}>
              <Text style={styles.profileName}>{name}</Text>
              <Text style={styles.profileSubtitle}>{location} · {household}</Text>
            </View>
          </View>

          {/* 에코 레벨 */}
          <View style={styles.levelSection}>
            <View style={styles.levelRow}>
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>🌱 Lv.{ecoLevel}</Text>
              </View>
              <Text style={styles.levelProgressText}>
                다음 레벨까지 <Text style={{fontWeight: '700', color: '#22C55E'}}>{pointsToNextLevel}P</Text>
              </Text>
            </View>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, {width: `${ecoLevelProgress}%`}]} />
            </View>
          </View>
        </View>

        {/* 에너지 절약 통계 */}
        <Text style={styles.sectionTitle}>에너지 절약 통계</Text>
        {isLoading && stats.totalSaving === 0 ? (
          <ActivityIndicator size="large" color="#22C55E" style={{paddingVertical: 30}} />
        ) : (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={{fontSize: 24}}>⚡</Text>
              <Text style={styles.statValue}>{stats.totalSaving}</Text>
              <Text style={styles.statLabel}>kWh 절약</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={{fontSize: 24}}>🌍</Text>
              <Text style={styles.statValue}>{stats.co2Reduction}</Text>
              <Text style={styles.statLabel}>kg CO₂ 감축</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={{fontSize: 24}}>🌳</Text>
              <Text style={styles.statValue}>{stats.treesPlanted}</Text>
              <Text style={styles.statLabel}>그루 효과</Text>
            </View>
          </View>
        )}

        {/* 이번 달 리포트 */}
        <View style={styles.reportHeaderRow}>
          <Text style={styles.sectionTitle}>이번 달 리포트</Text>
          <TouchableOpacity onPress={() => navigation.navigate('UsageAnalysis')} activeOpacity={0.7}>
            <Text style={styles.detailLink}>상세 추이 보기 ›</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.reportCard}>
          <View style={styles.reportRow}>
            <Text style={styles.reportLabel}>월 목표</Text>
            <Text style={styles.reportValue}>{monthlyReport.target} kWh</Text>
          </View>
          <View style={styles.reportRow}>
            <Text style={styles.reportLabel}>이번 달 사용</Text>
            <Text style={styles.reportValue}>{monthlyReport.used} kWh ({usedPercent}%)</Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, {
              width: `${usedPercent}%`,
              backgroundColor: usedPercent > 90 ? '#EF4444' : usedPercent > 70 ? '#F59E0B' : '#22C55E',
            }]} />
          </View>
          <View style={[styles.reportRow, {marginTop: 16}]}>
            <Text style={styles.reportLabel}>전월 대비 절감</Text>
            <Text style={[styles.reportValue, {color: '#22C55E'}]}>
              {monthlyReport.prevMonthSaving > 0 ? '↓' : ''} {monthlyReport.prevMonthSaving}%
            </Text>
          </View>
          <View style={styles.reportRow}>
            <Text style={styles.reportLabel}>DR 참여</Text>
            <Text style={styles.reportValue}>
              {monthlyReport.drSuccess} / {monthlyReport.drParticipation}회 성공 ({drSuccessRate}%)
            </Text>
          </View>
        </View>

        {/* 설정 */}
        <Text style={styles.sectionTitle}>설정</Text>
        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>DR 이벤트 알림</Text>
            <Switch
              value={settings.notificationDR}
              onValueChange={() => toggleSetting('notificationDR')}
              trackColor={{false: '#E5E7EB', true: '#86EFAC'}}
              thumbColor={settings.notificationDR ? '#22C55E' : '#9CA3AF'} />
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>미션 알림</Text>
            <Switch
              value={settings.notificationMission}
              onValueChange={() => toggleSetting('notificationMission')}
              trackColor={{false: '#E5E7EB', true: '#86EFAC'}}
              thumbColor={settings.notificationMission ? '#22C55E' : '#9CA3AF'} />
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>연결된 IoT 기기</Text>
            <Text style={styles.settingValue}>{settings.iotDevices}대</Text>
          </View>
        </View>

        {/* 로그아웃 */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>

        <View style={{height: 30}} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F9FAFB'},
  scrollContent: {paddingHorizontal: 16, paddingTop: 50, paddingBottom: 20},

  profileCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 20,
    shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  profileTop: {flexDirection: 'row', alignItems: 'center', marginBottom: 16},
  avatarCircle: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#ECFDF5',
    alignItems: 'center', justifyContent: 'center',
  },
  profileName: {fontSize: 20, fontWeight: '700', color: '#111827'},
  profileSubtitle: {fontSize: 13, color: '#6B7280', marginTop: 4},

  levelSection: {marginTop: 8},
  levelRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8},
  levelBadge: {backgroundColor: '#ECFDF5', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12},
  levelText: {fontSize: 14, fontWeight: '700', color: '#16A34A'},
  levelProgressText: {fontSize: 12, color: '#6B7280'},

  progressBg: {height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden'},
  progressFill: {height: '100%', backgroundColor: '#22C55E', borderRadius: 4},

  sectionTitle: {fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12, marginTop: 4},
  reportHeaderRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  detailLink: {fontSize: 13, fontWeight: '600', color: '#16A34A'},

  statsRow: {flexDirection: 'row', gap: 10, marginBottom: 20},
  statCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  statValue: {fontSize: 18, fontWeight: '700', color: '#111827', marginTop: 6},
  statLabel: {fontSize: 11, color: '#6B7280', marginTop: 2},

  reportCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, marginBottom: 20,
    shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  reportRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10},
  reportLabel: {fontSize: 13, color: '#6B7280'},
  reportValue: {fontSize: 14, fontWeight: '700', color: '#111827'},

  settingsCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 4, marginBottom: 20,
    shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  settingRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14},
  settingLabel: {fontSize: 14, color: '#111827'},
  settingValue: {fontSize: 14, color: '#6B7280'},
  divider: {height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 14},

  logoutBtn: {
    backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 16, alignItems: 'center',
    borderWidth: 1, borderColor: '#FECACA',
  },
  logoutText: {fontSize: 16, fontWeight: '600', color: '#EF4444'},
});

export default MyPageScreen;