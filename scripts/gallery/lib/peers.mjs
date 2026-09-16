/**
 * The peer set pre-installed into every scaffold before any item is installed.
 *
 * WHY THIS FILE EXISTS
 *   Run 1 reported @magicui at 0 of 250. Every one of its 241 build failures named a single
 *   missing package, @radix-ui/react-accordion, which the registry items use but do not declare.
 *   Two of those items were retested by hand with the package present and compiled clean. A
 *   registry that publishes an undeclared peer is common and is not the same defect as a
 *   registry whose components do not compile, so the harness now supplies the whole ordinary
 *   peer surface up front and only reports what fails with it present.
 *
 * WHAT BELONGS HERE
 *   Packages a normal shadcn project would already have, or that a component author could
 *   reasonably assume. Not anything exotic: if an item needs a package nothing else needs, it
 *   should declare it, and failing to is a real finding worth recording.
 */

/** Radix primitives. shadcn/ui itself is built on these, so a shadcn-compatible item may use any. */
export const RADIX = [
  '@radix-ui/react-accessible-icon',
  '@radix-ui/react-accordion',
  '@radix-ui/react-alert-dialog',
  '@radix-ui/react-aspect-ratio',
  '@radix-ui/react-avatar',
  '@radix-ui/react-checkbox',
  '@radix-ui/react-collapsible',
  '@radix-ui/react-context-menu',
  '@radix-ui/react-dialog',
  '@radix-ui/react-direction',
  '@radix-ui/react-dropdown-menu',
  '@radix-ui/react-hover-card',
  '@radix-ui/react-icons',
  '@radix-ui/react-label',
  '@radix-ui/react-menubar',
  '@radix-ui/react-navigation-menu',
  '@radix-ui/react-popover',
  '@radix-ui/react-portal',
  '@radix-ui/react-progress',
  '@radix-ui/react-radio-group',
  '@radix-ui/react-scroll-area',
  '@radix-ui/react-select',
  '@radix-ui/react-separator',
  '@radix-ui/react-slider',
  '@radix-ui/react-slot',
  '@radix-ui/react-switch',
  '@radix-ui/react-tabs',
  '@radix-ui/react-toggle',
  '@radix-ui/react-toggle-group',
  '@radix-ui/react-tooltip',
  '@radix-ui/react-use-controllable-state',
  '@radix-ui/react-visually-hidden',
];

/** Base UI. A separate primitive base, never installed alongside Radix in the same scaffold. */
export const BASE_UI = [
  '@base-ui-components/react',
  '@base-ui/react',
];

/** Everything a shadcn project or a component author routinely assumes, regardless of base. */
export const COMMON = [
  'clsx',
  'tailwind-merge',
  'class-variance-authority',
  'lucide-react',
  'tw-animate-css',
  'motion',
  'framer-motion',
  'react-use-measure',
  'embla-carousel-react',
  'embla-carousel-autoplay',
  'cmdk',
  'vaul',
  'sonner',
  'date-fns',
  'react-day-picker',
  'recharts',
  'input-otp',
  'react-resizable-panels',
  'next-themes',
  /*
   * PINNED to v8 on purpose. v9 renamed getCoreRowModel to createCoreRowModel, and installing
   * the newest major broke every @8bitcn item that uses a data table — 71 false failures caused
   * by the harness's own peer choice. The peer set must match what component authors actually
   * wrote against, not the newest thing on npm.
   */
  '@tanstack/react-table@^8',
  '@tanstack/react-virtual',
  'zod',
  'react-hook-form',
  '@hookform/resolvers',
  'usehooks-ts',
  'react-icons',
  '@number-flow/react',
  'canvas-confetti',
  '@types/canvas-confetti',
];

/**
 * Both primitive bases are installed in every scaffold, on purpose.
 *
 * Declared dependencies do not identify a registry's base: @tailark-oss declares neither Radix
 * nor Base UI and uses Base UI anyway, and @hirael declares both. Splitting scaffolds by a guess
 * would have produced exactly the false zeroes run 1 was full of. The packages themselves do not
 * conflict — the conflict is file-level, when a Base UI item overwrites `ui/button.tsx` in a
 * project whose other components import the Radix one. That clobber is detected and recorded
 * instead of guessed at, which is what actually answers whether the two can be mixed.
 */
export function peersFor(base) {
  if (base === 'radix-only') return [...COMMON, ...RADIX];
  if (base === 'base-ui-only') return [...COMMON, ...BASE_UI];
  return [...COMMON, ...RADIX, ...BASE_UI];
}
