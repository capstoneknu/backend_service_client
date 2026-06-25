// ==============================
// API 설정
// ==============================

//[수정 전] 로컬 환경용 const BASE_URL = 'http://10.0.2.2:8085';

// [수정 후] AWS EC2 퍼블릭 IP 매핑
const BASE_URL = 'http://3.37.149.164:8085';

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

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    //[기존] const data = await response.json();
    // 변경된 부분: 빈 응답(Empty Body) 파싱 에러 방어 로직
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};


    if (!response.ok) {
      // 401/403 에러 발생 시 처리
      if (response.status === 401 || response.status === 403) {
         throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
      }
      throw new Error(data.message || `요청에 실패했습니다. (상태 코드: ${response.status})`);
    }

    return data;
  } catch (error) {
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

  // InfluxDB 시계열 추이 (시계열 분석 화면)
  getTimeseries: (deviceId = 'USER_0000', window = '1d') =>
    request(`/api/energy/timeseries?deviceId=${encodeURIComponent(deviceId)}&window=${encodeURIComponent(window)}`),
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

  // [추가] AI 동적 미션 생성 (E2E 연동)
  generateAIMission: () =>
    request('/api/missions/generate', {
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

// ==============================
// Profile API (⭐ 신규 추가)
// ==============================
export const profileAPI = {
  getProfile: () => request('/api/profile'),
};
