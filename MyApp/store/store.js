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
    // UI 깜빡임 방지: 최초 로딩(데이터가 아예 없을 때)에만 스피너를 띄움
    if (get().hourlyActual.length === 0 && get().currentPower === 0) {
      set({isLoading: true});
    }
    
    try {
      const response = await energyAPI.getDashboard();
      if (response.success) {
        const d = response.data;
        set({
          // currentPower와 todayAccumulated는 WS가 더 빠르지만, 
          // 초기 로드 정합성을 위해 덮어쓰기 허용 (화면 튕김 없음)
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

  simulateRealtime: () => {
    // 최초 화면 진입 시 1회 로드
    get().fetchDashboard();

    // 2초마다 백그라운드에서 무거운 통계 및 그래프 데이터를 갱신
    // 파이썬 시뮬레이터의 초고속(5000 TPS) 시간선을 부드러운 타임랩스처럼 캡처하여 보여줌
    const interval = setInterval(() => {
      get().fetchDashboard();
    }, 2000);
    
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

  participateEvent: async (eventId) => {
    try {
      const response = await drAPI.participate(eventId);
      if (response.success) {
        await get().fetchEvents();
        return {success: true};
      }
      return {success: false, error: response.message};
    } catch (err) {
      return {success: false, error: err.message};
    }
  },

  toggleNotification: async (eventId) => {
    try {
      await drAPI.toggleNotification(eventId);
      await get().fetchEvents();
    } catch (err) {
      console.log('Notification toggle error:', err.message);
    }
  },

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

  incrementProgress: async (missionId) => {
    try {
      const response = await missionAPI.incrementProgress(missionId);
      if (response.success) {
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
  getEarnedPoints: () => get().missions.filter(m => m.completed).reduce((sum, m) => sum + m.points, 0),
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