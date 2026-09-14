import type { CSSProperties, ReactNode } from 'react';

/**
 * Eyebrow — the one mono label recipe: 9.5px, 0.24em tracking, uppercase.
 *
 * Converted from the Claude Design export, `extracted/components/core/Eyebrow.jsx`.
 * Dark grounds render in bjarmi glow. Never restyle this recipe per section.
 *
 * Reauthored off inline styles onto utilities. The recipe is
 * unchanged — `text-type-eyebrow` IS `--type-eyebrow`, projected. The accent is reached by
 * the name it actually has (`text-bjarmi-glow` / `text-bjarmi-ink`) rather than through the
 * `--accent` alias, which shadcn already owns a colliding `--color-accent` for.
 */

export type EyebrowGround = 'light' | 'dark';

export interface EyebrowProps {
  /** section number, e.g. "04" — omit for unnumbered labels */
  number?: string;
  /** dark grounds render in bjarmi glow */
  ground?: EyebrowGround;
  /** force bjarmi on light ground */
  accent?: boolean;
  children: ReactNode;
  style?: CSSProperties;
}

export function Eyebrow({ number, children, ground = 'light', accent = false, style }: EyebrowProps) {
  const tone =
    ground === 'dark' ? 'text-bjarmi-glow' : accent ? 'text-bjarmi-ink' : 'text-text-eyebrow';

  return (
    <span
      className={`font-mono text-type-eyebrow tracking-[0.24em] uppercase ${tone}`}
      style={style}
    >
      {number ? number + ' · ' : ''}
      {children}
    </span>
  );
}
