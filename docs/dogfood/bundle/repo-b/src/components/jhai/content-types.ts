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
