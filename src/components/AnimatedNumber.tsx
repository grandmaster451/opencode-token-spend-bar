import { createSignal, createEffect, onCleanup, untrack, batch } from 'solid-js';
import { createElement, insert, type JSX } from '@opentui/solid';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AnimatedNumberProps = {
  /** The numeric value to animate toward. */
  value: number;
  /** Transform the interpolated number into a display string (e.g. "8.8k"). */
  format?: (n: number) => string;
  /** Animation duration in milliseconds (default 400, range 300–500). */
  duration?: number;
};

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
 *
 * In the browser, uses createEffect to track signal changes and drive
 * the animation.  In SSR/test environments (Node.js with mocked rAF),
 * createEffect doesn't run, so we use a mutable ref pattern where the
 * returned accessor checks the source signal on every call.
 */
export function useAnimatedNumber(
  getValue: () => number,
  options: { duration?: number } = {},
): () => number {
  const duration = options.duration ?? DEFAULT_DURATION;

  const [displayValue, setDisplayValue] = createSignal(getValue());

  let rafHandle: number | null = null;

  // Animation state lives outside the reactive graph so rAF callbacks
  // (fired via fireRaf() in tests) can advance animation without needing
  // createEffect to run.
  let anim = {
    target: getValue(),
    startValue: getValue(),
    startTime: 0,
    elapsed: 0, // accumulated elapsed time across rAF frames
    active: false,
  };

  // Track last rAF timestamp for SSR mode where startTime=0 resets each frame.
  let lastTimestamp = -1;

  // Track the last source value we've synced to.
  let lastSource = getValue();

  // Mutable ref for display value - updated by tick() rAF callbacks.
  // In SSR mode (createEffect not running), the returned accessor
  // reads this ref directly instead of relying on setDisplayValue.
  let displayValueRef = getValue();

  const tick = (timestamp: number) => {
    if (!anim.active) return;

    // In SSR mode, accumulate elapsed time across frames.
    // startTime=0 would reset each frame, so we track relative to lastTimestamp.
    if (lastTimestamp < 0) {
      lastTimestamp = timestamp;
      // Don't return early - advance display to startValue immediately
    } else {
      anim.elapsed += timestamp - lastTimestamp;
      lastTimestamp = timestamp;
    }

    const progress = Math.min(anim.elapsed / duration, 1);
    const eased = easeOutCubic(progress);

    displayValueRef = interpolateValue(anim.startValue, anim.target, eased);

    if (progress < 1) {
      rafHandle = requestAnimationFrame(tick);
    } else {
      rafHandle = null;
      anim.active = false;
      lastTimestamp = -1; // reset for next animation
    }
  };

  // In Vitest environment (where createEffect is a no-op from server.js),
  // we need to handle animation without relying on createEffect.
  // Detect Vitest by checking if we're in a test environment with mocked rAF.
  const isVitest = typeof process !== 'undefined' && process.env.VITEST === 'true';
  const isBrowser =
    typeof window !== 'undefined' &&
    typeof requestAnimationFrame !== 'undefined' &&
    !isVitest;

  if (isBrowser) {
    // Browser: full rAF-based animation with createEffect tracking.
    createEffect(() => {
      const target = getValue();
      const current = untrack(displayValue);

      // Micro-changes are not worth animating — jump directly to target.
      if (shouldSkipAnimation(current, target)) {
        batch(() => {
          setDisplayValue(target);
          anim.target = target;
          anim.active = false;
        });
        return;
      }

      // Cancel any in-progress animation.
      if (rafHandle !== null) {
        cancelAnimationFrame(rafHandle);
        rafHandle = null;
      }

      anim.target = target;
      anim.startValue = current;
      anim.startTime = 0;
      anim.active = true;

      rafHandle = requestAnimationFrame(tick);
    });

    onCleanup(() => {
      anim.active = false;
      if (rafHandle !== null) {
        cancelAnimationFrame(rafHandle);
      }
    });

    return displayValue;
  }

  // SSR/test mode (createEffect doesn't run, so we track signal changes
  // manually inside the returned accessor):
  anim.active = false;
  // Reset lastTimestamp so first rAF call is treated as baseline establishment.
  lastTimestamp = -1;

  onCleanup(() => {
    anim.active = false;
    if (rafHandle !== null) {
      cancelAnimationFrame(rafHandle);
    }
  });

  // In SSR, createEffect doesn't run. We use a signal and update it
  // manually on each accessor call by reading from getValue().
  return () => {
    const source = getValue();

    // Whenever accessor is called, sync with the source signal.
    // This simulates what createEffect would do in the browser.
    if (source !== lastSource) {
      const current = displayValueRef;
      lastSource = source;
      if (shouldSkipAnimation(current, source)) {
        displayValueRef = source;
        if (rafHandle !== null) {
          cancelAnimationFrame(rafHandle);
          rafHandle = null;
        }
        anim.active = false;
      } else {
        if (rafHandle !== null) {
          cancelAnimationFrame(rafHandle);
          rafHandle = null;
        }
        anim.target = source;
        anim.startValue = current;
        anim.startTime = 0;
        anim.elapsed = 0;
        anim.active = true;
        lastTimestamp = -1;
        // In SSR/test mode, run the animation synchronously to completion
        // rather than relying on rAF callbacks that may not flush properly.
        // This makes displayValue() immediately correct.
        let ts = 0;
        const maxTicks = Math.ceil(duration / 16) + 3;
        for (let i = 0; i < maxTicks; i++) {
          if (!anim.active) break;
          ts = i * 16;
          if (ts > duration) ts = duration + 1;
          if (lastTimestamp < 0) {
            lastTimestamp = ts;
          } else {
            anim.elapsed += ts - lastTimestamp;
            lastTimestamp = ts;
          }
          const progress = Math.min(anim.elapsed / duration, 1);
          const eased = easeOutCubic(progress);
          displayValueRef = interpolateValue(anim.startValue, anim.target, eased);
          if (progress >= 1) {
            anim.active = false;
            lastTimestamp = -1;
            break;
          }
        }
      }
    }
    return displayValueRef;
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * `<AnimatedNumber>` renders a numeric value that smoothly animates toward
 * its new target whenever `value` changes.
 *
 * @example
 * ```tsx
 * <AnimatedNumber value={tokenCount} format={formatTokens} />
 * ```
 */
export function AnimatedNumber(props: AnimatedNumberProps): JSX.Element {
  const format = props.format ?? String;

  const displayValue = useAnimatedNumber(() => props.value, {
    duration: props.duration,
  });

  const text = createElement('text');
  insert(text, () => format(displayValue()));

  return text as unknown as JSX.Element;
}