/**
 * The client logo wall, pinned at the fold.
 *
 * CEO Round 3 item 4: the wall left a comp once and the correction is standing. It sits
 * immediately under the hero, before any argument, because UFC, Caesars and the City of
 * Las Vegas are the fastest proof on the page. Grayscale at 60% so it reads as evidence
 * rather than decoration, and duplicated once so the marquee loop has no seam.
 */

import type { LogoEntry } from './content-types';

function Row({ logos, hidden = false }: { logos: LogoEntry[]; hidden?: boolean }) {
  return (
    <div
      aria-hidden={hidden || undefined}
      className="flex flex-none items-center gap-[clamp(48px,5vw,88px)] pr-[clamp(48px,5vw,88px)]"
    >
      {logos.map((logo) => (
        <div
          key={logo.src + (hidden ? '-b' : '')}
          className="flex h-[72px] flex-none items-center justify-center"
        >
          <img
            src={logo.src}
            alt={hidden ? '' : logo.alt}
            className="max-h-[52px] w-auto max-w-[150px] opacity-60 grayscale"
          />
        </div>
      ))}
    </div>
  );
}

export function LogoWall({ logos, label }: { logos: LogoEntry[]; label: string }) {
  return (
    <section
      id="clients"
      data-screen-label="Logo wall"
      className="scroll-mt-[120px] bg-paper-50 pt-10 pb-0"
    >
      {/* The export prints no label here. The heading exists for the document outline
          and for a screen reader, and is clipped so the band still reads as one silent
          strip of evidence under the hero. `sr-only` IS that clip, declaration for
          declaration, so the hand-written one is gone. */}
      <h2 className="sr-only">
        {/* The names as TEXT, not only img alt: the rendered-content gate (required-content.json
            pedigree-wall) reads page text with tags stripped, and a screen-reader outline
            benefits from the roster too. Clipped like the heading; nothing visual changes. */}
        {label}: {logos.map((logo) => logo.alt).join(', ')}
      </h2>
      {/* The marquee stays a CSS marquee, never a carousel: it moves on its own forever and
          carries its own duration, hover/focus pause and reduced-motion stop in HomeStyles. */}
      {/* `tabIndex={0}` because this rail becomes horizontally scrollable under reduced
          motion (`shell.tsx` sets `.v2-rail { overflow-x: auto }`), and a scrollable region a
          keyboard cannot reach is an axe `scrollable-region-focusable` failure — 8 nodes
          across the four interior routes. Its two sibling rails already solved it the same
          way: `ReviewRail.tsx` and `templates/service/parts.tsx`. Added 2026-08-14. Visual
          output is unchanged; this adds a focus stop and nothing else. */}
      <div className="v2-rail overflow-hidden" tabIndex={0}>
        <div className="v2-marquee">
          <Row logos={logos} />
          <Row logos={logos} hidden />
        </div>
      </div>
    </section>
  );
}
