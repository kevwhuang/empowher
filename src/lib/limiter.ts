import { getStore } from '@netlify/blobs';

import { IS_DEV } from '@lib/constants';

import type { Store } from '@netlify/blobs';

interface RateRecord {
    count: number;
    windowStart: number;
}

const GLOBAL_KEY = 'api-global';
const GLOBAL_LIMIT = 500;
const GLOBAL_WINDOW = 86_400_000;
const STORE_NAME = 'rate-limits';

async function isKeyRateLimited(store: Store, key: string, limit: number, windowDuration: number): Promise<boolean> {
    const now = Date.now();

    const stored: unknown = await store.get(key, { type: 'json' });

    const record = readRecord(stored);

    const isSameWindow = record !== null && now - record.windowStart < windowDuration;

    if (isSameWindow && record.count >= limit) return true;

    await store.setJSON(key, isSameWindow ? { count: record.count + 1, windowStart: record.windowStart } : { count: 1, windowStart: now });

    return false;
}

function readRecord(value: unknown): RateRecord | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

    const record: Record<string, unknown> = { ...value };

    if (typeof record.count !== 'number' || !Number.isFinite(record.count)) return null;
    if (typeof record.windowStart !== 'number' || !Number.isFinite(record.windowStart)) return null;

    return { count: record.count, windowStart: record.windowStart };
}

export async function isRateLimited(clientAddress: string, scope: string, limit: number, windowDuration: number): Promise<boolean> {
    if (IS_DEV) return false;

    try {
        const store = getStore({ consistency: 'strong', name: STORE_NAME });

        if (await isKeyRateLimited(store, `${scope}-${clientAddress}`, limit, windowDuration)) return true;

        return await isKeyRateLimited(store, GLOBAL_KEY, GLOBAL_LIMIT, GLOBAL_WINDOW);
    } catch {
        return false;
    }
}
