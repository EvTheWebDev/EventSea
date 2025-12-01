import { writable } from "svelte/store";
import { onAuthStateListener } from "../lib/firebase";

/**
 * @typedef {import("firebase/auth").User | null} AuthUser
 */

/**
 * @typedef {{ user: AuthUser, loading: boolean }} AuthState
 */

/** @type {import("svelte/store").Writable<AuthState>} */
export const authStore = writable({
  user: null,
  loading: true,
});

// Subscribe to Firebase auth state
const unsubscribe = onAuthStateListener(
  /** @param {AuthUser} user */
  (user) => {
    authStore.set({ user, loading: false });
  }
);

export function stopAuthListener() {
  unsubscribe();
}
