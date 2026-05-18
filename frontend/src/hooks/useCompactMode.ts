import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'ae_compact_mode';
const EVENT_NAME  = 'ae-compact-mode-change';

/** Read the current preference from localStorage (SSR-safe). */
function readPreference(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) === '1';
}

/**
 * Shared compact-mode hook.
 *
 * - Persists to localStorage so the preference survives page refreshes.
 * - Broadcasts a custom event so every mounted component (e.g. the
 *   inventory page open in the same tab) reacts instantly without a reload.
 * - Also listens to the native `storage` event for cross-tab sync.
 */
export function useCompactMode(): [boolean, (next: boolean) => void] {
  const [compact, setCompact] = useState<boolean>(false);

  // Hydrate from localStorage after mount (avoids SSR mismatch).
  useEffect(() => {
    setCompact(readPreference());
  }, []);

  // Listen for changes coming from OTHER components / tabs.
  useEffect(() => {
    const handleCustom = () => setCompact(readPreference());
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setCompact(readPreference());
    };

    window.addEventListener(EVENT_NAME, handleCustom);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(EVENT_NAME, handleCustom);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  /** Toggle or set explicitly — persists and notifies all listeners. */
  const setMode = useCallback((next: boolean) => {
    localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
    setCompact(next);
    // Notify other components in the same tab.
    window.dispatchEvent(new Event(EVENT_NAME));
  }, []);

  return [compact, setMode];
}
