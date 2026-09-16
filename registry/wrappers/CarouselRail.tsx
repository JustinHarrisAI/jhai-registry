'use client';

import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import type { ReactNode } from 'react';

/**
 * CarouselRail — a drag rail with token-painted controls.
 *
 * WHY A LIBRARY AND NOT COPIED SOURCE
 * Drag physics, momentum, snap points, pointer capture and the resize maths are behaviour, not
 * appearance. Hand-rolling them produces a rail that feels wrong on a trackpad and breaks on
 * touch, and shadcn/ui's own carousel already depends on Embla, so the package is in the tree
 * whether or not it is written down. This makes it explicit, which is the difference between a
 * pinned version JHAI tests and a transitive one that moves when shadcn moves.
 *
 * WHAT THE WRAPPER ADDS
 * Every visible surface — the controls, their ring, the progress dots — paints from the
 * project's own semantic tokens, so a client palette swap recolours the rail with no edit here.
 * Embla itself renders nothing, which is exactly why it is safe to adopt.
 */

export interface CarouselRailProps {
  /** Slides. Each child is wrapped in a flex-basis slot by this component. */
  children: ReactNode[];
  /** Slot width as a Tailwind basis utility, e.g. "basis-full" or "basis-1/3". */
  slotClass?: string;
  /** Show previous/next controls. Dots are always shown when there is more than one page. */
  controls?: boolean;
  /** Accessible label for the rail region. */
  label?: string;
  className?: string;
}

export function CarouselRail({
  children,
  slotClass = 'basis-full sm:basis-1/2 lg:basis-1/3',
  controls = true,
  label = 'Carousel',
  className,
}: CarouselRailProps) {
  const [ref, api] = useEmblaCarousel({ align: 'start', containScroll: 'trimSnaps' });
  const [selected, setSelected] = useState(0);
  const [snaps, setSnaps] = useState<number[]>([]);

  useEffect(() => {
    if (!api) return;
    const sync = () => setSelected(api.selectedScrollSnap());
    setSnaps(api.scrollSnapList());
    sync();
    api.on('select', sync).on('reInit', () => { setSnaps(api.scrollSnapList()); sync(); });
  }, [api]);

  const go = useCallback((i: number) => api?.scrollTo(i), [api]);

  return (
    <section className={className} aria-roledescription="carousel" aria-label={label}>
      <div className="overflow-hidden" ref={ref}>
        <div className="flex gap-[var(--ui-gap-card)]">
          {children.map((child, i) => (
            <div key={i} className={`min-w-0 shrink-0 grow-0 ${slotClass}`} aria-roledescription="slide">
              {child}
            </div>
          ))}
        </div>
      </div>

      {snaps.length > 1 ? (
        <div className="mt-[var(--ui-gap-inline)] flex items-center gap-3">
          {controls ? (
            <>
              <RailButton onClick={() => api?.scrollPrev()} label="Previous slide">&#8592;</RailButton>
              <RailButton onClick={() => api?.scrollNext()} label="Next slide">&#8594;</RailButton>
            </>
          ) : null}
          <div className="flex gap-1.5" role="tablist" aria-label="Slides">
            {snaps.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === selected}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => go(i)}
                className={`h-1.5 rounded-full transition-[width,background-color] duration-[var(--ui-dur-fast)] ease-[var(--ui-ease)] ${
                  i === selected ? 'w-6 bg-foreground' : 'w-1.5 bg-border'
                }`}
              />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function RailButton({ onClick, label, children }: { onClick: () => void; label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex h-[var(--ui-button-h-nav)] w-[var(--ui-button-h-nav)] items-center justify-center
                 rounded-full border border-border bg-background text-foreground
                 transition-colors duration-[var(--ui-dur-fast)] ease-[var(--ui-ease)]
                 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {children}
    </button>
  );
}
