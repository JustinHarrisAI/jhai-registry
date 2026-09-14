import type { CSSProperties, ReactNode } from 'react';
import { Button } from './Button';

/**
 * CTABand — the dark close. Statement left, grader field right.
 *
 * Converted from `extracted/components/page/CTABand.jsx`.
 * House rule: one dark CTA moment between hero and close, and every page
 * ends with the grader ask.
 *
 * The export pinned a two-column grid. Production uses a wrapping flex row with
 * the same 48px gap so the band stacks on narrow viewports instead of crushing
 * the field. Desktop rendering is identical.
 *
 * Inline styles became Tailwind utilities.
 *
 * REGISTRY NOTE — this differs from the jhai-new-website original. There, the right-hand
 * slot renders GraderField, the JHAI audit-email capture. That form is JHAI's own funnel, not
 * reusable UI, so it stays project code and the slot is a `field` render prop here. Pass your
 * own capture component, or pass `link` for the click ask and skip the form entirely. With
 * neither, the band renders statement-only, which is a legitimate third shape.
 */

export interface CTABandProps {
  title?: ReactNode;
  subline?: ReactNode;
  /**
   * The right-hand capture slot. In jhai-new-website this is GraderField, the audit-email
   * form. It is a render prop rather than an import because a capture form belongs to the
   * project's funnel, not to a shared component.
   */
  field?: ReactNode;
  /**
   * ADDED 2026-08-13, DECISIONS.md D7. When present the band asks for a CLICK instead of an
   * address, and the `field` slot is not rendered at all.
   *
   * Why it exists: the house rule at the top of this file is "every page ends with the grader
   * ask", and exactly one page type is carved out of it. A reader who has just finished a
   * whole case study is ready for the conversation, not for a free tool, so the case study's
   * mid-page band asks for the call. Every other caller passes nothing and is unchanged.
   */
  link?: { label: string; href: string };
  style?: CSSProperties;
}

export function CTABand({
  title = 'See what this would find on your website.',
  subline = 'Free, in minutes. Same-day reply from Justin, personally.',
  field,
  link,
  style,
}: CTABandProps) {
  return (
    /* `style` is the caller's own override, computed at their call site rather than here. */
    <div
      /*
       * `dark` makes the dark close actually dark, and that ground IS part of this component's
       * contract — the file header calls it "the dark close" and the system's grammar gives
       * exactly one ink moment between hero and footer. Before v2.0.0 that was an explicit
       * ink token; the rename left `bg-background` alone, which renders a light card on a
       * light palette and quietly dropped the only dark band on the page. Reported by
       * jhai-composer. `dark` opens a nested scope, the same device shell.tsx uses for an ink
       * Section, so the card follows the consuming project's own dark palette rather than
       * pinning a grey here.
       */
      className="dark relative overflow-hidden rounded-(--ui-radius-card) bg-background p-[clamp(40px,5vw,64px)] text-foreground"
      style={style}
    >
      {/*
       * `gap-12` is 48px flat, deliberately not `gap-ui-gap-grid`. --gap-grid steps down to
       * 32px under 760px and this band has always held its 48px on a phone; the token
       * would quietly reflow it. Same number, no breakpoint behaviour attached.
       */}
      <div className="relative flex flex-wrap items-center gap-12">
        <h3 className="m-0 min-w-0 flex-[1_1_320px] font-sans text-[clamp(26px,2.6vw,34px)] leading-[1.15] [font-weight:var(--ui-weight-heading)] tracking-[-0.02em] text-foreground">
          {title}
        </h3>
        <div className="min-w-0 flex-[1_1_320px]">
          {link ? (
            <div>
              {/*
                * `ground="light"` (the default) INSIDE the dark scope, which is not a typo.
                * Button's ground prop names the surface it sits on in the CURRENT scope's
                * vocabulary: primary-light is `bg-foreground text-card`, and inside a dark
                * scope that resolves to a light fill with dark text — the correct button on a
                * dark card. It read `ground="dark"` while this card was light; leaving it
                * would now paint a dark button on a dark ground.
                */}
              <Button href={link.href}>{link.label}</Button>
              {subline ? (
                <p className="mt-3.5 m-0 font-sans text-ui-caption leading-[1.5] text-muted-foreground">
                  {subline}
                </p>
              ) : null}
            </div>
          ) : (
            field ?? (
              subline ? (
                <p className="m-0 font-sans text-ui-caption leading-[1.5] text-muted-foreground">
                  {subline}
                </p>
              ) : null
            )
          )}
        </div>
      </div>
    </div>
  );
}
