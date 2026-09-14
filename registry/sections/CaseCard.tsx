import type { CSSProperties, ReactNode } from 'react';
import { ImageSlot } from './ImageSlot';
import { Badge } from '@/components/ui/badge';

/**
 * CaseCard — ghost-border case card: image plate, mono tag, 21px title,
 * one sparkline stat, quiet CTA.
 *
 * Converted from `extracted/components/cards/CaseCard.jsx`.
 * Use in horizontal carousels (400px fixed) or grids. One stat max —
 * the case page carries the rest.
 *
 * Reauthored on Tailwind utilities, and the mono category
 * mark re-seated on the shadcn `badge`. The badge arrives with a chip's own chrome — a
 * 20px height, a 2rem radius, a fill and 8px of padding — and this mark has never had
 * any of that, so the chrome is switched off rather than the recipe changed. What is
 * left is the mono eyebrow recipe the export draws: 9.5px, 0.24em, uppercase, ink-500.
 *
 * The CTA stays the LAST CHILD of the anchor. `.v2-cards a > :last-child` in
 * v2-motion.css is what slides it 4px on hover, so nothing may be appended after it.
 *
 * `no-underline` is load-bearing: globals.css `@layer base` underlines every `<a>`.
 */

export interface CaseCardProps {
  href?: string;
  /** mono tag, e.g. "jhai · ai system" */
  tag: string;
  title: ReactNode;
  /** one headline stat, e.g. "↑ 12× content output" */
  stat?: string;
  /** show the hairline sparkline beside the stat */
  statSpark?: boolean;
  cta?: string;
  /** image URL; empty renders the grey plate for a drop-in */
  image?: string;
  /** empty-state caption on the plate */
  imagePlaceholder?: string;
  /** fixed width in carousels, e.g. "400px" */
  width?: string;
  style?: CSSProperties;
}

export function CaseCard({
  href = '#',
  tag,
  title,
  stat,
  statSpark = true,
  cta = 'Read the build →',
  image,
  imagePlaceholder,
  width,
  style,
}: CaseCardProps) {
  return (
    <a
      href={href}
      className="block box-border rounded-(--radius-card) border border-line-light-soft bg-transparent p-5 no-underline"
      /* Both survivors are runtime values. `width` is a per-call-site track width the
         carousel sets ("400px") and has no fixed step to name; the caller's `style` is
         arbitrary CSS and keeps the last word it had under the object spread. */
      style={{ width, ...style }}
    >
      <ImageSlot src={image} placeholder={imagePlaceholder} ratio="16/10" contrast />
      <Badge className="mt-5 h-auto overflow-visible rounded-none border-0 bg-transparent p-0 font-mono text-type-eyebrow font-normal tracking-[0.24em] whitespace-normal text-ink-500 uppercase">
        {tag}
      </Badge>
      <h3 className="mt-2.5 mb-0 font-sans text-type-card-title-lg leading-[1.25] [font-weight:var(--weight-heading)] tracking-[-0.015em] text-text-heading">
        {title}
      </h3>
      {stat ? (
        <div className="mt-4 flex items-center gap-3">
          {statSpark ? (
            /* A sparkline is a data mark, not iconography — lucide has no equivalent and
               a `trending-up` glyph would redraw the shape. Kept verbatim from the export,
               logged in qa/w1-0/deltas/cards.md. */
            <svg width="56" height="18" viewBox="0 0 56 18" fill="none" aria-hidden="true">
              <path
                d="M1 15 L12 13 L22 14 L32 9 L42 7 L55 2"
                className="stroke-bjarmi-glow"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : null}
          <span className="font-sans text-[15px] [font-weight:var(--weight-heading)] text-text-heading">{stat}</span>
        </div>
      ) : null}
      <div className="mt-4 font-sans text-type-caption text-bjarmi-ink">{cta}</div>
    </a>
  );
}
