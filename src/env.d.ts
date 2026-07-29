/// <reference types="astro/client" />

declare module 'eslint-plugin-jsx-a11y';

type Timer = ReturnType<typeof setInterval>;

interface ImportMetaEnv {
    readonly SUPABASE_PUBLISHABLE_KEY: string;
    readonly SUPABASE_URL: string;
}
