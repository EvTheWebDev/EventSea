import { writable } from "svelte/store";

export const showAuthModal = writable(false);
export const authRedirect = writable(null);

/**
 * Open the auth modal and optionally navigate after successful auth.
 * @param {string | null} redirectPath
 */
export function promptLogin(redirectPath = null) {
  if (typeof window !== "undefined") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  authRedirect.set(redirectPath);
  showAuthModal.set(true);
}
