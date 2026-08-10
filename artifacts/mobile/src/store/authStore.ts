import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthUser } from '@/src/types';
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  apiCall,
  AuthSessionError,
} from '@/src/api/client';

const USER_CACHE_KEY = 'gtf_user_cache';

interface AuthState {
  user: AuthUser | null;
  isInitialized: boolean;
  initializeAuth: () => Promise<void>;
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (partial: Partial<AuthUser>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isInitialized: false,

  initializeAuth: async () => {
    try {
      const [accessToken, refreshToken] = await Promise.all([
        getAccessToken(),
        getRefreshToken(),
      ]);

      if (!accessToken && !refreshToken) {
        set({ isInitialized: true });
        return;
      }

      try {
        const user = await apiCall<AuthUser>('GET', '/auth/me');
        await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
        set({ user, isInitialized: true });
      } catch (err) {
        if (err instanceof AuthSessionError) {
          await clearTokens();
          await AsyncStorage.removeItem(USER_CACHE_KEY);
          set({ user: null, isInitialized: true });
        } else {
          // Network error — restore from cache
          const cached = await AsyncStorage.getItem(USER_CACHE_KEY);
          if (cached) {
            try { set({ user: JSON.parse(cached), isInitialized: true }); }
            catch { set({ isInitialized: true }); }
          } else {
            set({ isInitialized: true });
          }
        }
      }
    } catch {
      set({ isInitialized: true });
    }
  },

  setAuth: async (user, accessToken, refreshToken) => {
    await setTokens(accessToken, refreshToken);
    await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
    set({ user });
  },

  clearAuth: async () => {
    await clearTokens();
    await AsyncStorage.removeItem(USER_CACHE_KEY);
    set({ user: null });
  },

  refreshUser: async () => {
    try {
      const user = await apiCall<AuthUser>('GET', '/auth/me');
      await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
      set({ user });
    } catch {}
  },

  updateUser: (partial) => {
    const current = get().user;
    if (!current) return;
    const updated = { ...current, ...partial };
    set({ user: updated });
    AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(updated)).catch(() => {});
  },
}));
