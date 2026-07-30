import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { REDUCED_MOTION_QUERY } from '@lib/constants';

type ScrolledListener = (isScrolled: boolean) => void;

const COUNT_DURATION = readSeconds('--duration-count', 1.4);
const COUNT_LOCALE = 'en-US';
const MS_PER_SECOND = 1_000;
const PARALLAX_RATE = 0.28;
const PARALLAX_SELECTOR = '.home-hero__media';
const PERCENT_SCALE = 100;
const REVEAL_DURATION = readSeconds('--duration-slow', 0.75);
const REVEAL_EASE = 'power3.out';
const REVEAL_OFFSET = 26;
const REVEAL_PROPERTIES = ['rotate', 'scale', 'transform', 'transition', 'translate'];
const REVEAL_SCALE = 0.94;
const REVEAL_STAGGER = readSeconds('--scroll-step', 0.09);
const REVEAL_START_RATIO = 0.85;
const SCROLLED_OFFSET = 8;

const REVEAL_START = `top ${REVEAL_START_RATIO * PERCENT_SCALE}%`;

const REVEAL_TO: gsap.TweenVars = {
    clearProps: 'transform,transition',
    duration: REVEAL_DURATION,
    ease: REVEAL_EASE,
    opacity: 1,
    scale: 1,
    x: 0,
    y: 0,
};

const reducedMotionQuery = window.matchMedia(REDUCED_MOTION_QUERY);
const scrolledListeners = new Set<ScrolledListener>();

let motionTweens: gsap.core.Animation[] = [];

function animateCount(element: HTMLElement, prefersReducedMotion: boolean) {
    const counter = { value: 0 };
    const prefix = element.dataset.prefix ?? '';
    const suffix = element.dataset.suffix ?? '';
    const target = Number.parseInt(element.dataset.countTo ?? '0', 10);

    function format(value: number) {
        return prefix + Math.round(value).toLocaleString(COUNT_LOCALE) + suffix;
    }

    const finalText = format(target);

    if (element.textContent === finalText || prefersReducedMotion) {
        element.textContent = finalText;

        return;
    }

    motionTweens.push(gsap.to(counter, {
        duration: COUNT_DURATION,
        ease: REVEAL_EASE,
        onUpdate: () => {
            element.textContent = format(counter.value);
        },
        scrollTrigger: {
            once: true,
            start: REVEAL_START,
            trigger: element,
        },
        value: target,
    }));
}

function getRevealFrom(element: HTMLElement): gsap.TweenVars {
    const from: gsap.TweenVars = { opacity: 0, transition: 'none' };
    const parent = element.parentElement;

    const direction = element.dataset.scroll || (isStaggerParent(parent) ? parent?.dataset.scroll : '');

    switch (direction) {
        case 'left':
            return { ...from, x: -REVEAL_OFFSET };
        case 'right':
            return { ...from, x: REVEAL_OFFSET };
        case 'scale':
            return { ...from, scale: REVEAL_SCALE };
        default:
            return { ...from, y: REVEAL_OFFSET };
    }
}

function getRevealTargets() {
    return [...getStaggerParents().flatMap(getStaggerChildren), ...getSingleReveals()];
}

function getSingleReveals() {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-scroll]'));

    return elements.filter(element => isAnimatable(element) && !isStaggerParent(element) && !isStaggerParent(element.parentElement));
}

function getStaggerChildren(parent: HTMLElement) {
    return Array.from(parent.querySelectorAll<HTMLElement>(':scope > *'));
}

function getStaggerParents() {
    return Array.from(document.querySelectorAll<HTMLElement>('[data-scroll-stagger]')).filter(isAnimatable);
}

function handleFocusIn(event: FocusEvent) {
    if (!(event.target instanceof HTMLElement)) return;

    const hiddenElements: HTMLElement[] = [];

    let node: HTMLElement | null = event.target;

    while (node) {
        if (node.style.opacity === '0') hiddenElements.push(node);

        node = node.parentElement;
    }

    revealInstantly(hiddenElements);
}

function hideReveals() {
    getRevealTargets().forEach(element => gsap.set(element, getRevealFrom(element)));
}

function initParallax(prefersReducedMotion: boolean) {
    const media = document.querySelector<HTMLElement>(PARALLAX_SELECTOR);

    if (!media) return;

    if (prefersReducedMotion) {
        gsap.set(media, { clearProps: 'transform' });

        return;
    }

    motionTweens.push(gsap.fromTo(media, { y: 0 }, {
        ease: 'none',
        scrollTrigger: {
            end: () => window.innerHeight,
            invalidateOnRefresh: true,
            scrub: true,
            start: 0,
        },
        y: () => window.innerHeight * PARALLAX_RATE,
    }));
}

function initReveals(prefersReducedMotion: boolean) {
    const singleReveals = getSingleReveals();
    const staggerGroups = getStaggerParents().map(parent => ({ children: getStaggerChildren(parent), parent }));

    const targets = [...staggerGroups.flatMap(group => group.children), ...singleReveals];

    if (prefersReducedMotion) {
        revealInstantly(targets);

        return;
    }

    targets.forEach(element => gsap.set(element, getRevealFrom(element)));

    staggerGroups.forEach(({ children, parent }) => {
        const stagger = Number.parseFloat(parent.dataset.scrollStagger ?? '');

        const step = Number.isFinite(stagger) ? stagger : REVEAL_STAGGER;

        revealOnEnter(parent, () => gsap.to(children, { ...REVEAL_TO, stagger: step }));
    });

    singleReveals.forEach(element => revealOnEnter(element, () => gsap.to(element, { ...REVEAL_TO })));
}

function initScrolled() {
    ScrollTrigger.create({
        end: 'max',
        onRefresh: updateScrolled,
        onUpdate: updateScrolled,
        start: 0,
    });

    updateScrolled();
}

function isAnimatable(element: Element) {
    return !element.closest('footer');
}

function isScrolled() {
    return window.scrollY > SCROLLED_OFFSET;
}

function isStaggerParent(element: Element | null) {
    return element instanceof HTMLElement && element.dataset.scrollStagger !== undefined;
}

function readSeconds(token: string, fallback: number) {
    const value = getComputedStyle(document.documentElement).getPropertyValue(token).trim();

    const seconds = value.endsWith('ms') ? Number.parseFloat(value) / MS_PER_SECOND : Number.parseFloat(value);

    return seconds || fallback;
}

function refreshAfterAssets() {
    const pendingImages = [...document.images].filter(image => !image.complete).map(image => image.decode().catch(() => undefined));

    Promise.all([document.fonts.ready, ...pendingImages]).then(() => ScrollTrigger.refresh());
}

function revealInstantly(elements: HTMLElement[]) {
    if (!elements.length) return;

    gsap.getTweensOf(elements).forEach(tween => tween.kill());

    elements.forEach((element) => {
        REVEAL_PROPERTIES.forEach(property => element.style.removeProperty(property));
        element.style.opacity = '1';
    });
}

function revealOnEnter(trigger: HTMLElement, createTween: () => gsap.core.Tween) {
    ScrollTrigger.create({
        onEnter: () => motionTweens.push(createTween()),
        once: true,
        start: REVEAL_START,
        trigger,
    });
}

function updateScrolled() {
    const scrolled = isScrolled();

    scrolledListeners.forEach(listener => listener(scrolled));
}

document.addEventListener('focusin', handleFocusIn);
gsap.registerPlugin(ScrollTrigger);
reducedMotionQuery.addEventListener('change', initMotion);

if (!reducedMotionQuery.matches) hideReveals();

export function initMotion(): void {
    const prefersReducedMotion = reducedMotionQuery.matches;

    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    motionTweens.forEach(tween => tween.kill());
    motionTweens = [];
    document.querySelectorAll<HTMLElement>('[data-count-to]').forEach(element => animateCount(element, prefersReducedMotion));
    initParallax(prefersReducedMotion);
    initReveals(prefersReducedMotion);
    initScrolled();
    refreshAfterAssets();
}

export function watchScrolled(listener: ScrolledListener): void {
    scrolledListeners.add(listener);
    listener(isScrolled());
}
