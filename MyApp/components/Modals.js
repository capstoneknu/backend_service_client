import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
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
// QR코드 결제 모달
// ==============================
export const QRPaymentModal = ({visible, availablePoints, onClose}) => (
  <Modal visible={visible} transparent animationType="slide">
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback>
          <View style={styles.qrModalBox}>
            <View style={styles.qrHandle} />
            <Text style={styles.qrTitle}>QR코드 결제</Text>
            <Text style={styles.qrSubtitle}>
              가맹점에서 QR코드를 스캔하세요
            </Text>
            <View style={styles.qrCodeArea}>
              <View style={styles.qrPlaceholder}>
                <Text style={{fontSize: 80}}>📱</Text>
                <Text style={styles.qrPlaceholderText}>QR Code</Text>
              </View>
            </View>
            <Text style={styles.qrAvailable}>
              사용 가능: <Text style={styles.qrPoints}>{availablePoints}P</Text>
            </Text>
            <TouchableOpacity style={styles.qrCloseBtn} onPress={onClose}>
              <Text style={styles.qrCloseBtnText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  </Modal>
);

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
});