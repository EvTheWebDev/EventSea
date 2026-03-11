// svelte.config.js
import adapterVercel from "@sveltejs/adapter-vercel";
import adapterStatic from "@sveltejs/adapter-static";
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
// Check if we are building for mobile
const isMobile = process.env.VITE_MOBILE_BUILD === 'true';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    appDir: 'app',
    // Dynamically switch the adapter
    adapter: isMobile 
      ? adapterStatic({
          pages: 'build',
          assets: 'build',
          // Note: Using 'index.html' instead of null is crucial for Capacitor 
          // so that client-side routing works properly on a phone!
          fallback: 'index.html', 
          precompress: false,
          strict: false // Set to false to prevent errors if some pages aren't prerendered
        })
      : adapterVercel(),
  },
};

export default config;