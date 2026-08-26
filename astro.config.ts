import netlify from '@astrojs/netlify';
import react from '@astrojs/react';
import robots from 'astro-robots-txt';
import sitemap from '@astrojs/sitemap';
import tailwind from '@tailwindcss/vite';
import { defineConfig, fontProviders } from 'astro/config';

export default defineConfig({
    adapter: netlify(),
    build: {
        format: 'file',
    },
    devToolbar: {
        enabled: false,
    },
    fonts: [
        {
            cssVariable: '--font-outfit',
            display: 'block',
            name: 'Outfit',
            provider: fontProviders.fontsource(),
            styles: ['normal'],
            subsets: ['latin'],
            weights: ['100 900'],
        },
        {
            cssVariable: '--font-special-elite',
            display: 'block',
            fallbacks: ['Courier New', 'monospace'],
            name: 'Special Elite',
            provider: fontProviders.fontsource(),
            styles: ['normal'],
            subsets: ['latin'],
            weights: [400],
        },
        {
            cssVariable: '--font-unbounded',
            display: 'block',
            name: 'Unbounded',
            provider: fontProviders.fontsource(),
            styles: ['normal'],
            subsets: ['latin'],
            weights: ['200 900'],
        },
    ],
    integrations: [
        react(),
        robots(),
        sitemap({ lastmod: new Date() }),
    ],
    site: 'https://empowheratx.com',
    trailingSlash: 'never',
    vite: {
        plugins: [tailwind()],
    },
});
