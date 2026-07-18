interface ReactDevtoolsGlobalHook {
  renderers: Map<number, unknown>;
onCommitFiberRoot?: ((
  rendererId: number,
  root: unknown,
  priority?: number,
) => void) | undefined;
}

export interface HookAdapterCallbacks {
  onCommit(root: unknown): void;
}

/**
 * Safely connects to `__REACT_DEVTOOLS_GLOBAL_HOOK__`.
 *
 * Installs the hook if it does not exist yet, and chains any existing
 * `onCommitFiberRoot` implementation instead of overwriting it, so this
 * never conflicts with an actual React DevTools extension or another
 * tool relying on the same hook.
 *
 * Consumer errors are isolated so they never reach React's renderer.
 *
 * Returns a disposer that restores the previous callback.
 *
 * Only `onCommitFiberRoot` is wired in this commit. `onCommitFiberUnmount`
 * is added in a follow-up commit (see DECISIONS.md, 2026-07-18 — Hook
 * Adapter event contract). `onPostCommitFiberRoot` remains deferred.
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

  hook.onCommitFiberRoot = (rendererId, root, priority) => {
    previousOnCommitFiberRoot?.(rendererId, root, priority);

    try {
      callbacks.onCommit(root);
    } catch (error) {
      console.error("[react-insight] Component discovery failed:", error);
    }
  };

  return () => {
    hook.onCommitFiberRoot = previousOnCommitFiberRoot;
  };
}