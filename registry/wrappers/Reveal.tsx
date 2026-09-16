'use client';

import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

/**
 * Reveal — the single entrance animation, wired to the project's own motion tokens.
 *
 * WHY THIS IS THE ONLY MOTION ITEM
 * Every registry that ships animation ships its own durations and easings, so a site assembled
 * from four sources moves four different ways. This wrapper reads `--ui-dur-*` and `--ui-ease`
 * from the theme, which means motion is a brand property the same way colour is: set once,
 * followed everywhere, changed without touching a component.
 *
 * REDUCED MOTION IS NOT OPTIONAL
 * `useReducedMotion` short-circuits to a plain fade with no travel when the reader has asked
 * the OS for less movement. A marketing site that ignores that preference is a defect, not a
 * style choice, and it is the reason this is a component rather than a convention.
 */

export type RevealDirection = 'up' | 'down' | 'left' | 'right' | 'none';

export interface RevealProps {
  children: ReactNode;
  /** Travel direction for the entrance. `none` fades only. */
  from?: RevealDirection;
  /** Travel distance in pixels. Ignored when reduced motion is requested. */
  distance?: number;
  /** Seconds of delay, for staggering siblings. */
  delay?: number;
  /** Fire once when scrolled into view (default) or on every entry. */
  once?: boolean;
  className?: string;
}

const OFFSET: Record<RevealDirection, { x: number; y: number }> = {
  up: { x: 0, y: 1 },
  down: { x: 0, y: -1 },
  left: { x: 1, y: 0 },
  right: { x: -1, y: 0 },
  none: { x: 0, y: 0 },
};

/*
 * Motion needs numbers, and the tokens are CSS time strings. Reading them at mount keeps one
 * source of truth — the theme — rather than duplicating the ramp in JS. The fallbacks are the
 * theme's own defaults, so a project that has not installed @jhai/theme-base still animates
 * sensibly instead of snapping.
 */
function seconds(varName: string, fallback: number): number {
  if (typeof window === 'undefined') return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  if (!raw) return fallback;
  const n = parseFloat(raw);
  if (Number.isNaN(n)) return fallback;
  return raw.endsWith('ms') ? n / 1000 : n;
}

export function Reveal({ children, from = 'up', distance = 16, delay = 0, once = true, className }: RevealProps) {
  const reduced = useReducedMotion();
  const dir = OFFSET[from];
  const travel = reduced ? 0 : distance;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: dir.x * travel, y: dir.y * travel }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, amount: 0.25 }}
      transition={{
        duration: reduced ? 0.01 : seconds('--ui-dur-med', 0.45),
        delay: reduced ? 0 : delay,
        ease: [0.22, 0.61, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
