import type { CSSProperties } from 'react';

/**
 * StatTile — one big tabular number with a mono caption and a left hairline.
 *
 * Converted from `extracted/components/core/StatTile.jsx`.
 * Skip the divider on the first tile of a row.
 *
 * Reauthored off inline styles onto utilities. The caption is
 * the mono eyebrow recipe, so its 9.5px reads through `text-ui-eyebrow` rather than as a
 * literal. The light-ground rule was `rgba(0,0,0,0.08)`, a literal with no token of its own. It
 * is `border-border` now, so it follows the consuming project's own hairline colour instead of
 * staying literal black on every site.
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

/*
 * `ground` is in the props type and is deliberately NOT destructured here.
 *
 * It used to select a hairline colour. `border-border` now follows the consuming project's
 * own palette and inverts inside a `.dark` scope on its own, so there is nothing left for the
 * prop to switch. It stays in the public signature for source compatibility — the same call
 * that worked before still type-checks — and Eyebrow carries the identical dead prop for the
 * identical reason. Reported by jhai-composer as an unused destructure; removing the binding
 * is the fix, removing the prop would be a breaking change for no gain.
 */
export function StatTile({ value, label, divider = true, style }: StatTileProps) {
  const rule = 'border-border';

  return (
    <div className={`px-8 ${divider ? `border-l ${rule}` : ''}`} style={style}>
      <div
        className={`font-sans text-[clamp(64px,6.5vw,96px)] leading-none [font-weight:var(--ui-weight-heading)] tracking-[-0.04em] tabular-nums ${
          'text-foreground'
        }`}
      >
        {value}
      </div>
      <div className="mt-3.5 font-mono text-ui-eyebrow tracking-[0.24em] text-muted-foreground uppercase">
        {label}
      </div>
    </div>
  );
}
