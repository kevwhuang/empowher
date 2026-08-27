import { Resend } from 'resend';

import confirmation from '@lib/email/reply.html?raw';
import notification from '@lib/email/inquiry.html?raw';
import { EMAIL_FROM, escapeHtml, renderTemplate } from '@lib/mailer';
import {
    EMAIL_MAX,
    EMAIL_PATTERN,
    ERROR_RATE_LIMITED,
    IS_DEV,
    LINKS,
    MESSAGE_MAX,
    NAME_MAX,
    RATE_WINDOW,
    STATUS_RATE_LIMITED,
    TOPICS,
} from '@lib/constants';
import { isRateLimited } from '@lib/limiter';

import type { APIRoute } from 'astro';

const CONFIRMATION_SUBJECT = 'Thanks for reaching out to EmpowHER Festival';
const RATE_LIMIT = 10;
const TOPIC_MAX = 50;

function readField(value: unknown, max: number): string {
    if (typeof value !== 'string') return '';

    const trimmed = value.trim();

    if (trimmed.length > max) return '';

    return trimmed;
}

export const prerender = false;

export const POST: APIRoute = async ({ clientAddress, request }) => {
    let payload: unknown;

    try {
        payload = await request.json();
    } catch {
        return Response.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return Response.json({ error: 'Invalid request body.' }, { status: 400 });

    const body: Record<string, unknown> = { ...payload };

    const email = readField(body.email, EMAIL_MAX);
    const message = readField(body.message, MESSAGE_MAX);
    const name = readField(body.name, NAME_MAX);
    const topic = readField(body.topic, TOPIC_MAX);

    if (!name) return Response.json({ error: `Name is required (max ${NAME_MAX} characters).` }, { status: 400 });

    if (!email || !EMAIL_PATTERN.test(email)) {
        return Response.json({ error: `Please enter a valid email (max ${EMAIL_MAX} characters).` }, { status: 400 });
    }

    const selectedTopic = TOPICS.find(option => option.value === topic);

    if (!selectedTopic) return Response.json({ error: 'Please choose a topic from the list.' }, { status: 400 });
    if (!message) return Response.json({ error: `Message is required (max ${MESSAGE_MAX} characters).` }, { status: 400 });

    if (await isRateLimited(clientAddress, 'contact', RATE_LIMIT, RATE_WINDOW)) {
        return Response.json({ error: ERROR_RATE_LIMITED }, { status: STATUS_RATE_LIMITED });
    }

    if (IS_DEV) return Response.json({ sent: true });

    const apiKey = import.meta.env.RESEND_API_KEY;

    if (!apiKey) return Response.json({ error: 'Email service is not configured.' }, { status: 503 });

    const resend = new Resend(apiKey);

    const replacements: Record<string, string> = {
        email: escapeHtml(email),
        message: escapeHtml(message),
        name: escapeHtml(name),
        topic: escapeHtml(selectedTopic.label),
    };

    const confirmationHtml = renderTemplate(confirmation, replacements);
    const notificationHtml = renderTemplate(notification, replacements);

    try {
        const [confirmationResult, notificationResult] = await Promise.all([
            resend.emails.send({
                from: EMAIL_FROM,
                html: confirmationHtml,
                subject: CONFIRMATION_SUBJECT,
                to: email,
            }),
            resend.emails.send({
                from: EMAIL_FROM,
                html: notificationHtml,
                replyTo: email,
                subject: `New ${selectedTopic.label} inquiry from ${name}`,
                to: LINKS.email,
            }),
        ]);

        if (confirmationResult.error || notificationResult.error) return Response.json({ error: 'Failed to send message.' }, { status: 502 });
    } catch {
        return Response.json({ error: 'Failed to send message.' }, { status: 502 });
    }

    return Response.json({ sent: true });
};
