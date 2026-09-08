/**
 * Scroll-rise reveal — content slides up + fades in as it enters the viewport.
 */
export type MotionCleanup = () => void;

const RISE = 'motion-rise';

function prefersReducedMotion() {
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function isCoarsePointer() {
  return matchMedia('(hover: none), (pointer: coarse)').matches;
}

function staggerWords(container: Element) {
  container.querySelectorAll<HTMLElement>('.word-inner').forEach((word, index) => {
    word.style.transitionDelay = `${Math.min(index * 50, 520)}ms`;
  });
  container.classList.add('revealed', 'is-visible');
}

function markTargets(root: HTMLElement) {
  const seen = new Set<Element>();
  const vh = window.innerHeight || document.documentElement.clientHeight;

  const add = (el: Element | null | undefined, delay = 0) => {
    if (!el || !(el instanceof HTMLElement) || seen.has(el)) return;
    if (el.closest('[data-motion-static], .ridge-viewport, .traveler-carousel')) return;
    if (el.closest('header, .site-header, [hidden]')) return;
    if (el.parentElement?.closest(`.${RISE}, .scroll-reveal`)) return;
    seen.add(el);
    el.classList.add(RISE);
    if (delay > 0) el.style.setProperty('--rise-delay', `${delay}ms`);
    // Same turn as tagging: keep first-screen content visible (no hide flash)
    const rect = el.getBoundingClientRect();
    if (rect.top < vh * 0.85 && rect.bottom > 40) {
      el.classList.add('is-visible');
    }
  };

  root.querySelectorAll('main section').forEach((section, sectionIndex) => {
    if (sectionIndex === 0) {
      section.classList.add('hero-section');
      return;
    }

    const blocks = [
      ...section.querySelectorAll<HTMLElement>(
        'article, [data-category], .shadow-sanctuary, [class*="rounded-3xl"], [class*="rounded-2xl"]',
      ),
    ].filter((el) => {
      if (el.hasAttribute('data-motion-static') || el.closest('[data-motion-static]')) return false;
      if (el.closest('form')) return false;
      const text = el.textContent?.trim() || '';
      return text.length > 20 || !!el.querySelector('img, h2, h3');
    });

    blocks
      .filter((el) => !blocks.some((other) => other !== el && other.contains(el)))
      .forEach((el, i) => {
        add(el, (i % 4) * 45);
        el.classList.add('motion-card');
      });

    section.querySelectorAll('h2, h3').forEach((el) => {
      if (el.querySelector('.word-mask') || el.classList.contains('sentence-transition')) return;
      add(el);
    });

    section.querySelectorAll('p').forEach((el) => {
      if ((el.textContent?.trim().length || 0) < 40) return;
      if (el.closest('article, form, .motion-card')) return;
      add(el);
    });

    section.querySelectorAll('img').forEach((img) => {
      if (img.alt?.toLowerCase().includes('logo')) return;
      const frame =
        img.closest<HTMLElement>(`.${RISE}, article, .group, [class*="overflow-hidden"], [class*="aspect-"]`) ||
        img.parentElement;
      if (frame && frame !== section && !frame.closest('header')) {
        if (!frame.classList.contains(RISE) && !frame.parentElement?.closest(`.${RISE}, .scroll-reveal`)) {
          add(frame);
          frame.classList.add('motion-media');
        }
      } else {
        add(img);
      }
    });

    section.querySelectorAll('[class*="grid"] > *').forEach((el, i) => {
      if (!(el instanceof HTMLElement)) return;
      if (el.matches('script, style, br')) return;
      if ((el.textContent?.trim().length || 0) < 16 && !el.querySelector('img')) return;
      add(el, (i % 4) * 40);
    });
  });

  root.querySelectorAll('.scroll-reveal, [data-transition="sentence"]').forEach((el) => {
    el.classList.add(RISE);
    seen.add(el);
    if (el.classList.contains('is-visible') || el.classList.contains('revealed')) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < vh * 0.85 && rect.bottom > 40) el.classList.add('is-visible');
  });

  const footer = root.querySelector('footer');
  if (footer) add(footer);
}

function parseTranslateX(transform: string) {
  if (!transform || transform === 'none') return 0;
  const translate = transform.match(/translate3d\(\s*([-\d.]+)px/);
  if (translate) return Number(translate[1]) || 0;
  const matrix3d = transform.match(/^matrix3d\((.+)\)$/);
  if (matrix3d) return Number(matrix3d[1].split(',')[12]) || 0;
  const matrix = transform.match(/^matrix\((.+)\)$/);
  if (matrix) return Number(matrix[1].split(',')[4]) || 0;
  return 0;
}

function animationDurationSeconds(track: HTMLElement) {
  const raw = getComputedStyle(track).animationDuration || '54s';
  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value) || value <= 0) return 54;
  return raw.includes('ms') ? value / 1000 : value;
}

function wrapMarqueeOffset(offset: number, loopWidth: number) {
  if (loopWidth <= 0) return offset;
  let wrapped = offset % loopWidth;
  if (wrapped > 0) wrapped -= loopWidth;
  return wrapped;
}

/** Pointer drag + optional pause for duplicated CSS marquee rails. */
export function bindMarqueeRail({
  viewport,
  track,
  pauseButton = null,
}: {
  viewport: HTMLElement;
  track: HTMLElement;
  pauseButton?: HTMLButtonElement | null;
}): MotionCleanup {
  const controller = new AbortController();
  const { signal } = controller;
  const dragSurface = viewport.classList.contains('traveler-carousel')
    ? (viewport.querySelector<HTMLElement>('.traveler-window') ?? viewport)
    : viewport;
  let dragging = false;
  let pointerId = -1;
  let startX = 0;
  let origin = 0;
  let current = 0;
  let loopWidth = Math.max(track.scrollWidth / 2, 1);

  const measure = () => {
    loopWidth = Math.max(track.scrollWidth / 2, 1);
  };

  const setPausedLabel = (paused: boolean) => {
    if (!pauseButton) return;
    pauseButton.setAttribute('aria-pressed', String(paused));
    pauseButton.textContent = paused ? 'Resume movement' : 'Pause movement';
  };

  const freezeAt = (offset: number) => {
    track.style.animation = 'none';
    track.style.transform = `translate3d(${offset}px,0,0)`;
  };

  const resumeFrom = (offset: number) => {
    const wrapped = wrapMarqueeOffset(offset, loopWidth);
    const progress = Math.min(Math.max(-wrapped / loopWidth, 0), 0.9999);
    const duration = animationDurationSeconds(track);
    freezeAt(wrapped);
    void track.offsetWidth;
    track.style.removeProperty('transform');
    track.style.removeProperty('animation');
    track.style.setProperty('animation-delay', `-${progress * duration}s`, 'important');
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return;
    const target = event.target as Element;
    if (target.closest('a, button, input, select, textarea, label, [data-motion-control], .ridge-controls, .traveler-controls')) {
      return;
    }
    measure();
    dragging = true;
    pointerId = event.pointerId;
    startX = event.clientX;
    origin = parseTranslateX(getComputedStyle(track).transform);
    current = origin;
    freezeAt(origin);
    viewport.classList.add('is-dragging');
    event.preventDefault();
    dragSurface.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!dragging || event.pointerId !== pointerId) return;
    current = wrapMarqueeOffset(origin + (event.clientX - startX), loopWidth);
    track.style.transform = `translate3d(${current}px,0,0)`;
  };

  const onPointerUp = (event: PointerEvent) => {
    if (!dragging || event.pointerId !== pointerId) return;
    dragging = false;
    pointerId = -1;
    viewport.classList.remove('is-dragging');
    resumeFrom(current);
    if (dragSurface.hasPointerCapture(event.pointerId)) {
      dragSurface.releasePointerCapture(event.pointerId);
    }
  };

  dragSurface.style.touchAction = 'pan-y';
  dragSurface.addEventListener('pointerdown', onPointerDown, { signal });
  dragSurface.addEventListener('pointermove', onPointerMove, { signal });
  dragSurface.addEventListener('pointerup', onPointerUp, { signal });
  dragSurface.addEventListener('pointercancel', onPointerUp, { signal });
  window.addEventListener('resize', measure, { signal, passive: true });

  if (pauseButton) {
    pauseButton.addEventListener(
      'click',
      () => {
        const paused = !viewport.classList.contains('is-paused');
        viewport.classList.toggle('is-paused', paused);
        setPausedLabel(paused);
      },
      { signal },
    );
    setPausedLabel(viewport.classList.contains('is-paused'));
  }

  return () => {
    viewport.classList.remove('is-dragging');
    delete viewport.dataset.marqueeBound;
    controller.abort();
  };
}

/** Turn the original Stitch testimonial grid into a seamless, duplicated ridge rail. */
function upgradeRidgeVoices(root: HTMLElement) {
  const grid = [...root.querySelectorAll<HTMLElement>('div.grid')].find((candidate) =>
    candidate.textContent?.includes('Ananya Sengupta') && candidate.textContent?.includes('Devika Mehra'),
  );
  if (!grid || grid.dataset.ridgeRail === 'true') return;

  const cards = [...grid.children].filter((child) => child instanceof HTMLElement) as HTMLElement[];
  if (cards.length < 3) return;

  const makeCard = (source: HTMLElement) => {
    const paragraphs = [...source.querySelectorAll('p')];
    const quote = paragraphs[0]?.textContent?.trim() || '';
    const name = source.querySelector('h4')?.textContent?.trim() || '';
    const detail = paragraphs.at(-1)?.textContent?.trim() || '';
    const card = document.createElement('article');
    card.className = 'ridge-voice-card';
    card.dataset.motionStatic = 'true';
    card.setAttribute('aria-label', `Traveler note from ${name}`);

    const stars = document.createElement('span');
    stars.className = 'ridge-stars';
    stars.setAttribute('aria-hidden', 'true');
    stars.textContent = '★★★★★';
    const quoteNode = document.createElement('blockquote');
    quoteNode.className = 'ridge-quote';
    quoteNode.textContent = quote;
    const attribution = document.createElement('div');
    attribution.className = 'ridge-attribution';
    const nameNode = document.createElement('strong');
    nameNode.textContent = name;
    const detailNode = document.createElement('span');
    detailNode.textContent = detail;
    attribution.appendChild(nameNode);
    attribution.appendChild(detailNode);
    card.appendChild(stars);
    card.appendChild(quoteNode);
    card.appendChild(attribution);
    return card;
  };

  const railCards = cards.map(makeCard);
  const track = document.createElement('div');
  track.className = 'ridge-track';
  railCards.forEach((card) => track.appendChild(card));
  railCards.forEach((card) => {
    const duplicate = card.cloneNode(true) as HTMLElement;
    duplicate.setAttribute('aria-hidden', 'true');
    duplicate.dataset.motionStatic = 'true';
    track.appendChild(duplicate);
  });

  const controls = document.createElement('div');
  controls.className = 'ridge-controls';
  const pause = document.createElement('button');
  pause.type = 'button';
  pause.className = 'ridge-pause';
  pause.dataset.motionControl = 'carousel';
  pause.setAttribute('aria-pressed', 'false');
  pause.textContent = 'Pause movement';
  controls.appendChild(pause);

  grid.replaceChildren(track, controls);
  grid.className = 'ridge-viewport';
  grid.dataset.ridgeRail = 'true';
  grid.setAttribute('aria-label', 'Voices From The Ridge — drag or swipe to browse, or use pause');
}

function enhanceMarqueeRails(root: HTMLElement, cleanups: Array<() => void>) {
  if (prefersReducedMotion()) return;

  root.querySelectorAll<HTMLElement>('.ridge-viewport, .traveler-carousel').forEach((viewport) => {
    const track = viewport.querySelector<HTMLElement>('.ridge-track, .traveler-track');
    if (!track || viewport.dataset.marqueeBound === 'true') return;
    viewport.dataset.marqueeBound = 'true';
    const pauseButton = viewport.classList.contains('ridge-viewport')
      ? viewport.querySelector<HTMLButtonElement>('.ridge-pause')
      : null;
    cleanups.push(bindMarqueeRail({ viewport, track, pauseButton }));
  });
}

function enhanceInteractive(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>('a, button').forEach((el) => {
    if (el.closest('nav.desktop-nav, header .header-actions, .menu-grid, form, .gallery-controls, .gallery-thumbnails')) {
      return;
    }
    el.classList.add('motion-interactive');
  });
  root.querySelectorAll<HTMLElement>('.group').forEach((group) => {
    if (group.querySelector('img, [class*="group-hover:"]')) group.classList.add('motion-group');
  });
}

export function initPageMotion(root: HTMLElement): MotionCleanup {
  const reduced = prefersReducedMotion();
  const coarse = isCoarsePointer();
  const cleanups: Array<() => void> = [];
  const controller = new AbortController();
  const { signal } = controller;

  upgradeRidgeVoices(root);
  markTargets(root);
  enhanceInteractive(root);
  enhanceMarqueeRails(root, cleanups);

  const nodes = [...root.querySelectorAll<HTMLElement>(`.${RISE}, .scroll-reveal, [data-transition="sentence"]`)];

  if (reduced) {
    nodes.forEach((el) => el.classList.add('is-visible', 'revealed'));
    root.querySelectorAll('.word-inner').forEach((el) => el.classList.add('is-visible'));
    return () => {
      cleanups.forEach((fn) => fn());
      controller.abort();
    };
  }

  const hero = root.querySelector<HTMLElement>(
    '#heroHeadline, section.hero-section h1.sentence-transition, section.hero-section h1',
  );
  if (hero) {
    requestAnimationFrame(() => {
      if (hero.querySelector('.word-inner')) staggerWords(hero);
      else hero.classList.add('is-visible');
    });
  }

  const rotating = root.querySelector<HTMLElement>('#heroRotatingWord');
  if (rotating) {
    const words = ['Nature', 'Elegance', 'Comfort', 'Serenity', 'Presence'];
    let index = 0;
    rotating.style.transition = 'opacity .35s ease, transform .35s ease';
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      index = (index + 1) % words.length;
      rotating.style.opacity = '0';
      rotating.style.transform = 'translate3d(0, 6px, 0)';
      window.setTimeout(() => {
        rotating.textContent = words[index];
        rotating.style.opacity = '1';
        rotating.style.transform = 'translate3d(0, 0, 0)';
      }, 320);
    }, 3200);
    cleanups.push(() => clearInterval(timer));
  }

  const reveal = (el: Element) => {
    if (el.getAttribute('data-transition') === 'sentence' || el.classList.contains('sentence-transition')) {
      staggerWords(el);
    } else {
      el.classList.add('is-visible');
    }
  };

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        reveal(entry.target);
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.08, rootMargin: '0px 0px -48px 0px' },
  );

  const vh = window.innerHeight || document.documentElement.clientHeight;

  for (const el of nodes) {
    if (el === hero || hero?.contains(el)) continue;
    if (el.classList.contains('is-visible') || el.classList.contains('revealed')) continue;

    const rect = el.getBoundingClientRect();
    // First screen: show immediately (rise class + visible in same turn — no flash)
    if (rect.top < vh * 0.85 && rect.bottom > 40) {
      reveal(el);
      continue;
    }

    // Below the fold: stays hidden via CSS until scrolled into view
    observer.observe(el);
  }

  if (coarse) {
    root.classList.add('touch-motion');
    const touchTargets = [...root.querySelectorAll<HTMLElement>('.motion-group, .motion-card')];
    const touchObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          entry.target.classList.toggle('is-inview', entry.isIntersecting && entry.intersectionRatio >= 0.3);
        }
      },
      { threshold: [0.2, 0.3, 0.55] },
    );
    touchTargets.forEach((el) => touchObserver.observe(el));
    cleanups.push(() => touchObserver.disconnect());

    root.addEventListener(
      'pointerup',
      (e) => {
        const group = (e.target as Element).closest<HTMLElement>('.motion-group, .motion-card');
        if (!group || !root.contains(group)) return;
        const interactive = (e.target as Element).closest('a, button, input, select, textarea, label');
        if (interactive && interactive !== group) return;
        touchTargets.forEach((el) => {
          if (el !== group) el.classList.remove('is-touched');
        });
        group.classList.add('is-touched');
      },
      { signal, passive: true },
    );
  }

  let raf = 0;
  const parallax = () => {
    if (raf || window.innerWidth < 768) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      root
        .querySelectorAll<HTMLElement>('section.hero-section .absolute img, section:first-of-type > .absolute img')
        .forEach((img) => {
          if (img.getBoundingClientRect().bottom <= 0) return;
          img.classList.add('parallax-image');
          img.style.transform = `translate3d(0, ${Math.min(window.scrollY * 0.08, 48)}px, 0) scale(1.05)`;
        });
    });
  };
  window.addEventListener('scroll', parallax, { passive: true, signal });

  cleanups.push(() => {
    observer.disconnect();
    cancelAnimationFrame(raf);
    controller.abort();
  });

  return () => cleanups.forEach((fn) => fn());
}

export { prefersReducedMotion, isCoarsePointer };
