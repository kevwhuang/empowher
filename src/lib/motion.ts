const COUNT_DURATION_MS = 1_400;
const COUNT_EASE_EXPONENT = 3;
const PARALLAX_RATE = 0.28;
const REVEAL_ROOT_MARGIN = '0px 0px -6% 0px';
const REVEAL_THRESHOLD = 0.1;

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let parallaxMedia: HTMLElement | null = null;
let parallaxQueued = false;

function animateCount(element: HTMLElement) {
    const prefix = element.dataset.prefix ?? '';
    const suffix = element.dataset.suffix ?? '';
    const target = Number.parseInt(element.dataset.countTo ?? '0', 10);

    function format(value: number) {
        return prefix + value.toLocaleString('en-US') + suffix;
    }

    if (prefersReducedMotion) {
        element.textContent = format(target);

        return;
    }

    const start = performance.now();

    function frame(now: number) {
        const progress = Math.min(1, (now - start) / COUNT_DURATION_MS);
        const eased = 1 - (1 - progress) ** COUNT_EASE_EXPONENT;

        element.textContent = format(Math.round(target * eased));
        if (progress < 1) requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
}

export function initMotion() {
    parallaxMedia = prefersReducedMotion ? null : document.querySelector('.hero__media');

    watchViewport(document.querySelectorAll('[data-reveal]'), element => element.classList.add('is-in'));
    watchViewport(document.querySelectorAll('[data-count-to]'), animateCount);
    updateParallax();
}

function queueParallax() {
    if (!parallaxMedia || parallaxQueued) return;

    parallaxQueued = true;
    requestAnimationFrame(updateParallax);
}

function updateParallax() {
    parallaxQueued = false;

    if (!parallaxMedia) return;

    const offset = Math.min(window.scrollY, window.innerHeight);

    parallaxMedia.style.transform = `translateY(${offset * PARALLAX_RATE}px)`;
}

function watchViewport(elements: NodeListOf<HTMLElement>, callback: (element: HTMLElement) => void) {
    if (!elements.length) return;

    if (prefersReducedMotion) {
        elements.forEach(callback);

        return;
    }

    function handleEntries(entries: IntersectionObserverEntry[], observer: IntersectionObserver) {
        for (const entry of entries) {
            if (!entry.isIntersecting) continue;

            observer.unobserve(entry.target);
            callback(entry.target as HTMLElement);
        }
    }

    const observer = new IntersectionObserver(handleEntries, { rootMargin: REVEAL_ROOT_MARGIN, threshold: REVEAL_THRESHOLD });

    elements.forEach(element => observer.observe(element));
}

window.addEventListener('scroll', queueParallax, { passive: true });
