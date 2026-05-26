import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageKey } from './keys';

export async function getItem<T>(key: StorageKey): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (raw === null) {
    return null;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setItem<T>(key: StorageKey, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function removeItem(key: StorageKey): Promise<void> {
  await AsyncStorage.removeItem(key);
}

export async function multiRemove(keys: StorageKey[]): Promise<void> {
  await AsyncStorage.multiRemove(keys);
}

export async function clearAll(): Promise<void> {
  await AsyncStorage.clear();
}
