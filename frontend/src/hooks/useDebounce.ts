import { useCallback, useEffect, useRef } from 'react';

/**
 * Custom hook to debounce callback functions.
 */
export function useDebounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Keep track of the latest function reference
  const fnRef = useRef<T>(fn);
  fnRef.current = fn;

  const debouncedFn = useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        fnRef.current(...args);
      }, delay);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [delay]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return debouncedFn;
}
