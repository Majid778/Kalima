import { Platform } from 'react-native';
import { StateStorage } from 'zustand/middleware';

function createStorage(): StateStorage {
  if (Platform.OS === 'web') {
    return {
      setItem: (name: string, value: string) => { localStorage.setItem(name, value); },
      getItem: (name: string) => { return localStorage.getItem(name) ?? null; },
      removeItem: (name: string) => { localStorage.removeItem(name); },
    };
  }
  const { MMKV } = require('react-native-mmkv');
  const mmkv = new MMKV();
  return {
    setItem: (name: string, value: string) => { mmkv.set(name, value); },
    getItem: (name: string) => { return mmkv.getString(name) ?? null; },
    removeItem: (name: string) => { mmkv.delete(name); },
  };
}

export const mmkvStorage: StateStorage = createStorage();
