import Stripe from 'stripe';
import { getCollection } from 'astro:content';

import { ERROR_RATE_LIMITED, ITEMS_MAX, QUANTITY_MAX, RATE_WINDOW, STATUS_RATE_LIMITED } from '@lib/constants';
import { isRateLimited } from '@lib/limiter';

import type { APIRoute } from 'astro';

const CURRENCY = 'usd';
const ERROR_UNKNOWN_PRODUCT = 'An item references an unknown product.';
const RATE_LIMIT = 20;
const SHIPPING_COUNTRY = 'US';
const SITE_ORIGIN = 'https://empowheratx.com';
const SKU_PARTS_MAX = 2;

export const prerender = false;

export const POST: APIRoute = async ({ clientAddress, request, site }) => {
    let payload: unknown;

    try {
        payload = await request.json();
    } catch {
        return Response.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return Response.json({ error: 'Invalid request body.' }, { status: 400 });

    const body: Record<string, unknown> = { ...payload };

    const items: unknown[] = Array.isArray(body.items) ? body.items : [];

    if (items.length === 0 || items.length > ITEMS_MAX) {
        return Response.json({ error: `An order must include between 1 and ${ITEMS_MAX} items.` }, { status: 400 });
    }

    const keys = new Set<string>();
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    const products = await getCollection('store');

    for (const item of items) {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
            return Response.json({ error: 'Each item must be an object.' }, { status: 400 });
        }

        const line: Record<string, unknown> = { ...item };

        const quantity = line.quantity;
        const sku = line.sku;

        if (typeof sku !== 'string') return Response.json({ error: 'Each item must include its SKU as a string.' }, { status: 400 });

        if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1 || quantity > QUANTITY_MAX) {
            return Response.json({ error: `Each item quantity must be a whole number from 1 to ${QUANTITY_MAX}.` }, { status: 400 });
        }

        const parts = sku.split(':');

        if (parts.length > SKU_PARTS_MAX) return Response.json({ error: ERROR_UNKNOWN_PRODUCT }, { status: 400 });

        const id = parts[0] ?? '';
        const size = parts[1] ?? '';

        const product = products.find(entry => entry.id === id);

        if (!product) return Response.json({ error: ERROR_UNKNOWN_PRODUCT }, { status: 400 });

        const sizes = product.data.sizes;

        if (size && !sizes) return Response.json({ error: 'An item includes a size for a product sold without sizes.' }, { status: 400 });
        if (!size && sizes) return Response.json({ error: 'An item is missing its size.' }, { status: 400 });

        if (sizes && !sizes.some(availableSize => availableSize === size)) {
            return Response.json({ error: 'An item requests a size that is unavailable.' }, { status: 400 });
        }

        const key = `${id}:${size}`;

        if (keys.has(key)) return Response.json({ error: 'An order must not repeat the same item.' }, { status: 400 });

        keys.add(key);

        lineItems.push({
            price_data: {
                currency: CURRENCY,
                product_data: {
                    ...(product.data.description && { description: product.data.description }),
                    name: size ? `${product.data.name} (${size})` : product.data.name,
                },
                unit_amount: product.data.price,
            },
            quantity,
        });
    }

    if (await isRateLimited(clientAddress, 'checkout', RATE_LIMIT, RATE_WINDOW)) {
        return Response.json({ error: ERROR_RATE_LIMITED }, { status: STATUS_RATE_LIMITED });
    }

    const origin = site?.origin ?? SITE_ORIGIN;
    const secretKey = import.meta.env.STRIPE_SECRET_KEY;

    if (!secretKey) return Response.json({ error: 'Checkout is not configured.' }, { status: 503 });

    const stripe = new Stripe(secretKey, { apiVersion: Stripe.API_VERSION });

    try {
        const session = await stripe.checkout.sessions.create({
            billing_address_collection: 'auto',
            cancel_url: `${origin}/store?checkout=canceled`,
            line_items: lineItems,
            mode: 'payment',
            shipping_address_collection: { allowed_countries: [SHIPPING_COUNTRY] },
            success_url: `${origin}/store?checkout=success`,
        });

        return Response.json({ url: session.url });
    } catch {
        return Response.json({ error: 'Checkout could not be started.' }, { status: 502 });
    }
};
