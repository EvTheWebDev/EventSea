import { writable } from "svelte/store";

/**
 * @type {import('svelte/store').Writable<{ message: string; type: 'success' | 'warning' | 'error' } | null>}
 */
export const messageStore = writable(null);

/**
 * Show a success message in the app
 * @param {string} message
 * @param {number} [duration=3000] - How long to show the message (ms)
 */
export function showMessage(message, duration = 3000) {
  messageStore.set({ message, type: "success" });
  if (duration > 0) {
    setTimeout(() => messageStore.set(null), duration);
  }
}
