import { Plus } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';

/**
 * FAQItem — a native <details> disclosure on a top hairline.
 *
 * Converted from `extracted/components/page/FAQItem.jsx`.
 * Native <details> on purpose: it opens with JavaScript disabled, it is
 * keyboard operable for free, and its content is findable by in-page search.
 * No client component, no state.
 *
 * THE ONE DOCUMENTED EXCEPTION TO "no interactive component is hand-rolled"
 * (D-24, roster section 5). This is NOT a candidate for `@/components/ui/accordion`
 * and never will be. A shadcn accordion would have to re-earn all three of the
 * properties above, and on a marketing page read by a stranger and by a crawler
 * that is a straight downgrade. If you came here to "fix" this, the reason you
 * were looking for is this paragraph.
 *
 * Lane W1-0, 2026-08-11: inline styles became Tailwind utilities. The mechanics —
 * <details>, <summary>, the `open` attribute — are untouched.
 *
 * PRIOR RESEARCH ON FILE, OPENED AND SCOPED OUT. The research gate matches this file on
 * "disabled", which occurs here only in the sentence "it opens with JavaScript disabled". It
 * names `builds/valhalla/docs/specs/CRON-DISABLED-AUDIT-2026-05-30.md`, an audit of DISABLED
 * CRON ROUTINES in Valhalla, a different build with no relationship to a disclosure widget on
 * the marketing site. The cross-client WebVegas match is excluded outright as a source by
 * D-02.
 */

export interface FAQItemProps {
  question: string;
  /** the plain-English answer */
  children: ReactNode;
  open?: boolean;
  style?: CSSProperties;
}

export function FAQItem({ question, children, open = false, style }: FAQItemProps) {
  return (
    /* `style` is the caller's own override and is computed at their call site, not here —
       Questions.tsx closes the last row of the stack with a bottom hairline through it. */
    <details open={open} className="border-t border-line-light" style={style}>
      {/* `[&::-webkit-details-marker]:hidden` kills Safari's own disclosure triangle, which
          `list-none` alone does not reach. */}
      <summary className="group/faq flex list-none cursor-pointer items-center justify-between gap-6 py-[22px] font-sans text-type-lede [font-weight:var(--weight-heading)] tracking-[-0.01em] text-text-heading [&::-webkit-details-marker]:hidden">
        {question}
        {/* The marker was a mono "+" glyph. It is lucide's Plus now, rotated 45 degrees into a
            close cross when the row is open: the same affordance, drawn properly, at the same
            stroke weight as every other glyph on the page. The rotate transitions under
            `motion-safe` only, so reduced motion still gets the state change without the
            movement. Part of the 2026-08-13 iconography pass. */}
        <Plus
          size={18}
          strokeWidth={1.5}
          aria-hidden="true"
          className="flex-none text-ink-400 motion-safe:transition-transform motion-safe:duration-200 group-open/faq:rotate-45"
        />
      </summary>
      <div className="max-w-[640px] pb-6 font-sans text-type-body leading-[1.65] text-text-body">
        {children}
      </div>
    </details>
  );
}
