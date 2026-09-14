/**
 * Shared shell for the homepage sections: the 1280 container, the ground grammar, and the
 * one stylesheet the page's marquees and responsive collapses read from.
 *
 * The design export renders at desktop width only, so every grid in it is a fixed column
 * count with no breakpoint. Those collapses are added here rather than in each section, so
 * one rule governs how the page folds and a section file stays declarative.
 *
 * Motion is CSS-only. The export drives its reveals, counters and parallax from a script;
 * a server component cannot, and the reveal end-state is what the page should show anyway.
 * The marquees are real keyframes, and every one of them stops under reduced motion.
 *
 * `Container`, `Section` and `Grain` paint from Tailwind
 * utilities now. `HomeStyles` STAYS a stylesheet: it carries the @keyframes, the four
 * marquee durations, the reverse direction, the hover and focus-within pause, the
 * reduced-motion stop, the `.v2-grid-*` collapses and the `.v2-home a:focus-visible` rule.
 * Tailwind cannot express a keyframe, and scattering the marquee across six components'
 * arbitrary values is worse than one named sheet (house convention).
 *
 * `.v2-container` and `.v2-section` keep their rules in that sheet as well, because
 * `page/ProofDeck.tsx` and the longform and work TEMPLATES apply those class names to raw
 * elements that never pass through this file. The classes are the contract; the utilities
 * on these components restate the same values so a reader of the component can see them.
 * Both are unlayered, so where a section needs to override the sheet's own padding it does
 * it with an important utility — the exact job the inline style used to do.
 */

import type { CSSProperties, ReactNode } from 'react';

export type Ground = 'paper' | 'white' | 'ink';

const GROUNDS: Record<Ground, string> = {
  paper: 'bg-paper-50',
  white: 'bg-paper-0',
  ink: 'bg-ink-950',
};

export function Container({
  children,
  style,
  className,
}: {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <div
      className={['v2-container', 'mx-auto box-border max-w-container px-gutter', className]
        .filter(Boolean)
        .join(' ')}
      /* caller-computed override, passed straight through — twelve section files use it */
      style={style}
    >
      {children}
    </div>
  );
}

export function Section({
  id,
  label,
  ground = 'paper',
  children,
  style,
  className,
}: {
  id?: string;
  /** the export's data-screen-label, kept so a screenshot diff can name the band */
  label?: string;
  ground?: Ground;
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <section
      id={id}
      data-screen-label={label}
      className={[
        'v2-section',
        GROUNDS[ground],
        /* the header offset, by its token: 120px, stepping to 96px with the mobile gutter */
        'scroll-mt-header-offset',
        'py-section-y',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      /* caller-computed override, passed straight through — twelve section files use it */
      style={style}
    >
      {children}
    </section>
  );
}

/**
 * Grain, the one texture in the system. Sits over an ink ground, never over paper.
 *
 * REGISTRY NOTE: the texture comes from --jh-grain, which this file does not define, because
 * the SVG is a project asset rather than a registry file. Set it where you set your palette:
 *   :root { --jh-grain: url('/assets/grain.svg'); }
 * Unset, Grain renders nothing and the layout is unaffected.
 */
export function Grain() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 bg-(image:--jh-grain) bg-repeat opacity-5 mix-blend-overlay [background-size:180px_180px]"
    />
  );
}

/**
 * One stylesheet for the whole page. React 19 dedupes it by href, so it is safe for any
 * section to render it, and the page renders it once at the top.
 */
export function HomeStyles() {
  return (
    <style href="v2-home" precedence="default">{`
      .v2-container {
        max-width: var(--container, 1280px);
        margin: 0 auto;
        padding: 0 var(--gutter, 48px);
        box-sizing: border-box;
      }
      .v2-section { padding: var(--section-y, 150px) 0; }

      @keyframes v2RailScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      @keyframes v2RailScrollR { from { transform: translateX(-50%); } to { transform: translateX(0); } }
      @keyframes v2Breathe {
        0%, 100% { opacity: 0.45; transform: scale(0.9); }
        50% { opacity: 1; transform: scale(1.15); }
      }
      .v2-marquee { display: flex; width: max-content; animation: v2RailScroll 70s linear infinite; }
      .v2-marquee--slow { animation-duration: 150s; }
      .v2-marquee--ticker { animation-duration: 52s; }
      .v2-marquee--reverse { animation-name: v2RailScrollR; animation-duration: 55s; }
      .v2-rail:hover .v2-marquee, .v2-rail:focus-within .v2-marquee { animation-play-state: paused; }
      .v2-pip { animation: v2Breathe 3.2s cubic-bezier(0.4,0,0.4,1) infinite; }

      .v2-link { text-decoration: none; transition: color var(--dur-fast) var(--ease); }
      .v2-underline {
        text-decoration: underline;
        text-underline-offset: 0.3em;
        text-decoration-thickness: 1px;
      }
      .v2-card-h { transition: border-color var(--dur-med) var(--ease); }
      .v2-card-h:hover { border-color: color-mix(in srgb, var(--ink-800) 18%, transparent); }
      .v2-svc:hover h3 { color: var(--accent); }
      .v2-home a:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 3px;
        border-radius: 4px;
      }

      .v2-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); }
      .v2-grid-5 { display: grid; grid-template-columns: repeat(5, 1fr); }
      .v2-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); }
      .v2-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); }

      @media (max-width: 1200px) { .v2-index-rail { display: none !important; } }
      @media (max-width: 1024px) {
        .v2-grid-4 { grid-template-columns: repeat(2, 1fr); }
        .v2-grid-5 { grid-template-columns: repeat(3, 1fr); }
        .v2-grid-3 { grid-template-columns: repeat(2, 1fr); }
        .v2-split { grid-template-columns: 1fr !important; }
        .v2-split-media { justify-self: start !important; max-width: 420px !important; }
      }
      @media (max-width: 760px) {
        .v2-section { padding: 96px 0; }
        .v2-container { padding: 0 24px; }
        .v2-grid-4, .v2-grid-5, .v2-grid-3, .v2-grid-2 { grid-template-columns: 1fr; }
        .v2-stack-sm { flex-direction: column !important; align-items: flex-start !important; }
        .v2-record-tile { padding: 0 !important; border-left: none !important; }
      }

      @media (prefers-reduced-motion: reduce) {
        .v2-marquee { animation: none !important; }
        .v2-pip { animation: none !important; opacity: 1; }
        .v2-rail { overflow-x: auto; }
      }
    `}</style>
  );
}
