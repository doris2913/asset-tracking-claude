'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isInitialized, setIsInitialized] = useState(false);

  // Use ref to always have access to the latest value in callbacks
  const storedValueRef = useRef<T>(storedValue);

  // Keep ref in sync with state
  useEffect(() => {
    storedValueRef.current = storedValue;
  }, [storedValue]);

  // Initialize from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        setStoredValue(parsed);
        storedValueRef.current = parsed;
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
    }
    setIsInitialized(true);
  }, [key]);

  // Return a wrapped version of useState's setter function that persists to localStorage
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        // Use ref to get the latest value for functional updates
        const valueToStore = value instanceof Function ? value(storedValueRef.current) : value;

        // Update both state and ref
        setStoredValue(valueToStore);
        storedValueRef.current = valueToStore;

        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key]
  );

  return [storedValue, setValue];
}
