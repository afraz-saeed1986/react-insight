interface ReactDevtoolsGlobalHook {
  renderers: Map<number, unknown>;
  onCommitFiberRoot?:
    | ((rendererId: number, root: unknown, priority?: number) => void)
    | undefined;
  onCommitFiberUnmount?:
    | ((rendererId: number, fiber: unknown) => void)
    | undefined;
}

export interface HookAdapterCallbacks {
  onCommit(root: unknown): void;
  onUnmount(fiber: unknown): void;
}

/**
 * Safely connects to `__REACT_DEVTOOLS_GLOBAL_HOOK__`.
 *
 * Installs the hook if it does not exist yet, and chains any existing
 * onCommitFiberRoot / onCommitFiberUnmount implementation instead of
 * overwriting it, so this never conflicts with an actual React DevTools
 * extension or another tool relying on the same hook.
 *
 * Consumer errors are isolated so they never reach React's renderer.
 *
 * Returns a disposer that restores both previous callbacks.
 *
 * onPostCommitFiberRoot remains deferred (see DECISIONS.md, 2026-07-18).
 */
export function connectHookAdapter(
  callbacks: HookAdapterCallbacks,
  target: typeof globalThis = globalThis,
): () => void {
  const globalTarget = target as typeof globalThis & {
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: ReactDevtoolsGlobalHook;
  };

  if (!globalTarget.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    globalTarget.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      renderers: new Map(),
    };
  }

  const hook = globalTarget.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  const previousOnCommitFiberRoot = hook.onCommitFiberRoot;
  const previousOnCommitFiberUnmount = hook.onCommitFiberUnmount;

  hook.onCommitFiberRoot = (rendererId, root, priority) => {
    previousOnCommitFiberRoot?.(rendererId, root, priority);

    try {
      callbacks.onCommit(root);
    } catch (error) {
      console.error("[react-insight] Component discovery failed:", error);
    }
  };

  hook.onCommitFiberUnmount = (rendererId, fiber) => {
    previousOnCommitFiberUnmount?.(rendererId, fiber);

    try {
      callbacks.onUnmount(fiber);
    } catch (error) {
      console.error("[react-insight] Component discovery failed:", error);
    }
  };

  return () => {
    hook.onCommitFiberRoot = previousOnCommitFiberRoot;
    hook.onCommitFiberUnmount = previousOnCommitFiberUnmount;
  };
}