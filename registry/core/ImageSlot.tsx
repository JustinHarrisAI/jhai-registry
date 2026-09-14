import type { CSSProperties } from 'react';

/**
 * ImageSlot — the grey plate convention.
 *
 * The export uses a custom `<image-slot>` element wherever a real photograph is
 * meant to drop in later. That grey plate is intentional, not a defect: an empty
 * slot reads as a deliberate hole in the layout rather than a broken image.
 *
 * Production equivalent: render the image when `src` is set, otherwise render the
 * plate with its `placeholder` caption so the drop-in intent survives the port.
 * Every case, blog and photo plate in the system is grayscale by design.
 *
 * Source convention: `extracted/image-slot.js` + `Homepage v2.dc.html`.
 *
 * Reauthored off inline styles onto utilities. `aspectRatio`
 * and `width` are the two survivors and they are caller DATA, not design values — see the
 * comment at the style prop. The filter stays an arbitrary property so the two functions
 * keep the export's own order rather than Tailwind's fixed one.
 */

export type ImageSlotShape = 'rounded' | 'rect' | 'circle';

export interface ImageSlotProps {
  /** empty-state caption, e.g. "Drop: agent console frame" */
  placeholder?: string;
  /** image URL; omit to render the grey plate */
  src?: string;
  /** alt text — decorative plates keep the empty string */
  alt?: string;
  /** CSS aspect-ratio, e.g. "16/10" */
  ratio?: string;
  shape?: ImageSlotShape;
  /** grayscale is the house treatment; set false only for a deliberate exception */
  grayscale?: boolean;
  /** slightly raised contrast on grayscale case imagery */
  contrast?: boolean;
  width?: string;
  style?: CSSProperties;
}

/**
 * The plate grey was `#ECECEA`, a literal carried verbatim from the export because it had no
 * token of its own. For the registry it resolves through `--ui-surface-strong`, whose default
 * value IS that same colour — so nothing moves on JHAI, and the plate now takes a client's own
 * surface colour instead of staying JHAI grey on every site. This is the one colour change
 * made when the component became a registry item.
 *
 * `circle` is 50% and not `rounded-full`: the plate is rarely square, and 9999px would give
 * a stadium where the export gives an ellipse.
 */
const RADII: Record<ImageSlotShape, string> = {
  rounded: 'rounded-(--ui-radius-card)',
  rect: 'rounded-none',
  circle: 'rounded-[50%]',
};

export function ImageSlot({
  placeholder,
  src,
  alt = '',
  ratio = '16/10',
  shape = 'rounded',
  grayscale = true,
  contrast = false,
  width,
  style,
}: ImageSlotProps) {
  const filter = grayscale
    ? contrast
      ? '[filter:grayscale(1)_contrast(1.05)]'
      : '[filter:grayscale(1)]'
    : '';

  return (
    <div
      className={`box-border flex items-center justify-center overflow-hidden bg-[var(--ui-surface-strong)] ${RADII[shape]}`}
      /* Runtime, not design: `ratio` is a free-form CSS aspect-ratio string and `width` any
         CSS length, both supplied per call site. Neither can be a class. */
      style={{ aspectRatio: ratio, width: width || '100%', ...style }}
    >
      {src ? (
        <img src={src} alt={alt} className={`block h-full w-full object-cover ${filter}`} />
      ) : placeholder ? (
        /* `--ui-ink-500`, not `--ui-ink-400`. The eyebrow step is authored against paper and white;
           on this plate's own `#ECECEA` it reads 4.32:1 at 9.5px and misses WCAG 2.2 AA. The
           next step down the same ramp reads 4.52:1 on the plate and is the only token that
           clears it without darkening the caption into body weight. */
        <span className="px-4 text-center font-mono text-ui-eyebrow tracking-[0.2em] text-muted-foreground uppercase">
          {placeholder}
        </span>
      ) : null}
    </div>
  );
}
