import type { CSSProperties } from 'react';

/**
 * ScoreBar — one measured value on a fixed scale, with an optional reference
 * mark and a first-class unmeasured state.
 *
 * WHY THIS IS A REGISTRY ITEM AND NOT A CHART
 *
 * `@jhai/chart` wraps Recharts and is right when the shape of the series is not
 * known until runtime. This is the other case, and it is far more common: a
 * known set of rows, each a single number on the same fixed scale. That is a
 * layout problem, and routing it through a charting library costs three things
 * a server-rendered document cannot spare. A `use client` boundary across a
 * section that otherwise needs no JavaScript. A `ResponsiveContainer` that
 * measures its width in JavaScript and therefore has nothing to measure during
 * print layout. And an SVG that reflows unpredictably at 390px.
 *
 * A CSS width in percent renders on the server, survives print, and cannot be
 * wrong about its own width.
 *
 * THE UNMEASURED STATE IS THE WHOLE REASON THIS EXISTS
 *
 * Every bar component treats a missing value as zero, and for a score that is a
 * lie with consequences: it tells someone they failed a test that was never
 * run. `value={null}` draws a hueless hatch and renders whatever `emptyLabel`
 * says instead of a number. It is never a short bar, it never borrows from a
 * severity palette, and its contrast is deliberately held well below that of a
 * filled bar, because the moment the hatch reads as a fill it reads as a low
 * score.
 *
 * THE NUMBER IS ALWAYS TEXT
 *
 * The value renders as text beside the bar, always. A screen reader gets the
 * number rather than a described shape, and a printer that dropped the
 * background fills still produces a readable document.
 *
 * COLOUR
 *
 * The bar is foreground ink by default, because a bar that is brand-coloured
 * makes colour mean "this is a bar" rather than anything about the data. The
 * reference mark is the one accent, and it carries a 1px outline in the page
 * ground: measured against a dark filled bar a mid-tone accent lands near
 * 3:1, which is under what a non-text indicator needs, and the filled bar is
 * exactly where the mark falls on a high value.
 */

export interface ScoreBarProps {
  /** Row label, e.g. a category name. */
  label: string;
  /**
   * The measured value, or `null` when nothing was measured. `null` is not
   * zero and is never drawn as one.
   */
  value: number | null;
  /** Top of the scale. Values are clamped into it. */
  max?: number;
  /**
   * A second value on the same scale, drawn as a vertical rule across the
   * track. Use for an average, a target, or an overall score the rows roll up
   * into. Omit for a plain bar.
   */
  reference?: number;
  /** Shown in place of the number when `value` is null. */
  emptyLabel?: string;
  /** Sentence explaining why nothing was measured. Rendered under the label. */
  emptyNote?: string;
  className?: string;
  style?: CSSProperties;
}

/** Clamped so a malformed value cannot draw a bar off the end of its track. */
function share(value: number, max: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return 0;
  return Math.max(0, Math.min(100, (value / max) * 100));
}

/*
 * Browsers drop background fills when printing unless a rule asks them not to,
 * and this component's bars ARE background fills. The number beside each bar
 * makes that survivable rather than fatal, but there is no reason to lean on
 * the fallback when one property prevents the problem.
 */
const PRINT_FILL: CSSProperties = {
  printColorAdjust: 'exact',
  WebkitPrintColorAdjust: 'exact',
};

export function ScoreBar({
  label,
  value,
  max = 100,
  reference,
  emptyLabel = 'Not measured',
  emptyNote,
  className,
  style,
}: ScoreBarProps) {
  const measured = value !== null && value !== undefined && Number.isFinite(value);
  const fill = measured ? share(value as number, max) : 0;
  const mark =
    reference !== undefined && Number.isFinite(reference)
      ? share(reference, max)
      : null;

  return (
    <div className={className} style={style}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <span
          className={`font-sans text-ui-body ${
            measured ? 'text-foreground' : 'text-muted-foreground'
          }`}
        >
          {label}
        </span>
        {measured ? (
          <span className="font-sans text-ui-card-title [font-weight:var(--ui-weight-heading)] leading-none tabular-nums text-foreground">
            {value}
          </span>
        ) : (
          <span className="font-mono text-ui-eyebrow tracking-[0.24em] uppercase text-muted-foreground">
            {emptyLabel}
          </span>
        )}
      </div>

      {/*
       * The track does NOT clip its children. The fill clips itself so it keeps
       * the pill radius, while the reference mark deliberately extends past the
       * track and must not be cut back to it. Putting overflow:hidden here is
       * the obvious move and it silently undoes the mark's contrast treatment.
       */}
      <div
        className="relative mt-2.5 h-2.5 rounded-ui-pill bg-muted"
        aria-hidden
      >
        {measured ? (
          <div
            className="absolute inset-y-0 left-0 overflow-hidden rounded-ui-pill bg-foreground"
            style={{ ...PRINT_FILL, width: `${fill}%` }}
          />
        ) : (
          <div
            className="absolute inset-0 overflow-hidden rounded-ui-pill"
            style={{
              ...PRINT_FILL,
              /*
               * No hue, and low contrast on purpose. A hatch dark enough to
               * meet the 3:1 of a state indicator reads as a filled bar, which
               * is the exact misreading this state exists to prevent. The words
               * beside it clear AA on their own and are what carries the state.
               */
              backgroundImage:
                'repeating-linear-gradient(135deg, var(--ui-hatch, currentColor) 0 4px, transparent 4px 9px)',
              color: 'var(--border)',
            }}
          />
        )}

        {mark !== null && (
          <div
            className="absolute w-0.5 -ml-px bg-primary"
            style={{
              ...PRINT_FILL,
              insetBlock: -5,
              left: `${mark}%`,
              boxShadow: '0 0 0 1px var(--background)',
            }}
          />
        )}
      </div>

      {!measured && emptyNote ? (
        <p className="mt-2 max-w-ui-measure-lede font-sans text-ui-caption leading-relaxed text-muted-foreground">
          {emptyNote}
        </p>
      ) : null}
    </div>
  );
}
