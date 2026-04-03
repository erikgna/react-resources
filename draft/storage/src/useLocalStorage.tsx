import { useEffect, useState } from "react";

export type StorageValue<T> = {
  value: T;
  expiry?: number;
};

// local storage is synchronous
// blocking, can freeze UI
// max size is 5MB per origin, but each browser has a different limit
// no indexing or querying
// no expiration
// no partial updates

export class LocalStorageService {
  static set<T>(key: string, value: T, ttl?: number) {
    const data: StorageValue<T> = {
      value,
      expiry: ttl ? Date.now() + ttl : undefined,
    };

    localStorage.setItem(key, JSON.stringify(data));
  }

  static get<T>(key: string): T | null {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    try {
      const data: StorageValue<T> = JSON.parse(raw);

      if (data.expiry && Date.now() > data.expiry) {
        localStorage.removeItem(key);
        return null;
      }

      return data.value;
    } catch {
      return null;
    }
  }

  static remove(key: string) {
    localStorage.removeItem(key);
  }

  static clear() {
    localStorage.clear();
  }
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const stored = LocalStorageService.get<T>(key);
    return stored ?? initialValue;
  });

  useEffect(() => {
    LocalStorageService.set(key, value);
  }, [key, value]);

  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key === key) {
        const newValue = LocalStorageService.get<T>(key);
        if (newValue !== null) {
          setValue(newValue);
        }
      }
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [key]);

  return [value, setValue] as const;
}
