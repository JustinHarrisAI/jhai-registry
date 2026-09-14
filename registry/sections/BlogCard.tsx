import type { CSSProperties } from 'react';
import { ImageSlot } from './ImageSlot';

/**
 * BlogCard — top-hairline article card: plate, mono date, 21px title, mono read link.
 *
 * Converted from `extracted/components/cards/BlogCard.jsx`.
 * The date is lowercase mono, e.g. "jul 17, 2026".
 *
 * Reauthored on Tailwind utilities. Every value below is
 * the same value the inline styles carried; token-backed steps read the token utility
 * (`text-type-card-title-lg`, `text-type-eyebrow`, `border-line-light`) and the handful
 * with no token read the numeric scale, the way `ui/button.tsx` does with `px-7`.
 *
 * The top rule stays a BORDER rather than becoming a `separator`. It is the card's own
 * top edge, not a hairline between two things inside it, and a separator element inside
 * the anchor would sit under the padding rather than above it.
 *
 * `no-underline` is load-bearing: globals.css `@layer base` underlines every `<a>`, which
 * the removed `textDecoration: 'none'` used to suppress.
 */

export interface BlogCardProps {
  href?: string;
  /** lowercase mono date, e.g. "jul 17, 2026" */
  date: string;
  title: string;
  image?: string;
  /** empty-state caption on the plate */
  imagePlaceholder?: string;
  style?: CSSProperties;
}

export function BlogCard({ href = '#', date, title, image, imagePlaceholder, style }: BlogCardProps) {
  return (
    <a
      href={href}
      /* `[&>div]:mb-5` is the plate's 20px bottom gap. ImageSlot's public API takes a
         `style` and no `className`, and it is another agent's file, so the gap is set from
         its parent instead of pushed through as inline CSS. Its root div is the only div
         child of this anchor. */
      className="block border-t border-line-light pt-5.5 no-underline [&>div]:mb-5"
      /* Caller-supplied CSS. Arbitrary runtime values from the call site, and the last
         word over the utilities, exactly as the object spread it replaces was. */
      style={style}
    >
      <ImageSlot src={image} placeholder={imagePlaceholder} ratio="16/10" />
      <span className="font-mono text-type-micro tracking-[0.2em] text-ink-400 uppercase">
        {date}
      </span>
      <h3 className="mt-3.5 mb-0 font-sans text-type-card-title-lg leading-[1.3] [font-weight:var(--weight-heading)] tracking-[-0.015em] text-text-heading">
        {title}
      </h3>
      <span className="mt-4 inline-block font-mono text-type-eyebrow tracking-[0.2em] text-bjarmi-ink uppercase">
        read →
      </span>
    </a>
  );
}
