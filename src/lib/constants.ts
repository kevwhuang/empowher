export const EMAIL_MAX = 200;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const ERROR_GENERIC = 'Something went wrong. Please try again.';
export const ERROR_RATE_LIMITED = 'Too many requests. Please try again later.';
export const IS_DEV = import.meta.env.DEV;
export const ITEMS_MAX = 8;
export const JSON_HEADERS = { 'Content-Type': 'application/json' } as const;

export const LINKS = {
    email: 'empowher@annamadewell.com',
    instagram: 'https://instagram.com/empowher.atx',
    instagramHandle: '@empowher.atx',
    pitchDeck: '/assets/empowher_festival_pitch_deck.pdf',
} as const;

export const LOCALE = 'en-US';
export const MESSAGE_MAX = 2_000;
export const MS_PER_SECOND = 1_000;
export const NAME_MAX = 100;
export const QUANTITY_MAX = 10;
export const RATE_WINDOW = 3_600_000;
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export const ROUTES = [
    { href: '/', label: 'Home' },
    { href: '/info', label: 'Info' },
    { href: '/store', label: 'Store' },
    { href: '/partners', label: 'Partners' },
    { href: '/team', label: 'Team' },
    { href: '/gallery', label: 'Gallery' },
    { href: '/contact', label: 'Contact' },
] as const;

export const STATUS_RATE_LIMITED = 429;

export const TOPICS = [
    { label: 'Media & press', value: 'press' },
    { label: 'Merch & orders', value: 'merch' },
    { label: 'Performing', value: 'performing' },
    { label: 'Something else', value: 'other' },
    { label: 'Sponsorship', value: 'sponsorship' },
    { label: 'Tickets', value: 'tickets' },
    { label: 'Vending', value: 'vending' },
    { label: 'Volunteering', value: 'volunteering' },
] as const;
