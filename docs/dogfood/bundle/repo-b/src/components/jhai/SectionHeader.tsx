import type { CSSProperties, ReactNode } from 'react';
import { Eyebrow } from './Eyebrow';

/**
 * SectionHeader — eyebrow, heading, optional right-aligned side note.
 *
 * Converted from `extracted/components/core/SectionHeader.jsx`.
 * Heading weight is ALWAYS 500. One eyebrow gap, everywhere.
 * `title` may carry an <em> for the italic voice.
 *
 * Lane W1-0, 2026-08-11 (D-24): reauthored off inline styles onto utilities. The row gap is
 * a fixed 48px in the export, so it is `gap-12` and NOT `gap-gap-grid` — `--gap-grid` steps
 * down to 32px under 760px and would move this header on a phone.
 */

export type SectionHeaderScale = 'section' | 'feature' | 'display';
export type SectionHeaderGround = 'light' | 'dark';

export interface SectionHeaderProps {
  /** eyebrow number, e.g. "05" */
  number?: string;
  /** eyebrow text, lowercase */
  label: string;
  /** heading — may include <em> for the italic voice */
  title: ReactNode;
  /** optional right-aligned side note (340px measure) */
  side?: ReactNode;
  /** heading scale: section 40-52 · feature 44-60 · display 56-96 */
  scale?: SectionHeaderScale;
  ground?: SectionHeaderGround;
  style?: CSSProperties;
}

/**
 * Size, leading and tracking travel together — one scale is one typographic setting, not
 * three parallel lookups. The three former SIZES / LINE_HEIGHTS / TRACKING records are the
 * same values, now as the utilities that carry them.
 */
const HEADING: Record<SectionHeaderScale, string> = {
  section: 'text-type-section leading-[1.06] tracking-[-0.035em]',
  feature: 'text-type-feature leading-[1.02] tracking-[-0.04em]',
  display: 'text-type-display leading-[0.98] tracking-[-0.045em]',
};

export function SectionHeader({
  number,
  label,
  title,
  side,
  scale = 'section',
  ground = 'light',
  style,
}: SectionHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-12" style={style}>
      <div>
        <Eyebrow number={number} ground={ground}>
          {label}
        </Eyebrow>
        <h2
          className={`mt-eyebrow-gap mr-0 mb-0 ml-0 max-w-[620px] font-sans [font-weight:var(--weight-heading)] ${
            HEADING[scale]
          } ${ground === 'dark' ? 'text-dark-text-1' : 'text-text-heading'}`}
        >
          {title}
        </h2>
      </div>
      {side ? (
        <p
          className={`m-0 max-w-measure-side font-sans text-[15px] leading-[1.6] ${
            ground === 'dark' ? 'text-dark-text-3' : 'text-text-secondary'
          }`}
        >
          {side}
        </p>
      ) : null}
    </div>
  );
}
