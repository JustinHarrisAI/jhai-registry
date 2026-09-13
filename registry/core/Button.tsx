import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

/**
 * Button — the v2 CTA.
 *
 * Primary is a solid ground-inverted fill; ghost is a hairline. Always sentence case,
 * never a gradient, never a coloured fill. Pair primary and ghost in a 12px-gap row.
 *
 * NO HOVER STATE, deliberately. The source export declares the transition and then never
 * changes a value on hover, so the button does not move under the cursor. Hover on a v2 CTA
 * comes from the magnetic translate in v2-motion.css; a colour shift here would put a
 * second, unbriefed hover on top of it. The dead transition is carried verbatim because the
 * export is the spec and it costs nothing.
 *
 * REGISTRY NOTE — this differs from the jhai-new-website original, on purpose.
 * In that repo Button is a thin adapter over a FORKED src/components/ui/button.tsx which
 * adds v2Primary / v2Ghost / ground variants to the stock shadcn button. Shipping the fork
 * would mean this item overwrites a consuming project's own ui/button.tsx, which is exactly
 * the collision the registry exists to avoid. So the four compound variants are inlined here
 * and the item is self-contained: no cva, no shadcn button, no fork. The rendered classes are
 * identical to the fork's.
 */

export type ButtonVariant = 'primary' | 'ghost';
export type ButtonGround = 'light' | 'dark';
export type ButtonSize = 'md' | 'nav' | 'lg';

type ButtonOwnProps = {
  /** 'primary' solid fill (ground-inverted) or 'ghost' hairline border */
  variant?: ButtonVariant;
  /** which surface the button sits on — flips the fill/border side */
  ground?: ButtonGround;
  /** md 50px · nav 42px · lg 56px */
  size?: ButtonSize;
  /** renders an <a> when set */
  href?: string;
  children: ReactNode;
};

export type ButtonProps = ButtonOwnProps &
  Omit<
    AnchorHTMLAttributes<HTMLAnchorElement> & ButtonHTMLAttributes<HTMLButtonElement>,
    keyof ButtonOwnProps
  >;

const BASE =
  'inline-flex shrink-0 items-center justify-center whitespace-nowrap select-none ' +
  'rounded-(--radius-card) px-7 font-sans text-type-body [font-weight:var(--weight-heading)] no-underline ' +
  'transition-[background-color,border-color,color] duration-(--dur-fast) ease-(--ease) ' +
  'outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ' +
  'disabled:pointer-events-none disabled:opacity-50';

const SIZE: Record<ButtonSize, string> = {
  md: 'h-button-h',
  nav: 'h-button-h-nav',
  lg: 'h-field-h',
};

/** The four combinations the v2 button actually has. One control whose fill side flips. */
const TONE: Record<`${ButtonVariant}-${ButtonGround}`, string> = {
  'primary-light': 'bg-ink-800 text-paper-0',
  'primary-dark': 'bg-paper-50 text-ink-950',
  'ghost-light': 'border border-black/20 bg-transparent text-ink-800',
  'ghost-dark': 'border border-white/35 bg-transparent text-dark-text-1',
};

export function Button({
  variant = 'primary',
  ground = 'light',
  size = 'md',
  href,
  children,
  className,
  ...rest
}: ButtonProps) {
  const classes = [BASE, SIZE[size], TONE[`${variant}-${ground}`], className]
    .filter(Boolean)
    .join(' ');

  if (href) {
    return (
      <a href={href} className={classes} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </a>
    );
  }

  return (
    <button type="button" className={classes} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
