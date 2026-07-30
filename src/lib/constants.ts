export const LINKS = {
    email: 'empowher@annamadewell.com',
    instagram: 'https://instagram.com/empowher.atx',
    instagramHandle: '@empowher.atx',
    pitchDeck: '/assets/empowher_festival_pitch_deck.pdf',
    website: 'https://annamadewell.com',
    websiteLabel: 'annamadewell.com',
} as const;

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
