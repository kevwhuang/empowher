import { LOCALE } from '@lib/constants';

const CENTS_PER_DOLLAR = 100;
const CURRENCY = 'USD';
const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled])';

export function formatPrice(cents: number): string {
    return new Intl.NumberFormat(LOCALE, { currency: CURRENCY, style: 'currency' }).format(cents / CENTS_PER_DOLLAR);
}

export function registerPageScript(init: (signal: AbortSignal) => void): void {
    let controller: AbortController | undefined;

    function abortPageScript() {
        controller?.abort();
    }

    function handlePageLoad() {
        abortPageScript();
        controller = new AbortController();
        init(controller.signal);
    }

    document.addEventListener('astro:before-swap', abortPageScript);
    document.addEventListener('astro:page-load', handlePageLoad);
}

export function showMessage(element: HTMLElement | null, message: string): void {
    if (!element) return;

    element.hidden = false;
    element.textContent = message;
}

export function trapFocus(event: KeyboardEvent, container: HTMLElement): void {
    const focusables = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(element => !element.closest('[hidden]'));

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if ((document.activeElement === first || !container.contains(document.activeElement)) && event.shiftKey) {
        event.preventDefault();
        last?.focus();
    } else if ((document.activeElement === last || !container.contains(document.activeElement)) && !event.shiftKey) {
        event.preventDefault();
        first?.focus();
    }
}
