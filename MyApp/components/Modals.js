import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator, // ActivityIndicator 추가
  ScrollView // 추가
} from 'react-native';

// ==============================
// 확인 다이얼로그
// ==============================
export const ConfirmModal = ({visible, title, message, onConfirm, onCancel, confirmText = '확인', cancelText = '취소'}) => (
  <Modal visible={visible} transparent animationType="fade">
    <TouchableWithoutFeedback onPress={onCancel}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Text style={styles.modalMessage}>{message}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
                <Text style={styles.cancelBtnText}>{cancelText}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm}>
                <Text style={styles.confirmBtnText}>{confirmText}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  </Modal>
);

// ==============================
// 알림/성공 토스트 스타일 모달
// ==============================
export const ToastModal = ({visible, message, type = 'success', onClose}) => (
  <Modal visible={visible} transparent animationType="slide">
    <View style={styles.toastOverlay}>
      <View style={[styles.toastBox, type === 'success' ? styles.toastSuccess : styles.toastInfo]}>
        <Text style={styles.toastIcon}>
          {type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
        </Text>
        <Text style={styles.toastMessage}>{message}</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.toastClose}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

// ==============================
// QR코드 결제 모달 + [추가] Active Transaction Trigger
// ==============================
export const QRPaymentModal = ({visible, availablePoints, storeName, amount, paymentState, onPay, onClose}) => {
  const { status, message } = paymentState; // 'scanning' | 'idle' | 'loading' | 'success' | 'error'

  // 현재 결제 시각 생성 포맷터
  const now = new Date();
  const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.qrModalBox}>
          <View style={styles.qrHandle} />
          
          {/* 0. 스캔 중 상태 (Scanning) - 메인 버튼 클릭 시 연출 */}
          {status === 'scanning' && (
            <View style={{alignItems: 'center', width: '100%'}}>
              <Text style={styles.qrTitle}>QR코드 스캔 중...</Text>
              <Text style={styles.qrSubtitle}>가맹점의 QR 코드를 비춰주세요</Text>
              <View style={styles.cameraScanner}>
                <View style={styles.scanLine} />
                <Text style={{fontSize: 60}}></Text>
              </View>
              <Text style={styles.qrAvailable}>
                사용 가능: <Text style={styles.qrPoints}>{availablePoints}P</Text>
              </Text>
            </View>
          )}

          {/* 1. 결제 대기/확인 상태 (Idle) */}
          {status === 'idle' && (
            <>
              <Text style={styles.qrTitle}>결제 확인</Text>
              <Text style={styles.qrSubtitle}><Text style={{fontWeight:'700', color:'#111827'}}>{storeName}</Text>에서 결제를 진행합니다</Text>
              <TouchableOpacity style={styles.qrPlaceholder} onPress={onPay} activeOpacity={0.7}>
                <Text style={{fontSize: 50, marginBottom: 8}}>💳</Text>
                <Text style={[styles.qrPlaceholderText, {color: '#22C55E', fontSize: 18}]}>
                  {amount.toLocaleString()}P 결제하기
                </Text>
              </TouchableOpacity>
              <Text style={styles.qrAvailable}>사용 가능: <Text style={styles.qrPoints}>{availablePoints}P</Text></Text>
              <TouchableOpacity style={styles.qrCloseBtn} onPress={onClose}>
                <Text style={styles.qrCloseBtnText}>취소</Text>
              </TouchableOpacity>
            </>
          )}

          {/* 2. 결제 진행 중 상태 (Loading) */}
          {status === 'loading' && (
            <View style={{alignItems: 'center', paddingVertical: 40, width: '100%'}}>
              <ActivityIndicator size="large" color="#22C55E" style={{transform: [{scale: 1.5}], marginBottom: 24}} />
              <Text style={styles.qrTitle}>결제 진행 중...</Text>
              <Text style={styles.qrSubtitle}>서버와 통신하고 있습니다</Text>
            </View>
          )}

          {/* 3. 결제 성공 상태 (Success - 영수증 UI) */}
          {status === 'success' && (
            <View style={{width: '100%', alignItems: 'center'}}>
              <View style={{width: 64, height: 64, borderRadius: 32, backgroundColor: '#22C55E', alignItems: 'center', justifyContent: 'center', marginBottom: 16}}>
                <Text style={{fontSize: 32, color: '#FFFFFF'}}>✓</Text>
              </View>
              <Text style={styles.qrTitle}>결제 완료</Text>
              
              {/* 영수증 영역 */}
              <View style={styles.receiptBox}>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>가맹점</Text>
                  <Text style={styles.receiptValue}>{storeName}</Text>
                </View>
                <View style={[styles.receiptRow, {marginBottom: 16}]}>
                  <Text style={styles.receiptLabel}>결제금액</Text>
                  <Text style={styles.receiptValueBlue}>{amount.toLocaleString()} 원(P)</Text>
                </View>
                
                <View style={styles.receiptDivider} />
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>결제일시</Text>
                  <Text style={styles.receiptValueSmall}>{formattedDate}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>결제수단</Text>
                  <Text style={styles.receiptValueSmall}>우리집 전기저금통 포인트</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>승인번호</Text>
                  <Text style={styles.receiptValueSmall}>{Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}</Text>
                </View>
              </View> 

              <Text style={styles.receiptNotice}>
                • 확인 버튼을 누르신 후, 가맹점 포스기를 통해 결제가 최종 완료됩니다.
              </Text>

              <TouchableOpacity style={[styles.qrCloseBtn, {backgroundColor: '#22C55E', marginTop: 10}]} onPress={onClose}>
                <Text style={[styles.qrCloseBtnText, {color: '#FFFFFF'}]}>확인</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 4. 결제 실패 및 보상 환불 상태 (Error) */}
          {status === 'error' && (
            <View style={{alignItems: 'center', paddingVertical: 20, width: '100%'}}>
              <View style={{width: 64, height: 64, borderRadius: 32, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', marginBottom: 16}}>
                <Text style={{fontSize: 32}}>❌</Text>
              </View>
              <Text style={styles.qrTitle}>결제 취소 및 환불</Text>
              <Text style={[styles.qrSubtitle, {textAlign: 'center', lineHeight: 22, color: '#EF4444', marginTop: 12}]}>{message}</Text>
              <TouchableOpacity style={[styles.qrCloseBtn, {marginTop: 20}]} onPress={onClose}>
                <Text style={styles.qrCloseBtnText}>돌아가기</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

// ==============================
// 이벤트 상세 모달
// ==============================
export const EventDetailModal = ({visible, event, onClose}) => {
  if (!event) return null;
  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.detailModalBox}>
              <View style={styles.qrHandle} />
              <View style={styles.detailHeader}>
                <View style={[styles.detailIcon, {backgroundColor: event.success ? '#ECFDF5' : '#FEF2F2'}]}>
                  <Text style={{fontSize: 24}}>
                    {event.success ? '✅' : '⚠️'}
                  </Text>
                </View>
                <Text style={styles.detailTitle}>{event.date} {event.title}</Text>
              </View>

              <View style={styles.detailGrid}>
                <View style={styles.detailGridItem}>
                  <Text style={styles.detailGridLabel}>상태</Text>
                  <Text style={[styles.detailGridValue, {color: event.success ? '#16A34A' : '#EF4444'}]}>
                    {event.success ? '성공' : '미달'}
                  </Text>
                </View>
                <View style={styles.detailGridItem}>
                  <Text style={styles.detailGridLabel}>절감량</Text>
                  <Text style={styles.detailGridValue}>{event.kwh} kWh</Text>
                </View>
                <View style={styles.detailGridItem}>
                  <Text style={styles.detailGridLabel}>획득 포인트</Text>
                  <Text style={[styles.detailGridValue, {color: '#22C55E'}]}>+{event.points}P</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.detailCloseBtn} onPress={onClose}>
                <Text style={styles.detailCloseBtnText}>닫기</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// ==============================
// [추가] 전체 포인트 내역 조회 전용 모달
// ==============================
export const PointHistoryModal = ({visible, history, onClose}) => (
  <Modal visible={visible} transparent animationType="slide">
    <View style={styles.historyModalOverlay}>
      <View style={styles.historyModalBox}>
        <View style={styles.qrHandle} />
        
        <View style={styles.historyModalHeader}>
          <Text style={styles.historyModalTitle}>전체 포인트 내역</Text>
          <Text style={styles.historyModalCount}>총 {history.length}건</Text>
        </View>

        <ScrollView style={{width: '100%'}} showsVerticalScrollIndicator={false}>
          {history.length === 0 ? (
            <View style={{paddingVertical: 60, alignItems: 'center'}}>
              <Text style={{color: '#9CA3AF'}}>내역이 존재하지 않습니다.</Text>
            </View>
          ) : (
            history.map((item, index) => (
              <View key={item.id || index}>
                <View style={styles.innerHistoryItem}>
                  <View style={styles.historyLeft}>
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
                </View>
                {index < history.length - 1 && <View style={styles.innerDivider} />}
              </View>
            ))
          )}
        </ScrollView>

        <TouchableOpacity style={styles.historyCloseBtn} onPress={onClose}>
          <Text style={styles.historyCloseBtnText}>닫기</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  // Overlay
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Confirm Modal
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '82%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: '#22C55E',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Toast
  toastOverlay: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 60,
    alignItems: 'center',
  },
  toastBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  toastSuccess: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  toastInfo: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  toastIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  toastMessage: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  toastClose: {
    fontSize: 16,
    color: '#9CA3AF',
    paddingLeft: 10,
  },
  // QR Modal
  qrModalBox: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    width: '100%',
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
  },
  qrHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    marginBottom: 16,
  },
  qrTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  qrSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  qrCodeArea: {
    marginBottom: 20,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrPlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 8,
  },
  qrAvailable: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 20,
  },
  qrPoints: {
    fontWeight: '700',
    color: '#22C55E',
    fontSize: 18,
  },
  qrCloseBtn: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  qrCloseBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  // Detail Modal
  detailModalBox: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    width: '100%',
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
  },
  detailHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  detailIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  detailGrid: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    marginBottom: 24,
  },
  detailGridItem: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  detailGridLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  detailGridValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  detailCloseBtn: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  detailCloseBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },

  // --- 영수증 CSS ---
  receiptBox: {
    width: '100%',
    backgroundColor: '#F9FAFB', // 영수증 배경색
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  receiptRow: {
    flexDirection: 'row',             // 가로 배치
    justifyContent: 'space-between',  // 양끝 정렬 (항목은 왼쪽, 값은 오른쪽)
    alignItems: 'center',
    marginBottom: 12,
  },
  receiptLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  receiptValue: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
  },
  receiptValueBlue: {
    fontSize: 18,
    color: '#0ea5e9',
    fontWeight: '700',
  },
  receiptValueSmall: {
    fontSize: 13,
    color: '#4B5563',
  },
  receiptDivider: {
    height: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed', // 점선 구분선
    width: '100%',
    marginBottom: 16,
  },
  receiptNotice: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 10,
    paddingHorizontal: 10,
    lineHeight: 18,
  },

  // --- 스캐너 애니메이션용 CSS ---
  cameraScanner: {
    width: 200, height: 200, borderWidth: 3, borderColor: '#22C55E', borderRadius: 16,
    backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', marginBottom: 20, borderStyle: 'dashed'
  },
  scanLine: {
    width: '100%', height: 3, backgroundColor: '#16A34A', position: 'absolute', top: '50%',
    shadowColor: '#16A34A', shadowOffset: {width: 0, height: 0}, shadowOpacity: 0.8, shadowRadius: 4, elevation: 5
  },

  //추가
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, width: '82%', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8 },
  modalMessage: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  modalButtons: { flexDirection: 'row', gap: 10, width: '100%' },
  cancelBtn: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  confirmBtn: { flex: 1, backgroundColor: '#22C55E', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  confirmBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  toastOverlay: { flex: 1, justifyContent: 'flex-start', paddingTop: 60, alignItems: 'center' },
  toastBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, width: '90%', shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5 },
  toastSuccess: { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0' },
  toastInfo: { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' },
  toastIcon: { fontSize: 18, marginRight: 10 },
  toastMessage: { flex: 1, fontSize: 14, fontWeight: '600', color: '#111827' },
  toastClose: { fontSize: 16, color: '#9CA3AF', paddingLeft: 10 },
  qrModalBox: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, width: '100%', position: 'absolute', bottom: 0, alignItems: 'center' },
  qrHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', marginBottom: 16 },
  qrTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 4 },
  qrSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 24 },
  qrCodeArea: { marginBottom: 20 },
  qrPlaceholder: { width: 200, height: 200, backgroundColor: '#F9FAFB', borderRadius: 16, borderWidth: 2, borderColor: '#E5E7EB', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  qrPlaceholderText: { fontSize: 16, fontWeight: '600', color: '#9CA3AF', marginTop: 8 },
  qrAvailable: { fontSize: 16, color: '#374151', marginBottom: 20 },
  qrPoints: { fontWeight: '700', color: '#22C55E', fontSize: 18 },
  qrCloseBtn: { backgroundColor: '#F3F4F6', borderRadius: 12, paddingVertical: 14, width: '100%', alignItems: 'center', marginBottom: 20 },
  qrCloseBtnText: { fontSize: 16, fontWeight: '600', color: '#374151' },
  detailModalBox: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, width: '100%', position: 'absolute', bottom: 0, alignItems: 'center' },
  detailHeader: { alignItems: 'center', marginBottom: 20 },
  detailIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  detailTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  detailGrid: { flexDirection: 'row', width: '100%', gap: 10, marginBottom: 24 },
  detailGridItem: { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14, alignItems: 'center' },
  detailGridLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  detailGridValue: { fontSize: 16, fontWeight: '700', color: '#111827' },
  detailCloseBtn: { backgroundColor: '#F3F4F6', borderRadius: 12, paddingVertical: 14, width: '100%', alignItems: 'center', marginBottom: 20 },
  detailCloseBtnText: { fontSize: 16, fontWeight: '600', color: '#374151' },
  receiptBox: { width: '100%', backgroundColor: '#F9FAFB', borderRadius: 12, padding: 20, marginTop: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  receiptLabel: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  receiptValue: { fontSize: 15, color: '#111827', fontWeight: '600' },
  receiptValueBlue: { fontSize: 18, color: '#0ea5e9', fontWeight: '700' },
  receiptValueSmall: { fontSize: 13, color: '#4B5563' },
  receiptDivider: { height: 1, borderWidth: 1, borderColor: '#D1D5DB', borderStyle: 'dashed', width: '100%', marginBottom: 16 },
  receiptNotice: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginBottom: 10, paddingHorizontal: 10, lineHeight: 18 },
  cameraScanner: { width: 200, height: 200, borderWidth: 3, borderColor: '#22C55E', borderRadius: 16, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 20, borderStyle: 'dashed' },
  scanLine: { width: '100%', height: 3, backgroundColor: '#16A34A', position: 'absolute', top: '50%', shadowColor: '#16A34A', shadowOffset: {width: 0, height: 0}, shadowOpacity: 0.8, shadowRadius: 4, elevation: 5 },
  
  // [신규 스타일 컴포넌트 분리 적재]
  historyModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  historyModalBox: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, width: '100%', height: '80%', alignItems: 'center' },
  historyModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 20, paddingBottom: 10, borderBottomWidth: 1, borderColor: '#F3F4F6' },
  historyModalTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  historyModalCount: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  innerHistoryItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  innerDivider: { height: 1, backgroundColor: '#F3F4F6' },
  historyLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  historyIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  historyTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  historyDate: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  historyPoints: { fontSize: 16, fontWeight: '700' },
  historyCloseBtn: { backgroundColor: '#111827', borderRadius: 12, paddingVertical: 14, width: '100%', alignItems: 'center', marginTop: 16, marginBottom: 10 },
  historyCloseBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' }
});

// ==============================
// [추가] DR 이벤트 참여 이력 전체 조회 모달
// ==============================
export const DREventHistoryModal = ({visible, history, onEventPress, onClose}) => (
  <Modal visible={visible} transparent animationType="slide">
    <View style={styles.historyModalOverlay}>
      <View style={styles.historyModalBox}>
        <View style={styles.qrHandle} />
        
        <View style={styles.historyModalHeader}>
          <Text style={styles.historyModalTitle}>지난 이벤트 참여 이력</Text>
          <Text style={styles.historyModalCount}>총 {history.length}건</Text>
        </View>

        <ScrollView style={{width: '100%'}} showsVerticalScrollIndicator={false}>
          {history.length === 0 ? (
            <View style={{paddingVertical: 60, alignItems: 'center'}}>
              <Text style={{color: '#9CA3AF'}}>참여 이력이 없습니다.</Text>
            </View>
          ) : (
            history.map((item, index) => (
              <View key={item.id || index}>
                <TouchableOpacity style={styles.innerHistoryItem} activeOpacity={0.6} onPress={() => onEventPress(item)}>
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
                  <Text style={{fontSize: 20, color: '#9CA3AF'}}>›</Text>
                </TouchableOpacity>
                {index < history.length - 1 && <View style={styles.innerDivider} />}
              </View>
            ))
          )}
        </ScrollView>

        <TouchableOpacity style={styles.historyCloseBtn} onPress={onClose}>
          <Text style={styles.historyCloseBtnText}>닫기</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);