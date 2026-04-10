import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

const pointHistory = [
  {type: 'earn', title: 'DR 이벤트 보상', date: '6/28', points: 500},
  {type: 'earn', title: '일일 절약 미션', date: '6/28', points: 100},
  {type: 'spend', title: '춘천 닭갈비 골목', date: '6/27', points: -300},
  {type: 'earn', title: 'DR 이벤트 보상', date: '6/27', points: 300},
  {type: 'spend', title: '강릉 커피거리', date: '6/26', points: -500},
  {type: 'earn', title: '주간 절약 보너스', date: '6/25', points: 200},
];

const localStores = [
  {
    category: '카페',
    icon: '☕',
    stores: ['강릉 커피거리', '춘천 감성카페', '속초 바다카페'],
  },
  {
    category: '맛집',
    icon: '🍽️',
    stores: ['춘천 닭갈비 골목', '속초 중앙시장', '강릉 초당두부'],
  },
  {
    category: '체험',
    icon: '🎯',
    stores: ['남이섬', '정선 레일바이크', '평창 목장'],
  },
];

const PointScreen = () => {
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <Text style={styles.pageTitle}>포인트 & 리워드</Text>
        <Text style={styles.pageSubtitle}>
          에너지 절약으로 모은 포인트를 강원도에서 사용하세요
        </Text>

        {/* 포인트 카드 */}
        <View style={styles.pointCard}>
          <Text style={styles.pointCardLabel}>총 적립 포인트</Text>
          <Text style={styles.pointCardValue}>2,450 P</Text>
          <View style={styles.pointCardRow}>
            <View style={styles.availableBadge}>
              <Text style={styles.availableBadgeText}>사용 가능 1,950P</Text>
            </View>
            <Text style={styles.usedText}>사용 완료 500P</Text>
          </View>
          <TouchableOpacity style={styles.qrButton}>
            <Text style={styles.qrButtonText}>📱 QR코드 결제</Text>
          </TouchableOpacity>
        </View>

        {/* 포인트 내역 */}
        <Text style={styles.sectionTitle}>포인트 내역</Text>
        <View style={styles.historyCard}>
          {pointHistory.map((item, index) => (
            <View key={index}>
              <View style={styles.historyItem}>
                <View style={styles.historyLeft}>
                  <View
                    style={[
                      styles.historyIcon,
                      {
                        backgroundColor:
                          item.type === 'earn' ? '#ECFDF5' : '#FEF2F2',
                      },
                    ]}>
                    <Text
                      style={{
                        fontSize: 14,
                        color: item.type === 'earn' ? '#22C55E' : '#EF4444',
                      }}>
                      {item.type === 'earn' ? '↙' : '↗'}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.historyTitle}>{item.title}</Text>
                    <Text style={styles.historyDate}>{item.date}</Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.historyPoints,
                    {color: item.points > 0 ? '#22C55E' : '#EF4444'},
                  ]}>
                  {item.points > 0 ? '+' : ''}
                  {item.points}P
                </Text>
              </View>
              {index < pointHistory.length - 1 && (
                <View style={styles.divider} />
              )}
            </View>
          ))}
        </View>

        {/* 강원도 지역 사용처 */}
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
                  <TouchableOpacity key={sIdx} style={styles.storeTag}>
                    <Text style={styles.storeTagText}>{store}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
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
  // Point card
  pointCard: {
    backgroundColor: '#22C55E',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  pointCardLabel: {
    fontSize: 14,
    color: '#DCFCE7',
    fontWeight: '500',
  },
  pointCardValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
    marginBottom: 12,
  },
  pointCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  availableBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  availableBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  usedText: {
    color: '#DCFCE7',
    fontSize: 13,
  },
  qrButton: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  qrButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  // Section
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  // History
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
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
  historyDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  historyPoints: {
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
  },
  // Local stores
  localSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  localHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 6,
  },
  localTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  storeGroup: {
    marginBottom: 14,
  },
  storeGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  storeGroupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  storeTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  storeTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  storeTagText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
});

export default PointScreen;
