import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

const ProgressBar = ({current, total, color = '#22C55E'}) => {
  const percent = Math.min((current / total) * 100, 100);
  return (
    <View style={styles.progressBg}>
      <View style={[styles.progressFill, {width: `${percent}%`, backgroundColor: color}]} />
    </View>
  );
};

const StatusBadge = ({text, active}) => (
  <View style={[styles.statusBadge, active ? styles.statusActive : styles.statusUpcoming]}>
    <Text style={[styles.statusText, active ? styles.statusActiveText : styles.statusUpcomingText]}>
      {text}
    </Text>
  </View>
);

const HistoryItem = ({date, title, success, kwh, points}) => (
  <TouchableOpacity style={styles.historyItem}>
    <View style={styles.historyLeft}>
      <View style={[styles.historyIcon, {backgroundColor: success ? '#ECFDF5' : '#FEF2F2'}]}>
        <Text style={{fontSize: 16, color: success ? '#22C55E' : '#EF4444'}}>
          {success ? '✓' : '✗'}
        </Text>
      </View>
      <View>
        <Text style={styles.historyTitle}>{date} {title}</Text>
        <Text style={styles.historyDetail}>
          {success ? '성공' : '미달'} · {kwh} kWh 절감 · {points}P
        </Text>
      </View>
    </View>
    <Text style={styles.chevron}>›</Text>
  </TouchableOpacity>
);

const DREventScreen = () => {
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <Text style={styles.pageTitle}>DR 이벤트</Text>
        <Text style={styles.pageSubtitle}>수요 반응 이벤트에 참여하고 보상을 받으세요</Text>

        {/* 전력 수급 주의보 */}
        <View style={styles.alertBanner}>
          <View style={styles.alertIcon}>
            <Text style={{fontSize: 18}}>⚠️</Text>
          </View>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>⚡ 전력 수급 주의보 발령</Text>
            <Text style={styles.alertDesc}>
              오늘 14시~17시 전력 예비율이 낮아 DR 이벤트가 발령되었습니다.
            </Text>
          </View>
        </View>

        {/* 하계 피크 절감 이벤트 - 진행 중 */}
        <View style={styles.eventCard}>
          <View style={styles.eventHeader}>
            <View style={styles.eventTitleRow}>
              <View style={styles.eventIconCircle}>
                <Text style={{fontSize: 18}}>⚡</Text>
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.eventTitle}>하계 피크 절감 이벤트</Text>
                <Text style={styles.eventTime}>🕐 14:00 ~ 17:00</Text>
              </View>
              <StatusBadge text="진행 중" active={true} />
            </View>
          </View>

          <View style={styles.eventBody}>
            <View style={styles.targetRow}>
              <Text style={styles.targetLabel}>절감 목표</Text>
              <Text style={styles.targetValue}>1.4 / 2.0 kWh</Text>
            </View>
            <ProgressBar current={1.4} total={2.0} />

            <View style={styles.rewardRow}>
              <Text style={styles.rewardText}>
                보상: <Text style={styles.rewardPoint}>500P</Text>
              </Text>
              <Text style={styles.participantText}>1,284명 참여 중</Text>
            </View>

            <TouchableOpacity style={styles.participateBtn}>
              <Text style={styles.participateBtnText}>참여하기</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 저녁 수요 분산 이벤트 - 예정 */}
        <View style={styles.eventCard}>
          <View style={styles.eventHeader}>
            <View style={styles.eventTitleRow}>
              <View style={[styles.eventIconCircle, {backgroundColor: '#F3F4F6'}]}>
                <Text style={{fontSize: 18}}>⚡</Text>
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.eventTitle}>저녁 수요 분산 이벤트</Text>
                <Text style={styles.eventTime}>🕐 18:00 ~ 21:00</Text>
              </View>
              <StatusBadge text="예정" active={false} />
            </View>
          </View>

          <View style={styles.eventBody}>
            <View style={styles.targetRow}>
              <Text style={styles.targetLabel}>절감 목표</Text>
              <Text style={styles.targetValue}>0 / 1.5 kWh</Text>
            </View>
            <ProgressBar current={0} total={1.5} color="#FCD34D" />

            <Text style={styles.rewardText}>
              보상: <Text style={styles.rewardPoint}>300P</Text>
            </Text>

            <TouchableOpacity style={styles.notifyBtn}>
              <Text style={styles.notifyBtnText}>알림 설정</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 지난 이벤트 참여 이력 */}
        <Text style={styles.sectionTitle}>지난 이벤트 참여 이력</Text>

        <View style={styles.historyCard}>
          <HistoryItem
            date="6/28"
            title="오후 피크 절감"
            success={true}
            kwh={2.3}
            points={500}
          />
          <View style={styles.historyDivider} />
          <HistoryItem
            date="6/27"
            title="저녁 수요 분산"
            success={true}
            kwh={1.8}
            points={300}
          />
          <View style={styles.historyDivider} />
          <HistoryItem
            date="6/25"
            title="오후 피크 절감"
            success={false}
            kwh={0.8}
            points={100}
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
  // Alert
  alertBanner: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  alertIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  alertDesc: {
    fontSize: 12,
    color: '#A16207',
    lineHeight: 18,
  },
  // Event card
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  eventHeader: {
    padding: 18,
    paddingBottom: 0,
  },
  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  eventTime: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  eventBody: {
    padding: 18,
    paddingTop: 14,
  },
  targetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  targetLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  targetValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  progressBg: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  rewardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  rewardText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 10,
  },
  rewardPoint: {
    color: '#22C55E',
    fontWeight: '700',
  },
  participantText: {
    fontSize: 13,
    color: '#6B7280',
  },
  participateBtn: {
    backgroundColor: '#22C55E',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  participateBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  notifyBtn: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  notifyBtnText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  // Status badge
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: '#DCFCE7',
  },
  statusUpcoming: {
    backgroundColor: '#F3F4F6',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusActiveText: {
    color: '#16A34A',
  },
  statusUpcomingText: {
    color: '#6B7280',
  },
  // History
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    marginTop: 8,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  historyDetail: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  historyDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
  },
  chevron: {
    fontSize: 20,
    color: '#9CA3AF',
  },
});

export default DREventScreen;
