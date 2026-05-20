import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const secureStorage = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
};

const webStorage = {
  getItem: (key) =>
    Promise.resolve(typeof localStorage === 'undefined' ? null : localStorage.getItem(key)),
  setItem: (key, value) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
    return Promise.resolve();
  },
  removeItem: (key) => {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
    return Promise.resolve();
  },
};

const storage = Platform.OS === 'web' ? webStorage : secureStorage;

const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      _hasHydrated: false,

      setAuth: (token, user) => set({ token, user }),
      clearAuth: () => set({ token: null, user: null }),
      setHydrated: () => set({ _hasHydrated: true }),
    }),
    {
      name: 'nb-auth',
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);

export default useAuthStore;
