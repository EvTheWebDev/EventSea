// import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
import adapter from '@sveltejs/adapter-static';

const config = {
    kit: {
        paths: { base: '/~ejschmit/public_html/eventSea' },
        adapter: adapter({
            // Set the output directory name
            pages: 'build', 
            assets: 'build',
            fallback: 'index.html' // Required for single-page application (SPA) mode
        })
    }
};

export default config;
