import {create} from 'zustand';

// ==============================
// 에너지 데이터 스토어
// ==============================
export const useEnergyStore = create((set, get) => ({
  // 실시간 전력
  currentPower: 2.4,
  todayAccumulated: 18.5,
  monthlyTarget: 400,
  monthlyUsed: 285,
  savingPercent: 12,

  // 시간대별 데이터
  hourlyActual: [0.8, 1.2, 2.0, 3.2, 4.2, 4.5, 4.0, 3.8, 3.5, 3.2, 3.0, 3.2, 3.5, 3.3, 3.5],
  hourlyPredicted: [0.9, 1.3, 2.1, 3.0, 3.8, 4.2, 4.3, 4.0, 3.8, 3.6, 3.4, 3.5, 3.6, 3.5, 3.4],

  // 요약 통계
  monthlySaving: 32,
  co2Reduction: 14.2,
  totalPoints: 2450,

  // 실시간 시뮬레이션 (MQTT 대체)
  simulateRealtime: () => {
    const interval = setInterval(() => {
      set(state => {
        const fluctuation = (Math.random() - 0.5) * 0.4;
        const newPower = Math.max(0.5, Math.min(8, state.currentPower + fluctuation));
        return {
          currentPower: Math.round(newPower * 10) / 10,
          todayAccumulated: Math.round((state.todayAccumulated + 0.01) * 100) / 100,
        };
      });
    }, 3000);
    return interval;
  },
}));

// ==============================
// DR 이벤트 스토어
// ==============================
export const useDRStore = create((set, get) => ({
  events: [
    {
      id: 1,
      title: '하계 피크 절감 이벤트',
      timeStart: '14:00',
      timeEnd: '17:00',
      status: 'active', // 'active' | 'upcoming' | 'ended'
      targetKwh: 2.0,
      currentKwh: 1.4,
      reward: 500,
      participants: 1284,
      isParticipating: false,
    },
    {
      id: 2,
      title: '저녁 수요 분산 이벤트',
      timeStart: '18:00',
      timeEnd: '21:00',
      status: 'upcoming',
      targetKwh: 1.5,
      currentKwh: 0,
      reward: 300,
      participants: 0,
      isParticipating: false,
      notificationSet: false,
    },
  ],

  history: [
    {id: 101, date: '6/28', title: '오후 피크 절감', success: true, kwh: 2.3, points: 500},
    {id: 102, date: '6/27', title: '저녁 수요 분산', success: true, kwh: 1.8, points: 300},
    {id: 103, date: '6/25', title: '오후 피크 절감', success: false, kwh: 0.8, points: 100},
  ],

  // DR 이벤트 참여하기
  participateEvent: (eventId) => {
    set(state => ({
      events: state.events.map(e =>
        e.id === eventId
          ? {...e, isParticipating: true, participants: e.participants + 1}
          : e,
      ),
    }));
  },

  // 알림 설정 토글
  toggleNotification: (eventId) => {
    set(state => ({
      events: state.events.map(e =>
        e.id === eventId
          ? {...e, notificationSet: !e.notificationSet}
          : e,
      ),
    }));
  },

  // 절감량 시뮬레이션 (참여 중인 이벤트)
  simulateSaving: () => {
    const interval = setInterval(() => {
      set(state => ({
        events: state.events.map(e => {
          if (e.isParticipating && e.status === 'active' && e.currentKwh < e.targetKwh) {
            return {
              ...e,
              currentKwh: Math.round((e.currentKwh + 0.05) * 100) / 100,
            };
          }
          return e;
        }),
      }));
    }, 5000);
    return interval;
  },
}));

// ==============================
// 미션 스토어
// ==============================
export const useMissionStore = create((set, get) => ({
  missions: [
    {
      id: 1,
      icon: '🌡️',
      title: '에어컨 1도 올리기',
      desc: '냉방 온도를 26°C 이상으로 설정',
      points: 50,
      progress: 3,
      total: 5,
      unit: '일',
      completed: false,
      category: '냉난방',
    },
    {
      id: 2,
      icon: '✅',
      title: '대기전력 차단',
      desc: '미사용 전자기기 플러그 뽑기',
      points: 30,
      progress: 7,
      total: 7,
      unit: '일',
      completed: true,
      category: '가전',
    },
    {
      id: 3,
      icon: '⏰',
      title: '피크시간 절전',
      desc: '14~17시 전력 사용량 20% 줄이기',
      points: 100,
      progress: 2,
      total: 5,
      unit: '회',
      completed: false,
      category: 'DR',
    },
    {
      id: 4,
      icon: '🧺',
      title: '세탁기 모아 돌리기',
      desc: '주 2회 이하로 세탁기 사용',
      points: 40,
      progress: 1,
      total: 4,
      unit: '주',
      completed: false,
      category: '가전',
    },
    {
      id: 5,
      icon: '📊',
      title: '월간 10% 절감 달성',
      desc: '전월 대비 전력 사용량 10% 감소',
      points: 200,
      progress: 0,
      total: 1,
      unit: '회',
      completed: false,
      category: '종합',
    },
  ],

  selectedCategory: '전체',

  setCategory: (category) => set({selectedCategory: category}),

  // 미션 진행도 증가
  incrementProgress: (missionId) => {
    set(state => ({
      missions: state.missions.map(m => {
        if (m.id === missionId && !m.completed) {
          const newProgress = Math.min(m.progress + 1, m.total);
          const isNowCompleted = newProgress >= m.total;
          return {
            ...m,
            progress: newProgress,
            completed: isNowCompleted,
          };
        }
        return m;
      }),
    }));

    // 미션 완료 시 포인트 적립
    const mission = get().missions.find(m => m.id === missionId);
    if (mission && mission.progress + 1 >= mission.total) {
      usePointStore.getState().addPoints({
        type: 'earn',
        title: `${mission.title} 미션`,
        points: mission.points,
      });
    }
  },

  getFilteredMissions: () => {
    const {missions, selectedCategory} = get();
    if (selectedCategory === '전체') return missions;
    return missions.filter(m => m.category === selectedCategory);
  },

  getCompletedCount: () => get().missions.filter(m => m.completed).length,
  getEarnedPoints: () =>
    get().missions.filter(m => m.completed).reduce((sum, m) => sum + m.points, 0),
}));

// ==============================
// 포인트 스토어
// ==============================
export const usePointStore = create((set, get) => ({
  totalPoints: 2450,
  usedPoints: 500,

  history: [
    {id: 1, type: 'earn', title: 'DR 이벤트 보상', date: '6/28', points: 500},
    {id: 2, type: 'earn', title: '일일 절약 미션', date: '6/28', points: 100},
    {id: 3, type: 'spend', title: '춘천 닭갈비 골목', date: '6/27', points: -300},
    {id: 4, type: 'earn', title: 'DR 이벤트 보상', date: '6/27', points: 300},
    {id: 5, type: 'spend', title: '강릉 커피거리', date: '6/26', points: -500},
    {id: 6, type: 'earn', title: '주간 절약 보너스', date: '6/25', points: 200},
  ],

  availablePoints: () => get().totalPoints - get().usedPoints,

  // 포인트 적립
  addPoints: ({title, points, type = 'earn'}) => {
    const today = new Date();
    const dateStr = `${today.getMonth() + 1}/${today.getDate()}`;
    set(state => ({
      totalPoints: state.totalPoints + points,
      history: [
        {
          id: Date.now(),
          type,
          title,
          date: dateStr,
          points: type === 'earn' ? points : -points,
        },
        ...state.history,
      ],
    }));
  },

  // 포인트 사용
  spendPoints: ({title, points}) => {
    const available = get().totalPoints - get().usedPoints;
    if (points > available) return false;

    const today = new Date();
    const dateStr = `${today.getMonth() + 1}/${today.getDate()}`;
    set(state => ({
      usedPoints: state.usedPoints + points,
      history: [
        {
          id: Date.now(),
          type: 'spend',
          title,
          date: dateStr,
          points: -points,
        },
        ...state.history,
      ],
    }));
    return true;
  },
}));

// ==============================
// 사용자 프로필 스토어
// ==============================
export const useProfileStore = create((set) => ({
  name: '김에너지',
  location: '강원도 춘천시',
  household: '3인 가구',
  ecoLevel: 3,
  ecoLevelProgress: 65, // %
  pointsToNextLevel: 320,

  stats: {
    totalSaving: 248,
    co2Reduction: 108,
    treesPlanted: 5,
  },

  monthlyReport: {
    target: 400,
    used: 285,
    prevMonthSaving: 15,
    drParticipation: 8,
    drSuccess: 6,
  },

  settings: {
    notificationDR: true,
    notificationMission: true,
    iotDevices: 2,
    language: 'ko',
    theme: 'light',
  },

  toggleSetting: (key) => {
    set(state => ({
      settings: {
        ...state.settings,
        [key]: !state.settings[key],
      },
    }));
  },
}));
