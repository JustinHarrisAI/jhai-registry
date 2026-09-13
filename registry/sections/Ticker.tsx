/**
 * The outlined capability ticker. Type as texture: stroked, not filled, so it reads as a
 * rule between the answer and the services grid rather than as another headline.
 */

export function Ticker({ text }: { text: string }) {
  /* The stroke alpha is a literal the export carries and no token names. It is written
     exactly rather than mixed from --ink-800, because a color-mix() that an older engine
     cannot parse would drop the stroke and leave a transparent, invisible ticker. */
  const item = (
    <span className="flex-none pr-16 font-sans text-[clamp(72px,8vw,116px)] leading-none [font-weight:var(--weight-heading)] tracking-[-0.04em] whitespace-nowrap text-transparent [-webkit-text-stroke:1px_color-mix(in_srgb,var(--ink-800)_22%,transparent)]">
      {`${text} `}
    </span>
  );

  return (
    /* The marquee stays a CSS marquee, never a carousel: it moves on its own forever and
       carries its own duration and reduced-motion stop in HomeStyles. */
    <section
      data-screen-label="Ticker"
      aria-hidden="true"
      className="overflow-hidden bg-paper-50 pt-[72px] pb-0"
    >
      <div className="v2-marquee v2-marquee--ticker">
        {item}
        {item}
      </div>
    </section>
  );
}
