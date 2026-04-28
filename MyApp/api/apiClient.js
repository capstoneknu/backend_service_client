// ==============================
// API 설정
// ==============================

// 에뮬레이터에서 localhost 접근 시: 10.0.2.2
// 실제 기기에서 접근 시: PC의 실제 IP 주소로 변경
// 예: const BASE_URL = 'http://192.168.0.10:8080';
const BASE_URL = 'http://10.0.2.2:8080';

// JWT 토큰 저장 (메모리)
// 나중에 AsyncStorage로 교체 가능
let authToken = null;

export const setToken = (token) => {
  authToken = token;
};

export const getToken = () => authToken;

export const clearToken = () => {
  authToken = null;
};

// ==============================
// 공통 fetch 래퍼
// ==============================
const request = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // 토큰이 있으면 Authorization 헤더 추가
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '요청에 실패했습니다.');
    }

    return data;
  } catch (error) {
    // 네트워크 에러
    if (error.message === 'Network request failed') {
      throw new Error('서버에 연결할 수 없습니다.\n서버가 실행 중인지 확인해주세요.');
    }
    throw error;
  }
};

// ==============================
// Auth API
// ==============================
export const authAPI = {
  login: (email, password) =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({email, password}),
    }),

  signUp: ({email, password, name, location, household}) =>
    request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({email, password, name, location, household}),
    }),

  getMe: () => request('/api/auth/me'),
};

// ==============================
// Energy API
// ==============================
export const energyAPI = {
  getDashboard: () => request('/api/energy/dashboard'),
};

// ==============================
// DR Event API
// ==============================
export const drAPI = {
  getEvents: () => request('/api/dr/events'),

  participate: (eventId) =>
    request(`/api/dr/events/${eventId}/participate`, {
      method: 'POST',
    }),

  toggleNotification: (eventId) =>
    request(`/api/dr/events/${eventId}/notification`, {
      method: 'POST',
    }),

  getHistory: () => request('/api/dr/history'),
};

// ==============================
// Mission API
// ==============================
export const missionAPI = {
  getMissions: (category = '전체') =>
    request(`/api/missions?category=${encodeURIComponent(category)}`),

  incrementProgress: (missionId) =>
    request(`/api/missions/${missionId}/progress`, {
      method: 'POST',
    }),
};

// ==============================
// Point API
// ==============================
export const pointAPI = {
  getSummary: () => request('/api/points'),

  spend: (title, points) =>
    request('/api/points/spend', {
      method: 'POST',
      body: JSON.stringify({title, points}),
    }),
};
