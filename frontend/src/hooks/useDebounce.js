import { useEffect, useState } from 'react';

/**
 * Simple debouncing hook. Returns a debounced value that only updates after the
 * specified delay has passed without changes.
 *
 * @param {any} value The value to debounce
 * @param {number} delay The debounce delay in milliseconds
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}