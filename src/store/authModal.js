import { writable } from "svelte/store";

export const showAuthModal = writable(false);
export const authRedirect = writable(null);