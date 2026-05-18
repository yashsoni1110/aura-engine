import { useCallback, useEffect, useRef } from 'react';

/**
 * Returns a stable debounced callback that delays invoking `fn` by `delay` ms.
 * - `fn` is stored in a ref so the returned debounced function never changes
 *   identity across renders, which prevents breaking the debounce timer.
 * - Timer is cleared on unmount to prevent memory leaks.
 *
 * Used for the omnisearch bar (500ms) and filter sliders to prevent an API
 * call on every single keystroke / slider tick.
 */
export function useDebounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Store the latest fn in a ref so the debounced wrapper never needs to
  // change identity when the callback changes (e.g. between renders).
  const fnRef = useRef<T>(fn);
  fnRef.current = fn;

  const debouncedFn = useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        fnRef.current(...args);
      }, delay);
    },
    // delay is the only real dependency; fnRef never changes identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [delay]
  );

  // Cleanup pending timer on unmount to prevent stale state updates
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return debouncedFn;
}
