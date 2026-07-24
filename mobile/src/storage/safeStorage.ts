import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { StateStorage } from 'zustand/middleware';

function canUseWebStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export const safeStorage: StateStorage = {
  getItem: async (name) => {
    try {
      if (Platform.OS === 'web') {
        if (!canUseWebStorage()) return null;
        return window.localStorage.getItem(name);
      }
      return await AsyncStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: async (name, value) => {
    try {
      if (Platform.OS === 'web') {
        if (!canUseWebStorage()) return;
        window.localStorage.setItem(name, value);
        return;
      }
      await AsyncStorage.setItem(name, value);
    } catch {
      // storage blocked or unavailable
    }
  },
  removeItem: async (name) => {
    try {
      if (Platform.OS === 'web') {
        if (!canUseWebStorage()) return;
        window.localStorage.removeItem(name);
        return;
      }
      await AsyncStorage.removeItem(name);
    } catch {
      // ignore
    }
  },
};
