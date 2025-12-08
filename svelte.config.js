// svelte.config.js
import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    kit: {
        // ... (your paths config) ...
        adapter: adapter()
    }
};

export default config;