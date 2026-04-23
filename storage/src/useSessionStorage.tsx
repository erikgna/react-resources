import { useEffect, useState } from "react";

export type StorageValue<T> = {
  value: T;
  expiry?: number;
};

// same as localStorage but is scope by tabs (cleared when all closed)
// no cross tab sync, each tab has its own session storage
// a copy will be created if a new tab is opened with window.open()

// Refresh → data stays
// Close tab → data gone
// New tab → fresh storage

export class SessionStorageService {
  static set<T>(key: string, value: T, ttl?: number) {
    const data: StorageValue<T> = {
      value,
      expiry: ttl ? Date.now() + ttl : undefined,
    };

    sessionStorage.setItem(key, JSON.stringify(data));
  }

  static get<T>(key: string): T | null {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;

    try {
      const data: StorageValue<T> = JSON.parse(raw);

      if (data.expiry && Date.now() > data.expiry) {
        sessionStorage.removeItem(key);
        return null;
      }

      return data.value;
    } catch {
      return null;
    }
  }

  static remove(key: string) {
    sessionStorage.removeItem(key);
  }

  static clear() {
    sessionStorage.clear();
  }
}

export function useSessionStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const stored = SessionStorageService.get<T>(key);
    return stored ?? initialValue;
  });

  useEffect(() => {
    SessionStorageService.set(key, value);
  }, [key, value]);

  return [value, setValue] as const;
}
