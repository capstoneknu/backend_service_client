import {create} from 'zustand';
import {authAPI, setToken, clearToken} from '../api/apiClient';

export const useAuthStore = create((set, get) => ({
  isLoggedIn: false,
  isLoading: false,
  user: null,
  token: null,
  error: null,

  // ---- 로그인 ----
  login: async (email, password) => {
    set({isLoading: true, error: null});

    try {
      const response = await authAPI.login(email, password);

      if (response.success) {
        const {token, user} = response.data;

        // API 클라이언트에 토큰 설정
        setToken(token);

        set({
          isLoggedIn: true,
          isLoading: false,
          user,
          token,
          error: null,
        });
        return {success: true};
      } else {
        set({isLoading: false, error: response.message});
        return {success: false, error: response.message};
      }
    } catch (err) {
      const errorMsg = err.message || '로그인에 실패했습니다.';
      set({isLoading: false, error: errorMsg});
      return {success: false, error: errorMsg};
    }
  },

  // ---- 회원가입 ----
  signUp: async ({email, password, name, location, household}) => {
    set({isLoading: true, error: null});

    try {
      const response = await authAPI.signUp({
        email, password, name, location, household,
      });

      if (response.success) {
        set({isLoading: false, error: null});
        return {success: true};
      } else {
        set({isLoading: false, error: response.message});
        return {success: false, error: response.message};
      }
    } catch (err) {
      const errorMsg = err.message || '회원가입에 실패했습니다.';
      set({isLoading: false, error: errorMsg});
      return {success: false, error: errorMsg};
    }
  },

  // ---- 로그아웃 ----
  logout: () => {
    clearToken();
    set({
      isLoggedIn: false,
      user: null,
      token: null,
      error: null,
    });
  },

  // ---- 에러 초기화 ----
  clearError: () => set({error: null}),
}));
