import { writable } from "svelte/store";
import { onAuthStateListener } from "../lib/firebase";

/**
 * @typedef {import("firebase/auth").User | null} AuthUser
 */

/**
 * @typedef {{ user: AuthUser, loading: boolean }} AuthState
 */

/* =========================================
   1. USER AUTHENTICATION STATE
   (Tracks if the user is logged in)
   ========================================= */

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

/* =========================================
   2. AUTH MODAL UI STATE
   (Tracks if the Login/Signup popup is open)
   ========================================= */

export const authModalStore = writable({
    isOpen: false,
    mode: 'login' // Options: 'login' | 'signup'
});

/**
 * Opens the auth modal in a specific mode.
 * @param {'login' | 'signup'} mode 
 */
export function openAuthModal(mode = 'login') {
    authModalStore.set({ isOpen: true, mode });
}

/**
 * Closes the auth modal.
 */
export function closeAuthModal() {
    // We use update to keep the mode as-is (optional preference) 
    // or just overwrite it. Setting isOpen false is the key.
    authModalStore.update(state => ({ ...state, isOpen: false }));
}