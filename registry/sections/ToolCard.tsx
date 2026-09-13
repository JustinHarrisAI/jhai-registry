import type { CSSProperties, ReactNode } from 'react';

/**
 * ToolCard — hairline card on white: icon, 19px title, description, mono CTA.
 *
 * Converted from `extracted/components/cards/ToolCard.jsx`.
 * The icon is a 22px Lucide SVG with stroke `var(--accent)`; the arrow is
 * appended to the CTA automatically so the label stays a plain lowercase verb.
 *
 * Lane W1-0, 2026-08-11 (D-24): reauthored on Tailwind utilities. The card carries no
 * status mark and no internal hairline, so it gains no primitive — the border IS the
 * card's own edge, and `.v2-cards--hairline a:hover` in v2-motion.css is what weights it
 * on hover.
 *
 * The CTA stays the LAST CHILD of the anchor. `.v2-cards a > :last-child` is what slides
 * it 4px on hover, so nothing may be appended after it.
 *
 * `no-underline` is load-bearing: globals.css `@layer base` underlines every `<a>`.
 */

export interface ToolCardProps {
  href?: string;
  /** a 22px Lucide SVG element, stroke var(--accent) */
  icon?: ReactNode;
  title: string;
  description: string;
  /** lowercase mono CTA, arrow added automatically */
  cta?: string;
  style?: CSSProperties;
}

export function ToolCard({
  href = '#',
  icon,
  title,
  description,
  cta = 'learn more',
  style,
}: ToolCardProps) {
  return (
    <a
      href={href}
      className="flex flex-col rounded-(--radius-card) border border-line-light bg-paper-0 p-8 no-underline"
      /* Caller-supplied CSS. Arbitrary runtime values from the call site, and the last
         word over the utilities, exactly as the object spread it replaces was. */
      style={style}
    >
      {icon}
      <h3 className="mt-5 mb-0 font-sans text-type-card-title [font-weight:var(--weight-heading)] tracking-[-0.015em] text-text-heading">
        {title}
      </h3>
      <p className="mt-2.5 mb-0 flex-1 font-sans text-[14px] leading-[1.6] text-text-secondary">
        {description}
      </p>
      <span className="mt-5.5 font-mono text-type-eyebrow tracking-[0.2em] text-bjarmi-ink uppercase">
        {cta} →
      </span>
    </a>
  );
}
