import Stripe from 'stripe';
import { Resend } from 'resend';
import { getStore } from '@netlify/blobs';

import confirmation from '@lib/email/receipt.html?raw';
import notification from '@lib/email/order.html?raw';
import { EMAIL_FROM, escapeHtml, renderTemplate } from '@lib/mailer';
import { EMAIL_PATTERN, IS_DEV, LINKS } from '@lib/constants';
import { formatPrice } from '@lib/utils';

import type { APIRoute } from 'astro';
import type { Store } from '@netlify/blobs';

const EVENTS_STORE = 'webhook-events';
const ITEMS_LIMIT = 100;
const MISSING = 'Not provided.';
const PAID = 'paid';
const PROCESSED = 'processed';

const ROW_TEMPLATE = `<tr>
    <td style="color: #faf7ff; font-size: 16px; line-height: 1.6; padding: 8px 16px 8px 0; vertical-align: top; word-break: break-word">{{name}}</td>
    <td style="color: #b9aed1; font-size: 16px; line-height: 1.6; padding: 8px 16px; text-align: center; vertical-align: top; white-space: nowrap">{{quantity}}</td>
    <td style="color: #faf7ff; font-size: 16px; line-height: 1.6; padding: 8px 0; text-align: right; vertical-align: top; white-space: nowrap">{{amount}}</td>
</tr>`;

function getEventStore(): Store {
    return getStore({ consistency: 'strong', name: EVENTS_STORE });
}

async function isEventProcessed(eventId: string): Promise<boolean> {
    if (IS_DEV) return false;

    try {
        return await getEventStore().get(eventId) !== null;
    } catch {
        return false;
    }
}

async function markEventProcessed(eventId: string): Promise<void> {
    if (IS_DEV) return;

    try {
        await getEventStore().set(eventId, PROCESSED);
    } catch {
        return;
    }
}

async function notify(session: Stripe.Checkout.Session, resend: Resend, stripe: Stripe): Promise<void> {
    const address = session.collected_information?.shipping_details?.address;
    const contact = session.customer_details;
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: ITEMS_LIMIT });
    const total = formatPrice(session.amount_total ?? 0);

    const addressLines = [address?.line1, address?.line2, address?.city, address?.state, address?.postal_code, address?.country];
    const email = contact?.email?.trim().match(EMAIL_PATTERN)?.[0] ?? '';

    const rows = lineItems.data.map(item => renderTemplate(ROW_TEMPLATE, {
        amount: formatPrice(item.amount_total),
        name: escapeHtml(item.description ?? MISSING),
        quantity: String(item.quantity ?? 0),
    })).join('');

    const escaped = {
        email: escapeHtml(contact?.email ?? ''),
        name: escapeHtml(contact?.name || MISSING),
        orderId: escapeHtml(session.id),
        shipping: escapeHtml(addressLines.filter(Boolean).join(', ') || MISSING),
    };

    const notificationHtml = renderTemplate(notification, { ...escaped, rows, total });

    const sends = [
        resend.emails.send({
            ...(email && { replyTo: email }),
            from: EMAIL_FROM,
            html: notificationHtml,
            subject: `New merch order ${session.id}`,
            to: LINKS.email,
        }),
    ];

    if (email) {
        const confirmationHtml = renderTemplate(confirmation, {
            email: escaped.email,
            orderId: escaped.orderId,
            rows,
            total,
        });

        sends.push(resend.emails.send({
            from: EMAIL_FROM,
            html: confirmationHtml,
            subject: 'Your EmpowHER Festival order',
            to: email,
        }));
    }

    const results = await Promise.all(sends);

    if (results.some(result => result.error)) throw new Error('Order email delivery failed.');
}

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    const secretKey = import.meta.env.STRIPE_SECRET_KEY;
    const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;

    if (!secretKey || !webhookSecret) return Response.json({ error: 'Webhooks are not configured.' }, { status: 503 });

    const stripe = new Stripe(secretKey, { apiVersion: Stripe.API_VERSION });

    let event: Stripe.Event;

    try {
        const body = await request.text();
        const signature = request.headers.get('stripe-signature') ?? '';

        event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch {
        return Response.json({ error: 'Signature verification failed.' }, { status: 400 });
    }

    if (event.type !== 'checkout.session.completed') return Response.json({ received: true });

    const apiKey = import.meta.env.RESEND_API_KEY;
    const session = event.data.object;

    if (!apiKey) return Response.json({ received: true });
    if (session.payment_status !== PAID) return Response.json({ received: true });
    if (await isEventProcessed(event.id)) return Response.json({ received: true });

    try {
        await notify(session, new Resend(apiKey), stripe);
    } catch {
        return Response.json({ error: 'Order notification failed.' }, { status: 500 });
    }

    await markEventProcessed(event.id);

    return Response.json({ received: true });
};
