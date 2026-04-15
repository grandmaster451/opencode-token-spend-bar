// Node.js-safe stub for @opentui/solid
// @opentui/solid uses Bun-specific runtime internals (bun:ffi) that Node ESM cannot resolve.
// This stub provides the same named exports for Node/Vitest compatibility.

export type JSX = Record<string, unknown>;

const noopFn = (): undefined => undefined;
const identityFn = <T>(x: T): T => x;

export const createElement = identityFn;
export const insert = noopFn;
export const setProp = noopFn;