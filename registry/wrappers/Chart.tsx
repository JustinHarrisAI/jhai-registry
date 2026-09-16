'use client';

import type { ReactElement } from 'react';
import { ResponsiveContainer } from 'recharts';

/**
 * Chart — the one place Recharts is allowed to know what colour anything is.
 *
 * WHY THIS WRAPPER EXISTS
 * Recharts takes colour as literal string props on its own elements: `fill`, `stroke`, `dot`.
 * It does not read CSS custom properties on its own, so a chart written the obvious way bakes
 * a hex into the page and stops following the client's palette. That is the one thing this
 * registry exists to prevent.
 *
 * The fix is a CSS variable indirection. This container declares `--series-1` … `--series-6`
 * from the project's own chart tokens, and every child chart references `var(--series-N)`
 * rather than a colour. Swapping the client's palette moves the whole chart, because the value
 * the chart reads was never a colour in the first place — it was a pointer to one.
 *
 * WHAT THIS DELIBERATELY DOES NOT DO
 * It does not wrap the chart types. `LineChart`, `BarChart` and `AreaChart` stay Recharts
 * components composed by the caller, because an abstraction over them would have to grow a prop
 * for every Recharts prop and would be worse than the library it hid. This is a colour bridge
 * and a sizing container, nothing else.
 */

export interface ChartProps {
  /** A Recharts chart tree. Reference colours as `var(--series-1)` … `var(--series-6)`. */
  children: ReactElement;
  /** Container height. Recharts needs a definite height to measure against. */
  height?: number;
  /** Optional caption rendered under the plot in the mono eyebrow recipe. */
  caption?: string;
  className?: string;
}

/*
 * The series ramp is declared here rather than in the theme so that a project with no chart
 * tokens still gets a readable, on-brand chart: each entry falls back to a semantic token the
 * shadcn base always defines. A project that sets --chart-1..5 overrides the ramp for free.
 */
const SERIES: Record<string, string> = {
  '--series-1': 'var(--chart-1, var(--primary))',
  '--series-2': 'var(--chart-2, var(--secondary))',
  '--series-3': 'var(--chart-3, var(--accent))',
  '--series-4': 'var(--chart-4, var(--muted-foreground))',
  '--series-5': 'var(--chart-5, var(--destructive))',
  '--series-6': 'var(--foreground)',
  '--series-grid': 'var(--border)',
  '--series-axis': 'var(--muted-foreground)',
};

export function Chart({ children, height = 300, caption, className }: ChartProps) {
  return (
    <figure className={className} style={SERIES as React.CSSProperties}>
      <div className="w-full text-foreground" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
      {caption ? (
        <figcaption className="mt-3 text-ui-eyebrow uppercase tracking-[0.18em] text-muted-foreground">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
