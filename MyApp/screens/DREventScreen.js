import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {useDRStore} from '../store/store';
// [수정] DREventHistoryModal 임포트 추가
import {ConfirmModal, ToastModal, EventDetailModal, DREventHistoryModal} from '../components/Modals';

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

const DREventScreen = () => {
  const {events, history, fetchEvents, fetchHistory, participateEvent,
    toggleNotification, isLoading} = useDRStore();

  const [confirmModal, setConfirmModal] = useState({visible: false, eventId: null});
  const [toast, setToast] = useState({visible: false, message: '', type: 'success'});
  const [detailModal, setDetailModal] = useState({visible: false, event: null});

  // [추가] 전체 내역 보기 모달 상태
  const [historyModalVisible, setHistoryModalVisible] = useState(false);

  // 최초 1회만 API 호출 (이후 캐시 사용)
  useEffect(() => {
    fetchEvents();
    fetchHistory();
  }, []);

  const handleParticipate = (eventId) => {
    setConfirmModal({visible: true, eventId});
  };

  const confirmParticipate = async () => {
    const eventId = confirmModal.eventId;
    setConfirmModal({visible: false, eventId: null});

    const result = await participateEvent(eventId);
    if (result.success) {
      showToast('DR 이벤트에 참여했습니다! 절전을 시작하세요 💪', 'success');
    } else {
      showToast(result.error || '참여에 실패했습니다.', 'error');
    }
  };

  const handleToggleNotification = async (eventId) => {
    const event = events.find(e => e.id === eventId);
    await toggleNotification(eventId);
    showToast(
      event?.notificationSet
        ? '알림이 해제되었습니다'
        : '이벤트 시작 시 알림을 보내드릴게요 🔔',
      event?.notificationSet ? 'info' : 'success',
    );
  };

  const showToast = (message, type = 'success') => {
    setToast({visible: true, message, type});
    setTimeout(() => setToast({visible: false, message: '', type: 'success'}), 2500);
  };

  const handleHistoryPress = (event) => {
    setDetailModal({visible: true, event});
  };

  // [수정] 데이터 유무에 따른 동적 상태 도출
  const hasActiveEvents = events && events.length > 0;

  // [추가] 최근 5개의 이력만 슬라이싱 (OOM 방어 및 UX 개선)
  const slicedHistory = history.slice(0, 5);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>DR 이벤트</Text>
        <Text style={styles.pageSubtitle}>수요 반응 이벤트에 참여하고 보상을 받으세요</Text>

        {/* [수정] 이벤트 유무에 따라 배너 상태 동적 전환 (긴급 vs 안정) */}
        {hasActiveEvents ? (
          <View style={styles.alertBanner}>
            <View style={styles.alertIcon}><Text style={{fontSize: 18}}>⚠️</Text></View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>⚡ 전력 수급 주의보 발령</Text>
              <Text style={styles.alertDesc}>현재 예비율이 낮아 DR 이벤트가 발령되었습니다. 절전에 동참해주세요.</Text>
            </View>
          </View>
        ) : (
          <View style={[styles.alertBanner, {backgroundColor: '#ECFDF5', borderColor: '#D1FAE5'}]}>
            <View style={styles.alertIcon}><Text style={{fontSize: 18}}>🌿</Text></View>
            <View style={styles.alertContent}>
              <Text style={[styles.alertTitle, {color: '#065F46'}]}>안정적인 전력 수급</Text>
              <Text style={[styles.alertDesc, {color: '#047857'}]}>현재 발령된 DR 이벤트가 없습니다. 평소처럼 에너지를 절약해주세요.</Text>
            </View>
          </View>
        )}

        {/* [수정] Empty State UI 제공 */}
        {isLoading && events.length === 0 ? (
          <ActivityIndicator size="large" color="#22C55E" style={{paddingVertical: 30}} />
        ) : !hasActiveEvents ? (
          <View style={styles.emptyEventState}>
            <Text style={{fontSize: 50}}>🍃</Text>
            <Text style={styles.emptyEventTitle}>진행 중인 이벤트가 없습니다</Text>
            <Text style={styles.emptyEventDesc}>새로운 수요반응 발령 시 알려드릴게요!</Text>
          </View>
        ) : (
          events.map(event => (
            <View key={event.id} style={styles.eventCard}>
              <View style={styles.eventHeader}>
                <View style={styles.eventTitleRow}>
                  <View style={[styles.eventIconCircle, {backgroundColor: event.status === 'active' ? '#ECFDF5' : '#F3F4F6'}]}>
                    <Text style={{fontSize: 18}}>⚡</Text>
                  </View>
                  <View style={{flex: 1}}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <Text style={styles.eventTime}>🕐 {event.startTime} ~ {event.endTime}</Text>
                  </View>
                  <StatusBadge text={event.status === 'active' ? '진행 중' : '예정'} active={event.status === 'active'} />
                </View>
              </View>
              <View style={styles.eventBody}>
                <View style={styles.targetRow}>
                  <Text style={styles.targetLabel}>절감 목표</Text>
                  <Text style={styles.targetValue}>{(event.currentKwh || 0).toFixed(1)} / {event.targetKwh} kWh</Text>
                </View>
                <ProgressBar current={event.currentKwh || 0} total={event.targetKwh} color={event.status === 'active' ? '#22C55E' : '#FCD34D'} />
                <View style={styles.rewardRow}>
                  <Text style={styles.rewardText}>보상: <Text style={styles.rewardPoint}>{event.reward}P</Text></Text>
                  {event.status === 'active' && (
                    <Text style={styles.participantText}>{(event.participants || 0).toLocaleString()}명 참여 중</Text>
                  )}
                </View>
                {event.status === 'active' && (
                  <TouchableOpacity
                    style={[styles.participateBtn, event.isParticipating && styles.participatingBtn]}
                    activeOpacity={0.8} disabled={event.isParticipating}
                    onPress={() => handleParticipate(event.id)}>
                    <Text style={[styles.participateBtnText, event.isParticipating && styles.participatingBtnText]}>
                      {event.isParticipating ? '✓ 참여 중' : '참여하기'}
                    </Text>
                  </TouchableOpacity>
                )}
                {event.status === 'upcoming' && (
                  <TouchableOpacity
                    style={[styles.notifyBtn, event.notificationSet && styles.notifyBtnActive]}
                    activeOpacity={0.8} onPress={() => handleToggleNotification(event.id)}>
                    <Text style={[styles.notifyBtnText, event.notificationSet && styles.notifyBtnActiveText]}>
                      {event.notificationSet ? '🔔 알림 설정됨' : '알림 설정'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}

        {/* 지난 이벤트 참여 이력 */}
        {/* 타이틀과 전체보기 버튼 레이아웃 결합 */}
        <View style={styles.historyHeaderRow}>
          <Text style={styles.sectionTitle}>지난 이벤트 참여 이력</Text>
          {history.length > 5 && (
            <TouchableOpacity onPress={() => setHistoryModalVisible(true)} activeOpacity={0.6}>
              <Text style={styles.seeAllText}>전체보기 ›</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.historyCard}>
          {history.length === 0 ? (
            <View style={{padding: 20, alignItems: 'center'}}>
              <Text style={{color: '#9CA3AF'}}>참여 이력이 없습니다</Text>
            </View>
          ) : (
            // 제한된 slicedHistory 기반 렌더링
            slicedHistory.map((item, index) => (
              <View key={item.id}>
                <TouchableOpacity style={styles.historyItem} activeOpacity={0.6}
                  onPress={() => handleHistoryPress(item)}>
                  <View style={styles.historyLeft}>
                    <View style={[styles.historyIcon, {backgroundColor: item.success ? '#ECFDF5' : '#FEF2F2'}]}>
                      <Text style={{fontSize: 16, color: item.success ? '#22C55E' : '#EF4444'}}>
                        {item.success ? '✓' : '✗'}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.historyTitle}>{item.date} {item.title}</Text>
                      <Text style={styles.historyDetail}>
                        {item.success ? '성공' : '미달'} · {item.kwh} kWh 절감 · {item.points}P
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
                {index < slicedHistory.length - 1 && <View style={styles.historyDivider} />}
              </View>
            ))
          )}

        {/* [⭐ 수술 포인트] 하단 더보기 버튼 트리거 결합 */}
          {history.length > 5 && (
            <TouchableOpacity style={styles.moreLoadRow} onPress={() => setHistoryModalVisible(true)} activeOpacity={0.7}>
              <Text style={styles.moreLoadText}>이벤트 참여 이력 {history.length}건 확인하기</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={{height: 20}} />
      </ScrollView>

      {/* 모달 연동 유지 및 신규 모달 결합 */}
      <ConfirmModal visible={confirmModal.visible} title="DR 이벤트 참여"
        message={`이벤트에 참여하시겠습니까?\n참여 후 절감 목표를 달성하면 포인트를 받을 수 있습니다.`}
        confirmText="참여하기" onConfirm={confirmParticipate}
        onCancel={() => setConfirmModal({visible: false, eventId: null})} />
      <ToastModal visible={toast.visible} message={toast.message} type={toast.type}
        onClose={() => setToast({...toast, visible: false})} />
      <EventDetailModal visible={detailModal.visible} event={detailModal.event}
        onClose={() => setDetailModal({visible: false, event: null})} />
        
      {/* 전체 내역 팝업 모달 마운트 */}
      <DREventHistoryModal
        visible={historyModalVisible}
        history={history}
        onEventPress={(event) => {
          setHistoryModalVisible(false);
          setTimeout(() => handleHistoryPress(event), 300); // 닫힌 후 상세창 열기
        }}
        onClose={() => setHistoryModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F9FAFB'},
  scrollContent: {paddingHorizontal: 16, paddingTop: 50, paddingBottom: 20},
  pageTitle: {fontSize: 24, fontWeight: '700', color: '#111827'},
  pageSubtitle: {fontSize: 14, color: '#6B7280', marginTop: 4, marginBottom: 16},

  alertBanner: {backgroundColor: '#FFFBEB', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, borderWidth: 1, borderColor: '#FEF3C7'},
  alertIcon: {marginRight: 10, marginTop: 2},
  alertContent: {flex: 1},
  alertTitle: {fontSize: 14, fontWeight: '700', color: '#92400E', marginBottom: 4},
  alertDesc: {fontSize: 12, color: '#A16207', lineHeight: 18},

  // [추가] Empty State 카드 스타일
  emptyEventState: {alignItems: 'center', paddingVertical: 40, backgroundColor: '#FFFFFF', borderRadius: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2},
  emptyEventTitle: {fontSize: 16, fontWeight: '700', color: '#374151', marginTop: 12, marginBottom: 4},
  emptyEventDesc: {fontSize: 13, color: '#9CA3AF'},

  eventCard: {backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', marginBottom: 16, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2},
  eventHeader: {padding: 18, paddingBottom: 0},
  eventTitleRow: {flexDirection: 'row', alignItems: 'center'},
  eventIconCircle: {width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12},
  eventTitle: {fontSize: 16, fontWeight: '700', color: '#111827'},
  eventTime: {fontSize: 13, color: '#6B7280', marginTop: 2},
  eventBody: {padding: 18, paddingTop: 14},
  targetRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8},
  targetLabel: {fontSize: 13, color: '#6B7280'},
  targetValue: {fontSize: 15, fontWeight: '700', color: '#111827'},
  progressBg: {height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden', marginBottom: 12},
  progressFill: {height: '100%', borderRadius: 4},
  rewardRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14},
  rewardText: {fontSize: 14, color: '#374151', fontWeight: '500'},
  rewardPoint: {color: '#22C55E', fontWeight: '700'},
  participantText: {fontSize: 13, color: '#6B7280'},
  participateBtn: {backgroundColor: '#22C55E', borderRadius: 12, paddingVertical: 14, alignItems: 'center'},
  participateBtnText: {color: '#FFFFFF', fontSize: 16, fontWeight: '700'},
  participatingBtn: {backgroundColor: '#ECFDF5', borderWidth: 1.5, borderColor: '#22C55E'},
  participatingBtnText: {color: '#16A34A'},
  notifyBtn: {backgroundColor: '#F3F4F6', borderRadius: 12, paddingVertical: 14, alignItems: 'center'},
  notifyBtnText: {color: '#374151', fontSize: 16, fontWeight: '600'},
  notifyBtnActive: {backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FCD34D'},
  notifyBtnActiveText: {color: '#92400E'},
  statusBadge: {paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12},
  statusActive: {backgroundColor: '#DCFCE7'}, statusUpcoming: {backgroundColor: '#F3F4F6'},
  statusText: {fontSize: 12, fontWeight: '600'},
  statusActiveText: {color: '#16A34A'}, statusUpcomingText: {color: '#6B7280'},

  // 헤더 및 푸터 스타일 병합 
  historyHeaderRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 8},
  sectionTitle: {fontSize: 18, fontWeight: '700', color: '#111827'},
  seeAllText: {fontSize: 14, fontWeight: '600', color: '#6B7280', paddingLeft: 10},
  historyCard: {backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2},
  historyItem: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16},
  historyLeft: {flexDirection: 'row', alignItems: 'center', flex: 1},
  historyIcon: {width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 12},
  historyTitle: {fontSize: 14, fontWeight: '600', color: '#111827'},
  historyDetail: {fontSize: 12, color: '#6B7280', marginTop: 2},
  historyDivider: {height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 16},
  chevron: {fontSize: 20, color: '#9CA3AF'},
  moreLoadRow: {paddingVertical: 14, alignItems: 'center', backgroundColor: '#F9FAFB', borderTopWidth: 1, borderColor: '#F3F4F6'},
  moreLoadText: {fontSize: 13, fontWeight: '600', color: '#4B5563'},
});

export default DREventScreen;