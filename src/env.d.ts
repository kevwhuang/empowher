/// <reference types="astro/client" />

declare module 'eslint-plugin-jsx-a11y';

interface Action {
    href: string;
    isDownload?: boolean;
    isExternal?: boolean;
    isGhost?: boolean;
    label: string;
}

interface ImportMetaEnv {
    readonly RESEND_API_KEY: string;
    readonly STRIPE_SECRET_KEY: string;
    readonly STRIPE_WEBHOOK_SECRET: string;
    readonly SUPABASE_PUBLISHABLE_KEY: string;
    readonly SUPABASE_URL: string;
}
