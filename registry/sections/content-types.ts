/**
 * content-types — the prop shapes the JHAI section components take.
 *
 * In jhai-new-website these live in `src/lib/v2/home.ts` alongside the site's own content
 * data. A registry item cannot import from a consuming project's lib, so the TYPES travel
 * with the components and the DATA stays in whatever project renders them. That split is
 * the point: the section knows what shape it needs, and the project decides what goes in.
 *
 * Types only. No values, no content, nothing client-specific.
 */

export type LogoEntry = { src: string; alt: string };

export type StatEntry = { value: string; label: string };

export type ProblemContent = {
  number: string;
  label: string;
  titleLead: string;
  titleEm: string;
  titleTail: string;
  lede: string;
  bullets: string[];
};

export type AnswerContent = {
  number: string;
  label: string;
  titleLead: string;
  titleEm: string;
  ledeLead: string;
  ledeEm: string;
  image: string;
  imageAlt: string;
  pillars: { title: string; body: string }[];
};

export type QuestionsContent = {
  number: string;
  label: string;
  title: string;
  lede: string;
  faq: { q: string; a: string }[];
};

export type CompareCell = { mark?: 'check' | 'cross'; text: string; strong?: boolean };

export type CompareContent = {
  number: string;
  label: string;
  title: string;
  side: string;
  columns: { label: string; icon: string; highlight?: boolean }[];
  rows: { label: string; cells: CompareCell[] }[];
};

export type CtaBandContent = {
  title: string;
  subline: string;
  /** kept for projects whose own capture form reads them; CTABand itself takes a `field` slot */
  cta?: string;
  action?: string;
  /** Present only where the ask is a call rather than a form. */
  link?: { label: string; href: string };
};

/* ────────────────────────────────────────────────────────────────────────────
 * The composer-facing sections, added 2026-09-14.
 *
 * Every one of these takes its content through a single `content` object whose keys are the
 * content field names, per the registry's content-prop convention. Layout and behaviour flags
 * (variant, ground) stay as separate top-level props and are NOT part of these types — a
 * variant is a design decision, not content, and mixing the two is what makes a consumer's
 * adapter bespoke instead of a pass-through.
 * ──────────────────────────────────────────────────────────────────────────── */

/** A label + destination. The one link shape across every section below. */
export type LinkEntry = { label: string; href: string };

/**
 * A picture, or the honest absence of one.
 *
 * `src` is optional ON PURPOSE. A section that hard-requires a live URL cannot be placed in a
 * wireframe, and a consumer then has to fork the layout locally to show an empty plate —
 * which is exactly what jhai-composer had to do for `Answer`. Omit `src` and the section
 * renders a correctly proportioned empty surface with `placeholder` as its caption.
 */
export type MediaEntry = {
  src?: string;
  alt?: string;
  /** caption drawn on the empty plate, e.g. "Clinic room, natural light" */
  placeholder?: string;
  /** CSS aspect-ratio, e.g. "16/10". Defaults per section. */
  ratio?: string;
};

export type SiteHeaderContent = {
  brand: string;
  nav: LinkEntry[];
  action?: LinkEntry;
};

export type TestimonialEntry = {
  quote: string;
  author: string;
  role?: string;
  /** 0-5, drawn by RatingMark. Omit when there is no real rating — never invent one. */
  rating?: number;
};

export type TestimonialsContent = {
  number?: string;
  label?: string;
  title?: string;
  quotes: TestimonialEntry[];
};

export type FooterColumn = {
  heading: string;
  links: LinkEntry[];
};

export type SiteFooterContent = {
  brand: string;
  blurb?: string;
  columns: FooterColumn[];
  legal?: string;
};

export type HeroContent = {
  eyebrow?: string;
  headline: string;
  subhead?: string;
  /** first entry renders primary, the rest ghost */
  actions: LinkEntry[];
  media?: MediaEntry;
};

export type PricingPlan = {
  label: string;
  /** the figure as authored, e.g. "$95/mo" — never computed here */
  price: string;
  /** billing note under the figure, e.g. "billed monthly, cancel anytime" */
  note?: string;
  /** exactly one plan per set, or none */
  highlight?: boolean;
  action?: LinkEntry;
};

export type PricingRow = {
  label: string;
  /** one entry per plan, in plan order. "yes" / "no" draw marks; anything else is literal. */
  values: string[];
};

export type PricingContent = {
  number?: string;
  label?: string;
  title?: string;
  /** header cell above the criteria column in the comparison variant */
  rowHeading?: string;
  plans: PricingPlan[];
  rows?: PricingRow[];
};
