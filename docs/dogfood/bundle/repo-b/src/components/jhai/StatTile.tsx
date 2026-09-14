import type { CSSProperties } from 'react';

/**
 * StatTile — one big tabular number with a mono caption and a left hairline.
 *
 * Converted from `extracted/components/core/StatTile.jsx`.
 * Skip the divider on the first tile of a row.
 *
 * Lane W1-0, 2026-08-11 (D-24): reauthored off inline styles onto utilities. The caption is
 * the mono eyebrow recipe, so its 9.5px reads through `text-type-eyebrow` rather than as a
 * literal. The light-ground rule is `rgba(0,0,0,0.08)` in the export and has no token; it
 * becomes its exact Tailwind equivalent, `black/8`.
 */

export type StatTileGround = 'light' | 'dark';

export interface StatTileProps {
  /** the number, e.g. "$50M+" — keep it short, tabular */
  value: string;
  /** lowercase mono caption */
  label: string;
  /** hairline on the left (skip for the first tile) */
  divider?: boolean;
  ground?: StatTileGround;
  style?: CSSProperties;
}

export function StatTile({ value, label, divider = true, ground = 'light', style }: StatTileProps) {
  const rule = ground === 'dark' ? 'border-line-dark-soft' : 'border-black/8';

  return (
    <div className={`px-8 ${divider ? `border-l ${rule}` : ''}`} style={style}>
      <div
        className={`font-sans text-[clamp(64px,6.5vw,96px)] leading-none [font-weight:var(--weight-heading)] tracking-[-0.04em] tabular-nums ${
          ground === 'dark' ? 'text-dark-text-1' : 'text-text-heading'
        }`}
      >
        {value}
      </div>
      <div className="mt-3.5 font-mono text-type-eyebrow tracking-[0.24em] text-ink-500 uppercase">
        {label}
      </div>
    </div>
  );
}
