const PAD_LENGTH = 2;

export const LINKS = {
    email: 'empowher@annamadewell.com',
    instagram: 'https://instagram.com/empowher.atx',
    instagramHandle: '@empowher.atx',
    pitchDeck: '/empowher_festival_pitch_deck.pdf',
    website: 'https://annamadewell.com',
    websiteLabel: 'annamadewell.com',
} as const;

export const ROUTES = [
    { href: '/', label: 'Home' },
    { href: '/info', label: 'Info' },
    { href: '/store', label: 'Store' },
    { href: '/partners', label: 'Partners' },
    { href: '/team', label: 'Team' },
    { href: '/gallery', label: 'Gallery' },
    { href: '/contact', label: 'Contact' },
] as const;

export function pad(value: number, length = PAD_LENGTH): string {
    return String(value).padStart(length, '0');
}
