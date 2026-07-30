import { describe, expect, test } from 'vitest';

import { LINKS, ROUTES } from '../../src/lib/constants';

const EMAIL_PATTERN = /^[^\s:@]+@[^\s:@]+\.[^\s:@]+$/;
const EXTERNAL_LINK_KEYS = ['instagram', 'website'] as const;

const ROUTE_LABELS = [
    'Home',
    'Info',
    'Store',
    'Partners',
    'Team',
    'Gallery',
    'Contact',
] as const;

describe('LINKS', () => {
    test('gives every destination a non-empty string value', () => {
        for (const [key, value] of Object.entries(LINKS)) {
            expect(value.trim(), key).not.toBe('');
        }
    });

    test('points every off-site destination at an https url', () => {
        for (const key of EXTERNAL_LINK_KEYS) {
            expect(LINKS[key].startsWith('https://'), key).toBe(true);
        }
    });

    test('stores the contact address bare so consumers add the mailto scheme', () => {
        expect(LINKS.email).toMatch(EMAIL_PATTERN);
    });

    test('serves the pitch deck from an internal pdf path', () => {
        expect(LINKS.pitchDeck.startsWith('/')).toBe(true);
        expect(LINKS.pitchDeck.endsWith('.pdf')).toBe(true);
    });
});

describe('ROUTES', () => {
    test('lists the seven pages in navigation order', () => {
        expect(ROUTES.map(route => route.label)).toEqual([...ROUTE_LABELS]);
    });

    test('gives every route an internal absolute path, a non-empty label, and a unique href', () => {
        const hrefs = ROUTES.map(route => route.href);

        for (const route of ROUTES) {
            expect(route.href.startsWith('/'), route.label).toBe(true);
            expect(route.label.trim(), route.href).not.toBe('');
        }

        expect(new Set(hrefs).size).toBe(ROUTES.length);
    });
});
