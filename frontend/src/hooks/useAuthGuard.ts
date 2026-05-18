import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/** Session key stored in sessionStorage (cleared when tab/browser closes). */
export const SESSION_KEY = 'ae_authenticated';

/** Mark the user as authenticated — call this right after a successful login. */
export function setSession(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(SESSION_KEY, '1');
  }
}

/** Clear the session — call this on every sign-out path. */
export function clearSession(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(SESSION_KEY);
  }
}

/** Returns true if a valid session exists. */
export function hasSession(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(SESSION_KEY) === '1';
}

/**
 * Auth guard hook for protected pages.
 *
 * - Checks sessionStorage on mount.
 * - If no session: clears history entry with router.replace('/login') so
 *   the back button cannot return to this page after sign-out.
 * - Returns `ready` — only render page content when ready === true.
 */
export function useAuthGuard(): boolean {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hasSession()) {
      // replace() removes this page from the history stack — back button
      // after sign-out will not return here.
      router.replace('/login');
    } else {
      setReady(true);
    }
  }, [router]);

  return ready;
}
