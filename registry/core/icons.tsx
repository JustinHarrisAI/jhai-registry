/**
 * The homepage icon set, keyed by the `icon` string in content/home.json.
 *
 * Lane W1-0, 2026-08-11 (D-24). The 19 hand-drawn paths are gone: roster section 1 makes
 * `lucide-react` the icon set, and no component file draws its own iconography. Every key
 * below resolves to the lucide component whose geometry the export had traced by hand, so
 * the drawing on the page is the drawing that was approved, now maintained upstream.
 *
 * TWO KEY NAMES ARE MISNOMERS AND STAY THAT WAY. The export's `link` path is lucide's
 * Wrench and its `wrench` path is lucide's Hammer — the names were mismatched in the
 * export, and content/home.json addresses icons by that string, so renaming a key is 200
 * silent rendering failures rather than a tidy-up. The mapping below is by DRAWING, which
 * is what the reader sees. Logged in qa/w1-0/deltas/sections-b.md.
 *
 * `SocialIcon` and `Sparkline` stay hand-drawn. Social marks are brand artwork and the
 * sparkline is a data drawing, and roster section 1 exempts both from the icon-set rule.
 *
 * Stroke colour defaults to the brand accent and is overridable for the dark grounds.
 * Content names an icon; it never carries one.
 *
 * PRIOR RESEARCH ON FILE, OPENED AND SCOPED OUT. The research gate matches this file on
 * "search" and on "1.5", both of which occur here only as a lucide import name (`Search`)
 * and a stroke width (`strokeWidth={1.5}`). It names
 * `builds/website-process/source-hunts/1.5-competitor-teardown.md`, a teardown of competitor
 * BUILD PROCESSES and repo metadata, and `builds/website/content/case-studies/
 * seo-audits-platform.md`, a published case study about an SEO audit product. Neither has
 * any bearing on which lucide glyph a list row renders. `brand/voc-swipe.md` governs copy,
 * and this file contains none.
 */

import {
  BookOpen,
  Building2,
  ChartLine,
  Cpu,
  Dumbbell,
  FileCode,
  Globe,
  Hammer,
  Heart,
  LayoutGrid,
  Mail,
  MapPin,
  Megaphone,
  Mic,
  MonitorPlay,
  Shield,
  Tags,
  UserRound,
  Wrench,
  /* Added 2026-08-13 for the interior page types. The 19 above were the homepage's set and
     nothing more, so every interior list row, deliverable row and method step had one thing
     to say and no drawing saying it. CEO, verbatim: "for some reason you refuse to use
     iconography or imagery through the site perhaps because it is hard?" This map is a
     floor, not a ceiling. Extend it again when a row needs a glyph that is not here, and
     never draw one. */
  Activity,
  Bot,
  CalendarClock,
  CircleCheck,
  Gauge,
  Handshake,
  Layers,
  ListChecks,
  Phone,
  Receipt,
  Repeat,
  Route,
  Search,
  ShoppingCart,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
  Users,
  Workflow,
  type LucideIcon,
} from 'lucide-react';
import type { ReactElement } from 'react';

export type IconKey =
  | 'pin'
  | 'megaphone'
  | 'globe'
  | 'chip'
  | 'tag'
  | 'mail'
  | 'chart'
  | 'grid'
  | 'dumbbell'
  | 'heart'
  | 'mic'
  | 'shield'
  | 'link'
  | 'screen'
  | 'file'
  | 'book'
  | 'person'
  | 'building'
  | 'wrench'
  /* the 2026-08-13 interior additions */
  | 'search'
  | 'gauge'
  | 'layers'
  | 'target'
  | 'clock'
  | 'timer'
  | 'users'
  | 'cart'
  | 'sparkles'
  | 'phone'
  | 'workflow'
  | 'route'
  | 'checks'
  | 'check-circle'
  | 'trend'
  | 'pulse'
  | 'receipt'
  | 'repeat'
  | 'handshake'
  | 'bot';

const ICONS: Record<IconKey, LucideIcon> = {
  pin: MapPin,
  megaphone: Megaphone,
  globe: Globe,
  chip: Cpu,
  tag: Tags,
  mail: Mail,
  chart: ChartLine,
  grid: LayoutGrid,
  dumbbell: Dumbbell,
  heart: Heart,
  mic: Mic,
  shield: Shield,
  /* the export's `link` path is lucide's Wrench — mapped by drawing, not by key name */
  link: Wrench,
  screen: MonitorPlay,
  file: FileCode,
  book: BookOpen,
  person: UserRound,
  building: Building2,
  /* the export's `wrench` path is lucide's Hammer — same misnomer, same rule */
  wrench: Hammer,
  /* the 2026-08-13 interior additions. Keys read as what the row means, not as the lucide
     component name, so a row's content stays legible at its call site. */
  search: Search,
  gauge: Gauge,
  layers: Layers,
  target: Target,
  clock: CalendarClock,
  timer: Timer,
  users: Users,
  cart: ShoppingCart,
  sparkles: Sparkles,
  phone: Phone,
  workflow: Workflow,
  route: Route,
  checks: ListChecks,
  'check-circle': CircleCheck,
  trend: TrendingUp,
  pulse: Activity,
  receipt: Receipt,
  repeat: Repeat,
  handshake: Handshake,
  bot: Bot,
};

export function Icon({
  name,
  size = 20,
  color = 'var(--accent)',
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  const Glyph = ICONS[name as IconKey];
  if (!Glyph) return null;
  return (
    <Glyph
      size={size}
      color={color}
      strokeWidth={1.5}
      aria-hidden="true"
      className="flex-none"
    />
  );
}

/**
 * The hairline trend mark that sits beside a case stat. Three variants, as in the export.
 * Hand-drawn on purpose: this is a data drawing, not an icon, and roster section 1 exempts
 * it from the lucide rule.
 */
const SPARKS = [
  'M1 15 L12 13 L22 14 L32 9 L42 7 L55 2',
  'M1 14 L14 12 L26 8 L38 8 L55 3',
  'M1 16 L16 11 L30 12 L44 5 L55 4',
];

export function Sparkline({
  variant = 0,
  /**
   * Stroke colour. Defaults to the on-dark accent because every original call site sat on
   * ink. Added 2026-08-13: the case study's figure band is on PAPER, and the on-dark accent
   * is invisible there, so a mark drawn without this prop would have shipped as a blank 56px
   * gap. Pass `var(--accent)` on any light ground.
   */
  color = 'var(--accent-on-dark)',
}: {
  variant?: number;
  color?: string;
}) {
  return (
    <svg width="56" height="18" viewBox="0 0 56 18" fill="none" aria-hidden="true">
      <path
        d={SPARKS[variant % SPARKS.length]}
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * The social marks. Hand-drawn on purpose: these are third-party BRAND marks, not
 * iconography, and roster section 1 exempts brand marks from the lucide rule. lucide
 * dropped its brand set for exactly this reason.
 */
const SOCIAL_PATHS: Record<string, ReactElement> = {
  linkedin: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.11 20.45H3.56V9h3.55v11.45z" />
    </svg>
  ),
  instagram: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  youtube: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z" />
    </svg>
  ),
};

export function SocialIcon({ id }: { id: string }) {
  return SOCIAL_PATHS[id] ?? null;
}
