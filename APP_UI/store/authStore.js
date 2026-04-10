import {create} from 'zustand';

// ==============================
// 인증 스토어
// ==============================
export const useAuthStore = create((set, get) => ({
  // 인증 상태
  isLoggedIn: false,
  isLoading: false,
  user: null,
  token: null,
  error: null,

  // ---- 목업 사용자 DB (나중에 Spring Boot API로 교체) ----
  _mockUsers: [
    {
      id: 1,
      email: 'kim@energy.com',
      password: '1234',
      name: '김에너지',
      location: '강원도 춘천시',
      household: '3인 가구',
    },
  ],

  // ---- 로그인 ----
  login: async (email, password) => {
    set({isLoading: true, error: null});

    // API 호출 시뮬레이션 (1초 딜레이)
    await new Promise(resolve => setTimeout(resolve, 1000));

    const {_mockUsers} = get();
    const found = _mockUsers.find(
      u => u.email === email && u.password === password,
    );

    if (found) {
      set({
        isLoggedIn: true,
        isLoading: false,
        user: {
          id: found.id,
          email: found.email,
          name: found.name,
          location: found.location,
          household: found.household,
        },
        token: 'mock-jwt-token-' + Date.now(),
        error: null,
      });
      return {success: true};
    } else {
      set({
        isLoading: false,
        error: '이메일 또는 비밀번호가 올바르지 않습니다.',
      });
      return {success: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.'};
    }

    /*
    // ---- Spring Boot API 연동 시 아래 코드로 교체 ----
    try {
      const response = await fetch('http://YOUR_API_URL/api/auth/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email, password}),
      });
      const data = await response.json();

      if (response.ok) {
        set({
          isLoggedIn: true,
          isLoading: false,
          user: data.user,
          token: data.token,
          error: null,
        });
        // AsyncStorage에 토큰 저장
        // await AsyncStorage.setItem('token', data.token);
        return {success: true};
      } else {
        set({isLoading: false, error: data.message});
        return {success: false, error: data.message};
      }
    } catch (err) {
      set({isLoading: false, error: '서버 연결에 실패했습니다.'});
      return {success: false, error: '서버 연결에 실패했습니다.'};
    }
    */
  },

  // ---- 회원가입 ----
  signUp: async ({email, password, name, location, household}) => {
    set({isLoading: true, error: null});

    await new Promise(resolve => setTimeout(resolve, 1000));

    const {_mockUsers} = get();

    // 이메일 중복 체크
    if (_mockUsers.find(u => u.email === email)) {
      set({isLoading: false, error: '이미 가입된 이메일입니다.'});
      return {success: false, error: '이미 가입된 이메일입니다.'};
    }

    // 새 사용자 추가
    const newUser = {
      id: Date.now(),
      email,
      password,
      name,
      location,
      household,
    };

    set(state => ({
      _mockUsers: [...state._mockUsers, newUser],
      isLoading: false,
      error: null,
    }));

    return {success: true};

    /*
    // ---- Spring Boot API 연동 시 아래 코드로 교체 ----
    try {
      const response = await fetch('http://YOUR_API_URL/api/auth/signup', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email, password, name, location, household}),
      });
      const data = await response.json();

      if (response.ok) {
        set({isLoading: false, error: null});
        return {success: true};
      } else {
        set({isLoading: false, error: data.message});
        return {success: false, error: data.message};
      }
    } catch (err) {
      set({isLoading: false, error: '서버 연결에 실패했습니다.'});
      return {success: false, error: '서버 연결에 실패했습니다.'};
    }
    */
  },

  // ---- 로그아웃 ----
  logout: () => {
    set({
      isLoggedIn: false,
      user: null,
      token: null,
      error: null,
    });
    // AsyncStorage.removeItem('token');
  },

  // ---- 에러 초기화 ----
  clearError: () => set({error: null}),
}));
