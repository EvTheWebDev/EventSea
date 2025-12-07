// src/lib/adminStore.js
import { writable } from 'svelte/store';

/**
 * 1. Define the specific shape of the Stats object
 * @typedef {Object} StatsData
 * @property {number} followers
 * @property {number} rsvps
 * @property {string} orgName
 */

/**
 * 2. Use that shape inside the main Store definition
 * @typedef {Object} AdminStoreData
 * @property {boolean} isLoaded
 * @property {string|null} orgId
 * @property {StatsData} stats  <-- This tells VS Code exactly what fields to expect!
 * @property {any[]} events
 */

/** @type {import('svelte/store').Writable<AdminStoreData>} */
export const adminOrgData = writable({
    isLoaded: false,
    orgId: null,
    // Initialize with safe defaults matching the types above
    stats: { 
        followers: 0, 
        rsvps: 0, 
        orgName: "Loading..." 
    },
    events: []
});