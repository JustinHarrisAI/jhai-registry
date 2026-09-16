import type { CSSProperties } from 'react';
import { Info, OctagonAlert, TriangleAlert } from 'lucide-react';

/**
 * SeverityMark — how bad a thing is, readable before the words are.
 *
 * WHY THREE SIGNALS FOR ONE VALUE, AND WHY THAT IS NOT BELT AND BRACES
 *
 * Colour alone fails. A severity ramp runs hot to cool, which in practice means
 * red through amber, and that is precisely the axis a red-green deficiency
 * removes. Roughly eight per cent of men cannot rank this ramp by hue.
 *
 * Shape fixes it. An octagon, a triangle and a circle are distinguishable with
 * no colour at all, and they are the three shapes road signage has used for a
 * century, so the ranking is legible without a key.
 *
 * The word is the third signal, for a screen reader and for a monochrome print.
 * Any one of the three can be lost and the severity still arrives.
 *
 * The icons are Lucide and they are drawn, never set as text glyphs. A
 * character renders in whatever font the platform substitutes and sits on the
 * text baseline instead of the row's optical centre.
 *
 * COLOUR COMES FROM THE PROJECT, NOT FROM HERE
 *
 * Each level reads `--ui-severity-N` and falls back to a semantic token the
 * shadcn base always defines, which is the same indirection `@jhai/chart` uses
 * for its series. A project that defines the three tokens gets its own ramp for
 * free; a project that defines none still gets a readable, on-brand mark.
 *
 * The lowest level deliberately does not fall back to a grey. Grey almost
 * always means "not applicable" or "not measured" elsewhere on the same page,
 * and a low-severity finding is a real finding about a real problem. Merging
 * those two states is worse than an imperfect hue.
 */

export type SeverityLevel = 'high' | 'medium' | 'low';

interface LevelSpec {
  color: string;
  tint: string;
  Icon: typeof OctagonAlert;
}

/**
 * Exported because anything tinting itself to match a severity, a ratio bar or
 * a row highlight, has to read the same map. Two hardcoded lists is how a
 * medium becomes two different ambers on one page.
 */
export const SEVERITY: Record<SeverityLevel, LevelSpec> = {
  high: {
    color: 'var(--ui-severity-high, var(--destructive))',
    tint: 'color-mix(in oklab, var(--ui-severity-high, var(--destructive)) 10%, transparent)',
    Icon: OctagonAlert,
  },
  medium: {
    color: 'var(--ui-severity-medium, var(--ring))',
    tint: 'color-mix(in oklab, var(--ui-severity-medium, var(--ring)) 10%, transparent)',
    Icon: TriangleAlert,
  },
  low: {
    color: 'var(--ui-severity-low, var(--primary))',
    tint: 'color-mix(in oklab, var(--ui-severity-low, var(--primary)) 10%, transparent)',
    Icon: Info,
  },
};

export interface SeverityMarkProps {
  level: SeverityLevel;
  /**
   * The words. Pass the vocabulary the rest of the product already uses, e.g.
   * "P0 · Critical" or "Blocker". Required, because the mark is not allowed to
   * rely on colour and shape alone.
   */
  label: string;
  className?: string;
  style?: CSSProperties;
}

export function SeverityMark({ level, label, className, style }: SeverityMarkProps) {
  const spec = SEVERITY[level] ?? SEVERITY.low;
  const { Icon } = spec;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-ui-eyebrow tracking-[0.24em] uppercase whitespace-nowrap ${
        className ?? ''
      }`}
      style={{ color: spec.color, ...style }}
    >
      <Icon size={13} strokeWidth={1.75} aria-hidden />
      {label}
    </span>
  );
}
