'use client';
/* Images are local, pre-optimized Stitch assets used in a 3D paired-image interaction. */
/* oxlint-disable next/no-img-element */

import { useState } from 'react';

type FlipMoment = {
  front: string;
  back: string;
  title: string;
  detail: string;
  alt: string;
};

const moments: FlipMoment[] = [
  {
    front: '/assets/cc243cf09d1ff4e3.webp',
    back: '/assets/1f41f6d2a61e11fa.webp',
    title: 'The view, then the room',
    detail: '7,500 FT above the Doon Valley, with contemplative interiors beyond the threshold.',
    alt: 'Himalayan landscape and a Light of Landour room interior',
  },
  {
    front: '/assets/1f41f6d2a61e11fa.webp',
    back: '/assets/af14cb3f06e6232c.webp',
    title: 'Rest, then ritual',
    detail: 'A quiet room, followed by slow meals and fresh pour-overs at the Glass Box Cafe.',
    alt: 'Light of Landour room interior and Glass Box Cafe',
  },
  {
    front: '/assets/af14cb3f06e6232c.webp',
    back: '/assets/cc243cf09d1ff4e3.webp',
    title: 'Dusk, then stillness',
    detail: 'The day closes over Char Dukan ridge and opens into the mist-filled Himalayan horizon.',
    alt: 'Glass Box Cafe and Himalayan landscape at Light of Landour',
  },
  { front: '/assets/cda6d79ef18477a7.webp', back: '/assets/90507856f0ff5bf5.webp', title: 'Morning, then warmth', detail: 'Steam on the Char Dukan ridge and freshly baked details at the sanctuary table.', alt: 'Landour morning and a fresh bakery detail' },
  { front: '/assets/a4a23b3f0358389a.webp', back: '/assets/0dcd2673d8853a98.webp', title: 'Winter line, then history', detail: 'A changing Himalayan sky, anchored by the quiet heritage paths of Landour.', alt: 'Himalayan winter line and historic Landour church' },
  { front: '/assets/90507856f0ff5bf5.webp', back: '/assets/cda6d79ef18477a7.webp', title: 'A slower table', detail: 'Baked mornings, cedar shade, and time enough to notice the little things.', alt: 'Bakery detail and Landour morning' },
];

const stories = [
  ['“Waking up in the Chakra suite with mist kissing the glass and hot pour-over coffee ready was absolute perfection.”', 'Ananya Sengupta', 'Author & traveler · New Delhi'],
  ['“The Glass Box Cafe served the most comforting sourdough pastries we have ever tasted in the Himalayas. Silence lives here.”', 'Marcus & Claire Vance', 'Retreatants · London, UK'],
  ['“Char Dukan is iconic, but Light of Landour elevates the experience into pure restorative luxury. We will return every winter.”', 'Devika Mehra', 'Architect · Mumbai'],
];

function FlipMomentCard({ moment, index }: { moment: FlipMoment; index: number }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <button
      type="button"
      className={`flip-moment ${flipped ? 'is-flipped' : ''}`}
      data-motion-control="flip"
      aria-pressed={flipped}
      aria-label={`${flipped ? 'Show photograph' : 'Reveal story'}: ${moment.title}`}
      onClick={() => setFlipped((value) => !value)}
    >
      <span className="flip-moment-inner">
        <span className="flip-moment-face flip-moment-front">
          <img src={moment.front} alt={moment.alt} loading="lazy" decoding="async" />
          <span className="flip-moment-label"><span>0{index + 1}</span> Turn for a moment</span>
        </span>
        <span className="flip-moment-face flip-moment-back">
          <img src={moment.back} alt="" loading="lazy" decoding="async" />
          <span className="flip-moment-shade" />
          <span className="flip-moment-copy"><small>LIGHT OF LANDOUR</small><strong>{moment.title}</strong><em>{moment.detail}</em><b>Tap to return</b></span>
        </span>
      </span>
    </button>
  );
}

export function CinematicExtras({ page = 'home' }: { page?: string }) {
  const [paused, setPaused] = useState(false);
  const pageOffsets: Record<string, number> = { about: 4, mudra: 0, chakra: 1, element: 2, dining: 3, spa: 1, retreats: 2, contact: 4 };
  const visibleMoments = page === 'home' ? moments : Array.from({ length: 3 }, (_, index) => moments[((pageOffsets[page] || 0) + index) % moments.length]);

  return (
    <section className="cinematic-extras" aria-labelledby="moments-title">
      <div className="cinematic-heading">
        <p>THE QUIET BETWEEN MOMENTS</p>
        <h2 id="moments-title">A sanctuary that changes with the light.</h2>
        <span className="cinematic-compass" aria-hidden="true">✦</span>
      </div>
      <div className="flip-moments" aria-label="Interactive sanctuary moments">
        {visibleMoments.map((moment, index) => <FlipMomentCard key={moment.title} moment={moment} index={index} />)}
      </div>
      <div className={`traveler-carousel ${paused ? 'is-paused' : ''}`} data-motion-static="true" aria-label="Traveler notes — drag or swipe to browse, or use pause">
        <div className="traveler-carousel-heading"><span>TRAVELER NOTES</span><span className="traveler-line" /></div>
        <section className="traveler-window" aria-label="Traveler notes moving from right to left" aria-live="off"><div className="traveler-track">
          {[...stories, ...stories].map(([quote, name, context], index) => (
            <article key={`${name}-${index}`} className="traveler-note" aria-hidden={index >= stories.length}>
              <blockquote>{quote}</blockquote>
              <footer><strong>{name}</strong><span>{context}</span></footer>
            </article>
          ))}
        </div></section>
        <div className="traveler-controls">
          <button type="button" data-motion-control="carousel" className="traveler-pause" aria-pressed={paused} onClick={() => setPaused((value) => !value)}>{paused ? 'Resume movement' : 'Pause movement'}</button>
        </div>
      </div>
    </section>
  );
}
