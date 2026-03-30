import { MMKV } from 'react-native-mmkv';
import { StateStorage } from 'zustand/middleware';

const mmkv = new MMKV();

export const mmkvStorage: StateStorage = {
  setItem: (name: string, value: string) => { mmkv.set(name, value); },
  getItem: (name: string) => { return mmkv.getString(name) ?? null; },
  removeItem: (name: string) => { mmkv.delete(name); },
};
