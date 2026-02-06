import { useState } from 'react'
import { storage } from '../../infrastructure/storage/local-storage'

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    const item = storage.get<T>(key)
    return item !== null ? item : initialValue
  })

  const setValue = (value: T) => {
    setStoredValue(value)
    storage.set(key, value)
  }

  return [storedValue, setValue]
}
