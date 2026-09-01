/**
 * Best-effort access to React's internal, currently-active hooks
 * dispatcher slot. This is undocumented, unstable React internals —
 * used here ONLY for on-demand hook name inspection
 * (hookNameInspector.ts), never on the always-on discovery path.
 * This is the same general category of technique React's own
 * react-debug-tools / DevTools use.
 *
 * React 19 flattened the dispatcher slot into
 * `__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE.H`
 * (pre-19: `__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
 * .ReactCurrentDispatcher.current`). This package's peer dependency is
 * react >= 19, so the 19+ shape is primary; the older shape is kept as
 * a defensive fallback only, in case a consuming app is on an older
 * peer version than declared.
 *
 * Likely undefined in production builds, where React strips these
 * internals to discourage exactly this kind of usage — callers must
 * treat a missing dispatcher ref as "on-demand hook name resolution
 * unavailable" and degrade gracefully (return undefined), not throw.
 */
import * as React from "react";

interface SharedInternalsV19 {
  H: unknown;
}

interface SharedInternalsPre19 {
  ReactCurrentDispatcher: { current: unknown };
}

export interface DispatcherRef {
  current: unknown;
}

function getSharedInternals(): SharedInternalsV19 | SharedInternalsPre19 | undefined {
  const reactWithInternals = React as unknown as Record<string, unknown>;

  return (
    (reactWithInternals.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE as
      | SharedInternalsV19
      | undefined) ??
    (reactWithInternals.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED as
      | SharedInternalsPre19
      | undefined)
  );
}

/**
 * Returns a live { current } view onto React's active dispatcher slot,
 * or undefined if the internals this relies on aren't available
 * (production build, or an unsupported React version).
 */
export function getCurrentDispatcherRef(): DispatcherRef | undefined {
  const internals = getSharedInternals();

  if (!internals) return undefined;

  if ("H" in internals) {
    return {
      get current() {
        return internals.H;
      },
      set current(value: unknown) {
        internals.H = value;
      },
    };
  }

  if ("ReactCurrentDispatcher" in internals) {
    return internals.ReactCurrentDispatcher;
  }

  return undefined;
}