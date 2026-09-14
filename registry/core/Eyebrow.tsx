import type { CSSProperties, ReactNode } from 'react';

/**
 * Eyebrow — the one mono label recipe: 9.5px, 0.24em tracking, uppercase.
 *
 * Converted from the Claude Design export, `extracted/components/core/Eyebrow.jsx`.
 * Dark grounds render in the accent. Never restyle this recipe per section.
 *
 * Reauthored off inline styles onto utilities. The recipe is
 * unchanged — `text-ui-eyebrow` IS `--type-eyebrow`, projected. The accent is `text-primary`, which is what shadcn calls a brand colour. Note it is NOT
 * `--accent`: shadcn uses that name for a muted interactive surface, and the two mean opposite
 * things.
 */

export type EyebrowGround = 'light' | 'dark';

export interface EyebrowProps {
  /** section number, e.g. "04" — omit for unnumbered labels */
  number?: string;
  /** dark grounds render in the accent */
  ground?: EyebrowGround;
  /** force accent on light ground */
  accent?: boolean;
  children: ReactNode;
  style?: CSSProperties;
}

export function Eyebrow({ number, children, ground = 'light', accent = false, style }: EyebrowProps) {
  /*
   * `ground` no longer selects a colour. A dark band opens a nested `.dark` scope (see
   * shell.tsx), so the accent already resolves to its dark-side value inside one. What
   * survives is the real distinction: an eyebrow is muted by default and takes the accent
   * only when asked. On a dark band that used to be automatic; it is now explicit, which is
   * the honest API — the prop is kept for source compatibility and no longer paints.
   */
  const tone = accent || ground === 'dark' ? 'text-primary' : 'text-muted-foreground';

  return (
    <span
      className={`font-mono text-ui-eyebrow tracking-[0.24em] uppercase ${tone}`}
      style={style}
    >
      {number ? number + ' · ' : ''}
      {children}
    </span>
  );
}
