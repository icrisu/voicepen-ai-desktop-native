import { load, type Store } from "@tauri-apps/plugin-store";
import type { StorageData } from "./types";
import { STORAGE_DEFAULTS } from "./types";

let _store: Store | null = null;

async function getStore(): Promise<Store> {
  if (!_store) {
    _store = await load("odinsight-store.json");
  }
  return _store;
}

export const getStorage = async <K extends keyof StorageData>(key: K): Promise<StorageData[K]> => {
  const store = await getStore();
  const value = await store.get<StorageData[K]>(key);
  return value !== undefined && value !== null ? value : STORAGE_DEFAULTS[key];
};

export const setStorage = async <K extends keyof StorageData>(key: K, value: StorageData[K]): Promise<void> => {
  const store = await getStore();
  await store.set(key, value);
};

export const getLanguage = async (): Promise<string> => {
  const store = await getStore();
  return (await store.get<string>("language")) ?? "en";
};

export const setLanguage = async (lang: string): Promise<void> => {
  const store = await getStore();
  await store.set("language", lang);
};
