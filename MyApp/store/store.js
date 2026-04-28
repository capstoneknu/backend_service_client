import {create} from 'zustand';
import {energyAPI, drAPI, missionAPI, pointAPI} from '../api/apiClient';

// ==============================
// 에너지 데이터 스토어
// ==============================
export const useEnergyStore = create((set, get) => ({
  currentPower: 0,
  todayAccumulated: 0,
  monthlyTarget: 400,
  monthlyUsed: 0,
  savingPercent: 0,
  hourlyActual: [],
  hourlyPredicted: [],
  monthlySaving: 0,
  co2Reduction: 0,
  totalPoints: 0,
  isLoading: false,

  // API에서 대시보드 데이터 가져오기
  fetchDashboard: async () => {
    set({isLoading: true});
    try {
      const response = await energyAPI.getDashboard();
      if (response.success) {
        const d = response.data;
        set({
          currentPower: d.currentPower,
          todayAccumulated: d.todayAccumulated,
          monthlyTarget: d.monthlyTarget,
          monthlyUsed: d.monthlyUsed,
          savingPercent: d.savingPercent,
          hourlyActual: d.hourlyActual,
          hourlyPredicted: d.hourlyPredicted,
          monthlySaving: d.monthlySaving,
          co2Reduction: d.co2Reduction,
          totalPoints: d.totalPoints,
          isLoading: false,
        });
      }
    } catch (err) {
      console.log('Dashboard fetch error:', err.message);
      set({isLoading: false});
    }
  },

  // 실시간 시뮬레이션 (주기적으로 API 호출)
  simulateRealtime: () => {
    // 최초 로드
    get().fetchDashboard();

    // 10초마다 갱신 (실제로는 WebSocket/MQTT로 교체)
    const interval = setInterval(() => {
      get().fetchDashboard();
    }, 10000);
    return interval;
  },
}));

// ==============================
// DR 이벤트 스토어
// ==============================
export const useDRStore = create((set, get) => ({
  events: [],
  history: [],
  isLoading: false,

  // 이벤트 목록 가져오기
  fetchEvents: async () => {
    set({isLoading: true});
    try {
      const response = await drAPI.getEvents();
      if (response.success) {
        set({events: response.data, isLoading: false});
      }
    } catch (err) {
      console.log('DR events fetch error:', err.message);
      set({isLoading: false});
    }
  },

  // 참여 이력 가져오기
  fetchHistory: async () => {
    try {
      const response = await drAPI.getHistory();
      if (response.success) {
        set({history: response.data});
      }
    } catch (err) {
      console.log('DR history fetch error:', err.message);
    }
  },

  // 이벤트 참여
  participateEvent: async (eventId) => {
    try {
      const response = await drAPI.participate(eventId);
      if (response.success) {
        // 이벤트 목록 새로고침
        await get().fetchEvents();
        return {success: true};
      }
      return {success: false, error: response.message};
    } catch (err) {
      return {success: false, error: err.message};
    }
  },

  // 알림 토글
  toggleNotification: async (eventId) => {
    try {
      await drAPI.toggleNotification(eventId);
      // 이벤트 목록 새로고침
      await get().fetchEvents();
    } catch (err) {
      console.log('Notification toggle error:', err.message);
    }
  },

  // 절감량 시뮬레이션 (주기적 API 호출)
  simulateSaving: () => {
    const interval = setInterval(() => {
      get().fetchEvents();
    }, 5000);
    return interval;
  },
}));

// ==============================
// 미션 스토어
// ==============================
export const useMissionStore = create((set, get) => ({
  missions: [],
  selectedCategory: '전체',
  isLoading: false,

  setCategory: (category) => {
    set({selectedCategory: category});
    get().fetchMissions(category);
  },

  // 미션 목록 가져오기
  fetchMissions: async (category) => {
    const cat = category || get().selectedCategory;
    set({isLoading: true});
    try {
      const response = await missionAPI.getMissions(cat);
      if (response.success) {
        set({missions: response.data, isLoading: false});
      }
    } catch (err) {
      console.log('Missions fetch error:', err.message);
      set({isLoading: false});
    }
  },

  // 미션 진행도 증가
  incrementProgress: async (missionId) => {
    try {
      const response = await missionAPI.incrementProgress(missionId);
      if (response.success) {
        // 미션 목록 새로고침
        await get().fetchMissions();
        return {success: true, data: response.data, message: response.message};
      }
      return {success: false, error: response.message};
    } catch (err) {
      return {success: false, error: err.message};
    }
  },

  getFilteredMissions: () => get().missions,

  getCompletedCount: () => get().missions.filter(m => m.completed).length,

  getEarnedPoints: () =>
    get().missions.filter(m => m.completed).reduce((sum, m) => sum + m.points, 0),
}));

// ==============================
// 포인트 스토어
// ==============================
export const usePointStore = create((set, get) => ({
  totalPoints: 0,
  usedPoints: 0,
  availablePoints: 0,
  history: [],
  isLoading: false,

  // 포인트 요약 가져오기
  fetchPoints: async () => {
    set({isLoading: true});
    try {
      const response = await pointAPI.getSummary();
      if (response.success) {
        const d = response.data;
        set({
          totalPoints: d.totalPoints,
          usedPoints: d.usedPoints,
          availablePoints: d.availablePoints,
          history: d.history,
          isLoading: false,
        });
      }
    } catch (err) {
      console.log('Points fetch error:', err.message);
      set({isLoading: false});
    }
  },

  // 포인트 사용
  spendPoints: async ({title, points}) => {
    try {
      const response = await pointAPI.spend(title, points);
      if (response.success) {
        const d = response.data;
        set({
          totalPoints: d.totalPoints,
          usedPoints: d.usedPoints,
          availablePoints: d.availablePoints,
          history: d.history,
        });
        return {success: true};
      }
      return {success: false, error: response.message};
    } catch (err) {
      return {success: false, error: err.message};
    }
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
  ecoLevelProgress: 65,
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
