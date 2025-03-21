import { useState, useEffect } from "react";

type SetValue<T> = T | ((val: T) => T);

function useLocalStorage<T>(
  key: string,
  initialValue: T,
  expiryInMs?: number,
): [T, (value: SetValue<T>) => void, () => void] {
  // Get from local storage then parse stored json or return initialValue
  const readValue = (): T => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      // Check if the item has expired
      const expiryKey = `${key}_expiry`;
      const expiryTime = localStorage.getItem(expiryKey);

      if (expiryTime && expiryInMs) {
        const expiryTimeNum = parseInt(expiryTime, 10);
        const now = Date.now();

        if (now >= expiryTimeNum) {
          localStorage.removeItem(key);
          localStorage.removeItem(expiryKey);
          return initialValue;
        }
      }

      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  };

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value: SetValue<T>) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;

      // Save to state
      setStoredValue(valueToStore);

      // Save to local storage
      if (typeof window !== "undefined") {
        localStorage.setItem(key, JSON.stringify(valueToStore));

        // Set expiry if provided
        if (expiryInMs) {
          const expiryTime = Date.now() + expiryInMs;
          localStorage.setItem(`${key}_expiry`, expiryTime.toString());
        }
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  // Remove from localStorage
  const removeValue = () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(key);
        localStorage.removeItem(`${key}_expiry`);
        setStoredValue(initialValue);
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  };

  useEffect(() => {
    setStoredValue(readValue());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        setStoredValue(JSON.parse(e.newValue));
      } else if (e.key === key && e.newValue === null) {
        setStoredValue(initialValue);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorageChange);
      return () => window.removeEventListener("storage", handleStorageChange);
    }
    return undefined;
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

export default useLocalStorage;
