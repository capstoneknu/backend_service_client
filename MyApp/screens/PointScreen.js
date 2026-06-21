import React, {useState, useEffect} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import {usePointStore} from '../store/store';
import {QRPaymentModal, ToastModal, PointHistoryModal} from '../components/Modals'; // [추가] PointHistoryModal 추가
import { pointAPI } from '../api/apiClient'; // [추가] 트랜잭션 직접 제어를 위한 API 임포트

const localStores = [
  {category: '카페', icon: '☕', stores: ['강릉 커피거리', '춘천 감성카페', '속초 바다카페']},
  {category: '맛집', icon: '🍽️', stores: ['춘천 닭갈비 골목', '속초 중앙시장', '강릉 초당두부']},
  {category: '체험', icon: '🎯', stores: ['남이섬', '정선 레일바이크', '평창 목장']},
];

// 가맹점별 고정 가격표 (단위: Point) 
const storePriceMap = {
  '강릉 커피거리': 450, // 테스트용 임의 조절
  '춘천 감성카페': 5500,
  '속초 바다카페': 6000,
  '춘천 닭갈비 골목': 18000,
  '속초 중앙시장': 18000,
  '강릉 초당두부': 12000,
  '남이섬': 16000,
  '정선 레일바이크': 30000,
  '평창 목장': 12000
};

const PointScreen = () => {
  const {totalPoints, usedPoints, availablePoints, history, fetchPoints, isLoading} = usePointStore();
  const [toast, setToast] = useState({visible: false, message: '', type: 'success'});

  // 결제 타겟과 금액을 명확히 통제하는 중앙 상태 객체
  const [qrConfig, setQrConfig] = useState({ visible: false, store: '', amount: 0 });
  const [paymentState, setPaymentState] = useState({ status: 'idle', message: '' });
  
  // [추가] 전체 내역 보기 모달 가시성 상태 변수 선언
  const [historyModalVisible, setHistoryModalVisible] = useState(false);

  // API에서 데이터 로드
  useEffect(() => {
    fetchPoints();
  }, []);

  const showToast = (message, type = 'info') => {
    setToast({visible: true, message, type});
    setTimeout(() => setToast({visible: false, message: '', type: 'success'}), 2500);
  };

  // 1. 하단 리스트 클릭 시
  const handleStorePress = (storeName) => {
    // 정해진 메뉴 가격을 가져옴
    const exactAmount = storePriceMap[storeName]; 
    setQrConfig({ visible: true, store: storeName, amount: exactAmount });
    setPaymentState({ status: 'idle', message: '' });
  };

  // 2. 상단 메인 QR 스캔 버튼 클릭 시 (랜덤 스캔 시뮬레이션)
  const handleMainQRButton = () => {
    setQrConfig({ visible: true, store: '', amount: 0 });
    setPaymentState({ status: 'scanning', message: '' });

    setTimeout(() => {
      // 카메라는 무작위 가맹점을 비추지만, 가격은 그 가맹점의 고정 가격을 따르도록 설정
      const randomGroup = localStores[Math.floor(Math.random() * localStores.length)];
      const randomStore = randomGroup.stores[Math.floor(Math.random() * randomGroup.stores.length)];
      const exactAmount = storePriceMap[randomStore];
      
      setQrConfig({ visible: true, store: randomStore, amount: exactAmount });
      setPaymentState({ status: 'idle', message: '' });
    }, 1500);
  };

  // 3. 결제 트랜잭션 수행 - [E2E] Saga 패턴 트랜잭션 관통 및 보상 결과 동기화 로직
  const handlePaymentTransaction = async () => {
    try {
      setPaymentState({ status: 'loading', message: '' });
      const response = await pointAPI.spend(qrConfig.store, qrConfig.amount); // 동적 데이터 전송

      if(response.success) {
        setPaymentState({ status: 'success', message: `[${qrConfig.store}]\n정상 처리되었습니다.` });
      }
    } catch (error) {
      setPaymentState({ status: 'error', message: error.message });
    } finally {
      // await를 걸어 백엔드 데이터를 UI에 완전히 덮어씌운 뒤에만 함수를 종료시킴 
      await fetchPoints(); 
    }
  };

  const handleCloseModal = () => {
    setQrConfig(prev => ({ ...prev, visible: false }));
    // 모달이 닫히는 애니메이션(300ms) 대기 후 찌꺼기 상태 청소
    setTimeout(() => {
      setQrConfig({ visible: false, store: '', amount: 0 });
      setPaymentState({ status: 'idle', message: '' });
    }, 300); 
  };

  // [추가] 최근 5개의 트랜잭션만 계산하여 슬라이싱 추출
  const slicedHistory = history.slice(0, 5);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>포인트 & 리워드</Text>
        <Text style={styles.pageSubtitle}>에너지 절약으로 모은 포인트를 강원도에서 사용하세요</Text>

        {/* [수정] 정보 위계 교체 */}
        <View style={styles.pointCard}>
          <Text style={styles.pointCardLabel}><Text style={{fontSize: 18}}>사용 가능 포인트</Text></Text>
          <Text style={styles.pointCardValue}>{availablePoints.toLocaleString()} <Text style={{fontSize: 24}}>포인트 </Text></Text>
          <View style={styles.pointCardRow}>
            <View style={styles.availableBadge}>
              <Text style={styles.availableBadgeText}>총 적립 포인트 {totalPoints.toLocaleString()}P</Text>
            </View>
            <Text style={styles.usedText}>사용 완료 {usedPoints.toLocaleString()}P</Text>
          </View>
          {/* 상단 버튼 이벤트 교체 */}
          <TouchableOpacity style={styles.qrButton} activeOpacity={0.8} onPress={handleMainQRButton}>
            <Text style={styles.qrButtonText}>QR코드 스캔 결제</Text>
          </TouchableOpacity>
        </View>

        {/* [추가] 타이틀과 전체보기 버튼 레이아웃 결합 */}
        <View style={styles.historyHeaderRow}>
          <Text style={styles.sectionTitle}>포인트 내역</Text>
          {history.length > 5 && (
            <TouchableOpacity onPress={() => setHistoryModalVisible(true)} activeOpacity={0.6}>
              <Text style={styles.seeAllText}>전체보기 ›</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.historyCard}>
          {isLoading && history.length === 0 ? (
            <ActivityIndicator size="small" color="#22C55E" style={{padding: 20}} />
          ) : history.length === 0 ? (
            <View style={{padding: 20, alignItems: 'center'}}>
              <Text style={{color: '#9CA3AF'}}>포인트 내역이 없습니다</Text>
            </View>
          ) : (
            // [수정] 원본 history 대신 제한된 slicedHistory를 기반으로 렌더링
            slicedHistory.map((item, index) => (
              <View key={item.id || index}>
                <TouchableOpacity style={styles.historyItem} activeOpacity={0.6}
                  onPress={() => showToast(
                    `${item.date} | ${item.title} | ${item.points > 0 ? '+' : ''}${item.points}P`,
                    item.points > 0 ? 'success' : 'info',
                  )}>
                  <View style={styles.historyLeft}>
                    {/* 환불(refund) 내역일 경우 파란색 뱃지 처리 */}
                    <View style={[styles.historyIcon, {
                      backgroundColor: item.type === 'earn' ? '#ECFDF5' : item.type === 'refund' ? '#EFF6FF' : '#FEF2F2'}]}>
                      <Text style={{fontSize: 14, color: item.type === 'earn' ? '#22C55E' : item.type === 'refund' ? '#3B82F6' : '#EF4444'}}>
                        {item.type === 'earn' ? '↙' : item.type === 'refund' ? '↺' : '↗'}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.historyTitle}>{item.title}</Text>
                      <Text style={styles.historyDate}>{item.date}</Text>
                    </View>
                  </View>
                  <Text style={[styles.historyPoints, {color: item.points > 0 ? (item.type === 'refund' ? '#3B82F6' : '#22C55E') : '#EF4444'}]}>
                    {item.points > 0 ? '+' : ''}{item.points}P
                  </Text>
                </TouchableOpacity>
                {index < history.length - 1 && <View style={styles.divider} />}
              </View>
            ))
          )}

          {/* 리스트 최하단 하이퍼링크형 더보기 인터페이스 */}
          {history.length > 5 && (
            <TouchableOpacity style={styles.moreLoadRow} onPress={() => setHistoryModalVisible(true)} activeOpacity={0.7}>
              <Text style={styles.moreLoadText}>포인트 전체 내역 {history.length}건 확인하기</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.localSection}>
          <View style={styles.localHeader}>
            <Text style={{fontSize: 14}}>📍</Text>
            <Text style={styles.localTitle}>강원도 지역 사용처</Text>
          </View>
          {localStores.map((group, idx) => (
            <View key={idx} style={styles.storeGroup}>
              <View style={styles.storeGroupHeader}>
                <Text style={{fontSize: 16}}>{group.icon}</Text>
                <Text style={styles.storeGroupTitle}>{group.category}</Text>
              </View>
              <View style={styles.storeTagsRow}>
                {group.stores.map((store, sIdx) => (
                  <TouchableOpacity key={sIdx} style={styles.storeTag} activeOpacity={0.7}
                    onPress={() => handleStorePress(store)}>
                    <Text style={styles.storeTagText}>{store}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>
        <View style={{height: 20}} />
      </ScrollView>

      {/* 동적 데이터 연동 프롭스 주입 */}
      <QRPaymentModal 
        visible={qrConfig.visible} 
        availablePoints={availablePoints.toLocaleString()}
        storeName={qrConfig.store}
        amount={qrConfig.amount}
        paymentState={paymentState}
        onPay={handlePaymentTransaction}
        onClose={handleCloseModal} 
      />

      {/* [추가] 전체 내역 팝업 컴포넌트 마운트 및 바인딩 */}
      <PointHistoryModal
        visible={historyModalVisible}
        history={history}
        onClose={() => setHistoryModalVisible(false)}
      />

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
  pointCard: {backgroundColor: '#22C55E', borderRadius: 20, padding: 24, marginBottom: 24},
  pointCardLabel: {fontSize: 14, color: '#DCFCE7', fontWeight: '500'},
  pointCardValue: {fontSize: 36, fontWeight: '800', color: '#FFFFFF', marginTop: 4, marginBottom: 12},
  pointCardRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12},
  availableBadge: {backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16},
  availableBadgeText: {color: '#FFFFFF', fontSize: 13, fontWeight: '600'},
  usedText: {color: '#DCFCE7', fontSize: 13},
  qrButton: {backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 12, paddingVertical: 12, alignItems: 'center'},
  qrButtonText: {color: '#FFFFFF', fontSize: 15, fontWeight: '700'},

  // [추가] 타이틀 행 스타일 정의
  historyHeaderRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12},
  sectionTitle: {fontSize: 18, fontWeight: '700', color: '#111827'},
  seeAllText: {fontSize: 14, fontWeight: '600', color: '#6B7280', paddingLeft: 10},

  historyCard: {backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', marginBottom: 24, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2},
  historyItem: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16},
  historyLeft: {flexDirection: 'row', alignItems: 'center', flex: 1},
  historyIcon: {width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 12},
  historyTitle: {fontSize: 14, fontWeight: '600', color: '#111827'},
  historyDate: {fontSize: 12, color: '#9CA3AF', marginTop: 2},
  historyPoints: {fontSize: 16, fontWeight: '700'},
  divider: {height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 16},

  // [추가] 리스트 최하단 더보기 바 스타일
  moreLoadRow: {paddingVertical: 14, alignItems: 'center', backgroundColor: '#F9FAFB', borderTopWidth: 1, borderColor: '#F3F4F6'},
  moreLoadText: {fontSize: 13, fontWeight: '600', color: '#4B5563'},

  localSection: {backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2},
  localHeader: {flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 6},
  localTitle: {fontSize: 16, fontWeight: '700', color: '#111827'},
  storeGroup: {marginBottom: 14},
  storeGroupHeader: {flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8},
  storeGroupTitle: {fontSize: 14, fontWeight: '600', color: '#374151'},
  storeTagsRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  storeTag: {backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16},
  storeTagText: {fontSize: 13, color: '#374151', fontWeight: '500'},
});

export default PointScreen;
