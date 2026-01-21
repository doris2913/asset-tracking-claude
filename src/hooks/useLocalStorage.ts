'use client';

import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
    }
    setIsInitialized(true);
  }, [key]);

  // Listen for storage events (updates from other tabs/windows and same tab)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent | CustomEvent) => {
      let eventKey: string | null;
      let newValue: string | null;
      
      if (e instanceof StorageEvent) {
        eventKey = e.key;
        newValue = e.newValue;
      } else {
        // CustomEvent from same tab
        eventKey = e.detail.key;
        newValue = e.detail.newValue;
      }
      
      if (eventKey === key) {
        try {
          if (newValue === null) {
            // Item was removed, reset to initial value
            setStoredValue(initialValue);
          } else {
            setStoredValue(JSON.parse(newValue));
          }
        } catch (error) {
          console.error(`Error parsing storage event for key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange as EventListener);
    return () => window.removeEventListener('storage', handleStorageChange as EventListener);
  }, [key, initialValue]);

  // Return a wrapped version of useState's setter function that persists to localStorage
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        // Allow value to be a function so we have same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);

        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
          // Dispatch a custom event for same-tab updates
          const event = new CustomEvent('storage', {
            detail: { key, newValue: JSON.stringify(valueToStore) }
          });
          window.dispatchEvent(event);
        }
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
}
