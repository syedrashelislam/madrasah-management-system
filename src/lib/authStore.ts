/**
 * Central auth store — a single source of truth for Supabase auth state.
 *
 * Problem solved: Multiple components calling supabase.auth.getSession() and
 * supabase.auth.onAuthStateChange() simultaneously causes lock contention:
 *   "Lock was released because another request stole it"
 *
 * Solution:
 * 1. ONE onAuthStateChange listener registered at module level (fires INITIAL_SESSION on load).
 * 2. NO separate getSession() call — avoids lock contention from two parallel lock acquisitions.
 * 3. All components subscribe to this store instead of calling Supabase directly.
 */

import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

type AuthListener = (user: User | null, session: Session | null) => void;

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
}

// Internal state
let state: AuthState = {
  user: null,
  session: null,
  isLoading: true,
};

const listeners = new Set<AuthListener>();

function notify() {
  listeners.forEach(fn => fn(state.user, state.session));
}

// Bootstrap: single onAuthStateChange listener only.
// Supabase fires INITIAL_SESSION event synchronously on the first tick
// with the current session — no separate getSession() needed.
let initialized = false;

function init() {
  if (initialized) return;
  initialized = true;

  supabase.auth.onAuthStateChange((_event, session) => {
    state = { user: session?.user ?? null, session: session ?? null, isLoading: false };
    notify();
  });
}

// Call init immediately so it's ready before any component mounts
init();

/** Subscribe to auth state changes. Returns unsubscribe fn. */
export function subscribeAuth(fn: AuthListener): () => void {
  listeners.add(fn);
  // Immediately call with current state (even if still loading)
  fn(state.user, state.session);
  return () => listeners.delete(fn);
}

/** Get current snapshot (synchronous). */
export function getAuthState(): AuthState {
  return state;
}
