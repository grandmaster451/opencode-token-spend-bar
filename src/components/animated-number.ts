// ---------------------------------------------------------------------------
// Animated number utilities (pure functions + reactive hook)
//
// Separated from the component file so that the core animation logic can be
// tested without pulling in the @opentui/solid TUI renderer (which requires
// the Bun runtime).
// ---------------------------------------------------------------------------

import { createSignal, createEffect, onCleanup, untrack } from 'solid-js';

// ---------------------------------------------------------------------------
// Pure helpers (exported for testing)
// ---------------------------------------------------------------------------

/** Cubic ease-out: fast start, slow finish. Maps [0,1] → [0,1]. */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Decide whether the change between two values is small enough to skip
 * animating.  The threshold is 1 % of the larger absolute value, with a
 * floor of 1 so that near-zero values still animate when the absolute
 * change is meaningful.
 */
export function shouldSkipAnimation(from: number, to: number): boolean {
  const reference = Math.max(Math.abs(from), Math.abs(to), 1);
  return Math.abs(to - from) < reference * 0.01;
}

/**
 * Linearly interpolate between `from` and `to` at the given eased progress
 * (already in [0,1] after applying an easing function).
 */
export function interpolateValue(
  from: number,
  to: number,
  easedProgress: number,
): number {
  return from + (to - from) * easedProgress;
}

// ---------------------------------------------------------------------------
// Hook (exported for reuse / testing)
// ---------------------------------------------------------------------------

const DEFAULT_DURATION = 400;

/**
 * Reactive hook that returns a signal holding the currently displayed
 * numeric value.  When the source value changes the hook animates from
 * the current display value to the new target using `requestAnimationFrame`
 * and cubic ease-out easing.
 *
 * - Skips animation when the change is < 1 %.
 * - Interrupts in-progress animations on rapid successive changes.
 * - Cleans up the rAF handle on disposal.
 */
export function useAnimatedNumber(
  getValue: () => number,
  options: { duration?: number } = {},
): () => number {
  const duration = options.duration ?? DEFAULT_DURATION;

  const [displayValue, setDisplayValue] = createSignal(getValue());

  let rafHandle: number | null = null;

  createEffect(() => {
    const target = getValue();
    const current = untrack(displayValue);

    // Micro-changes are not worth animating.
    if (shouldSkipAnimation(current, target)) {
      setDisplayValue(target);
      return;
    }

    // Cancel any in-progress animation so we start from the current
    // displayed position toward the *new* target.
    if (rafHandle !== null) {
      cancelAnimationFrame(rafHandle);
    }

    const startValue = current;
    let startTime: number | null = null;

    const tick = (timestamp: number) => {
      if (startTime === null) {
        startTime = timestamp;
      }

      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);

      setDisplayValue(interpolateValue(startValue, target, eased));

      if (progress < 1) {
        rafHandle = requestAnimationFrame(tick);
      } else {
        rafHandle = null;
      }
    };

    rafHandle = requestAnimationFrame(tick);
  });

  onCleanup(() => {
    if (rafHandle !== null) {
      cancelAnimationFrame(rafHandle);
    }
  });

  return displayValue;
}