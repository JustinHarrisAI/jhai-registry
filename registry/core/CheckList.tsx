import { Check, X } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';

/**
 * CheckList — the inclusion / pain list.
 *
 * Converted from `extracted/components/core/CheckList.jsx`.
 * check = bjarmi tick for answers and inclusions.
 * cross = grey cross for pains. Never a red cross, never a colored fill.
 *
 * Lane W1-0, 2026-08-11 (D-24): reauthored off inline styles onto utilities. Every value is
 * the one the export carried; 15.5px, 14px, 11px and the 11px row gap have no token of their
 * own and stay as the literals the export declared.
 *
 * 2026-08-13: THE MARKS ARE LUCIDE NOW, not the "✓" and "✕" text characters the export used.
 * Two reasons, and the second is the one that matters. A text glyph renders in whatever font
 * the platform substitutes for it, so the tick was a different shape on Windows than on macOS
 * and sat on the text baseline rather than on the row's optical centre. And it is not
 * iconography: roster section 1 makes lucide the icon set, and the CEO's 2026-08-13 note —
 * "for some reason you refuse to use iconography or imagery through the site" — is exactly
 * this pattern, a drawing rendered as a character to avoid drawing it. Colour, size and the
 * 11px row gap are unchanged, so the light and dark grounds read as they did.
 *
 * This component is shared with the approved homepage (`Engage`'s tier lists and `Answer`),
 * so the marks upgrade there in the same commit. That is intended: the homepage was carrying
 * the same substituted character.
 */

export type CheckListMark = 'check' | 'cross';
export type CheckListGround = 'light' | 'dark';
export type CheckListSize = 'md' | 'lg';

export interface CheckListProps {
  items: ReactNode[];
  /** check = bjarmi tick (answers/inclusions) · cross = grey cross (pains) */
  mark?: CheckListMark;
  ground?: CheckListGround;
  size?: CheckListSize;
  style?: CSSProperties;
}

export function CheckList({
  items,
  mark = 'check',
  ground = 'light',
  size = 'md',
  style,
}: CheckListProps) {
  const Glyph = mark === 'check' ? Check : X;
  const markTone =
    mark === 'check'
      ? ground === 'dark'
        ? 'text-bjarmi-glow'
        : 'text-bjarmi-ink'
      : ground === 'dark'
        ? 'text-ink-400'
        : 'text-ink-300';

  return (
    <div className="flex flex-col gap-[11px]" style={style}>
      {items.map((item, i) => (
        <div
          key={i}
          /* `items-start` with a nudged mark, not `items-baseline`: an SVG has no baseline, so
             baseline alignment would hang it off the bottom of a wrapping row. The 0.2em top
             margin puts it on the first line's optical centre and keeps it there when the row
             wraps to three lines. */
          className={`flex items-start gap-2.5 font-sans ${
            size === 'lg' ? 'text-[15.5px]' : 'text-[14px]'
          } ${ground === 'dark' ? 'text-dark-text-2' : 'text-text-body'}`}
        >
          <Glyph
            size={size === 'lg' ? 15 : 14}
            strokeWidth={2}
            aria-hidden="true"
            className={`mt-[0.2em] flex-none ${markTone}`}
          />
          {item}
        </div>
      ))}
    </div>
  );
}
