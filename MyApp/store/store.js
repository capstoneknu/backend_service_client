import {create} from 'zustand';
import {energyAPI, drAPI, missionAPI, pointAPI, profileAPI} from '../api/apiClient';

const CACHE_DURATION_MS = 60 * 1000;

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
  lastFetched: 0,
  hasRealtimeData: false,

  fetchDashboard: async (force = false) => {
    const {lastFetched} = get();
    if (!force && Date.now() - lastFetched < CACHE_DURATION_MS) {
      return;
    }

    set({isLoading: true});
    try {
      const response = await energyAPI.getDashboard();
      if (response.success) {
        const d = response.data;
        const {hasRealtimeData, currentPower} = get();

        set({
          currentPower: hasRealtimeData ? currentPower : d.currentPower,
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
          lastFetched: Date.now(),
        });
      }
    } catch (err) {
      console.log('Dashboard fetch error:', err.message);
      set({isLoading: false});
    }
  },

  markRealtimeStarted: () => set({hasRealtimeData: true}),
}));

// ==============================
// DR 이벤트 스토어
// ==============================
export const useDRStore = create((set, get) => ({
  events: [],
  history: [],
  isLoading: false,
  lastFetched: 0,
  lastHistoryFetched: 0,

  fetchEvents: async (force = false) => {
    const {lastFetched} = get();
    if (!force && Date.now() - lastFetched < CACHE_DURATION_MS) return;

    set({isLoading: true});
    try {
      const response = await drAPI.getEvents();
      if (response.success) {
        set({events: response.data, isLoading: false, lastFetched: Date.now()});
      }
    } catch (err) {
      console.log('DR events fetch error:', err.message);
      set({isLoading: false});
    }
  },

  fetchHistory: async (force = false) => {
    const {lastHistoryFetched} = get();
    if (!force && Date.now() - lastHistoryFetched < CACHE_DURATION_MS) return;

    try {
      const response = await drAPI.getHistory();
      if (response.success) {
        set({history: response.data, lastHistoryFetched: Date.now()});
      }
    } catch (err) {
      console.log('DR history fetch error:', err.message);
    }
  },

  participateEvent: async (eventId) => {
    try {
      const response = await drAPI.participate(eventId);
      if (response.success) {
        await get().fetchEvents(true);
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
      await get().fetchEvents(true);
    } catch (err) {
      console.log('Notification toggle error:', err.message);
    }
  },
}));

// ==============================
// 미션 스토어
// ==============================
export const useMissionStore = create((set, get) => ({
  missions: [],
  selectedCategory: '전체',
  isLoading: false,
  lastFetched: 0,
  lastCategory: null,

  setCategory: (category) => {
    set({selectedCategory: category});
    get().fetchMissions(category, true);
  },

  fetchMissions: async (category, force = false) => {
    const cat = category || get().selectedCategory;
    const {lastFetched, lastCategory} = get();

    if (!force && cat === lastCategory && Date.now() - lastFetched < CACHE_DURATION_MS) {
      return;
    }

    set({isLoading: true});
    try {
      const response = await missionAPI.getMissions(cat);
      if (response.success) {
        set({
          missions: response.data,
          isLoading: false,
          lastFetched: Date.now(),
          lastCategory: cat,
        });
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
        await get().fetchMissions(get().selectedCategory, true);

        // [추가] 미션 성공으로 포인트가 올랐으므로, 포인트와 프로필 스토어 동기화
        usePointStore.getState().fetchPoints(true);
        useProfileStore.getState().fetchProfile(true);

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
  lastFetched: 0,

  fetchPoints: async (force = false) => {
    const {lastFetched} = get();
    if (!force && Date.now() - lastFetched < CACHE_DURATION_MS) return;

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
          lastFetched: Date.now(),
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
          lastFetched: Date.now(),
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
// 사용자 프로필 스토어 (⭐ API 연동)
// ==============================
export const useProfileStore = create((set, get) => ({
  // 사용자 정보
  name: '김에너지',
  location: '강원도 춘천시',
  household: '3인 가구',

  // 에코 레벨
  ecoLevel: 1,
  ecoLevelProgress: 0,
  pointsToNextLevel: 1000,

  // 통계
  stats: {
    totalSaving: 0,
    co2Reduction: 0,
    treesPlanted: 0,
  },

  // 월간 리포트
  monthlyReport: {
    target: 400,
    used: 0,
    prevMonthSaving: 0,
    drParticipation: 0,
    drSuccess: 0,
  },

  // 설정 (로컬 상태 유지)
  settings: {
    notificationDR: true,
    notificationMission: true,
    iotDevices: 2,
    language: 'ko',
    theme: 'light',
  },

  isLoading: false,
  lastFetched: 0,

  // ⭐ API에서 프로필 정보 가져오기
  fetchProfile: async (force = false) => {
    const {lastFetched} = get();
    if (!force && Date.now() - lastFetched < CACHE_DURATION_MS) return;

    set({isLoading: true});
    try {
      const response = await profileAPI.getProfile();
      if (response.success) {
        const d = response.data;
        set({
          name: d.name,
          location: d.location,
          household: d.household,
          ecoLevel: d.ecoLevel,
          ecoLevelProgress: d.ecoLevelProgress,
          pointsToNextLevel: d.pointsToNextLevel,
          stats: d.stats,
          monthlyReport: d.monthlyReport,
          isLoading: false,
          lastFetched: Date.now(),
        });
      }
    } catch (err) {
      console.log('Profile fetch error:', err.message);
      set({isLoading: false});
    }
  },

  toggleSetting: (key) => {
    set(state => ({settings: {...state.settings, [key]: !state.settings[key]}}));
  },
}));
