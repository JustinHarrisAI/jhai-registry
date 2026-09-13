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
