interface ReactDevtoolsGlobalHook {
  renderers: Map<number, unknown>;
  supportsFiber?: boolean;
  inject?: (renderer: unknown) => number;
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

type GlobalWithHook = typeof globalThis & {
  __REACT_DEVTOOLS_GLOBAL_HOOK__?: ReactDevtoolsGlobalHook;
};

let nextRendererId = 0;

function createStubHook(): ReactDevtoolsGlobalHook {
  const renderers = new Map<number, unknown>();

  return {
    renderers,
    supportsFiber: true,
    inject(renderer: unknown) {
      const id = ++nextRendererId;
      renderers.set(id, renderer);
      return id;
    },
  };
}

/**
 * Installs `__REACT_DEVTOOLS_GLOBAL_HOOK__` if it does not already
 * exist. Idempotent and safe to call multiple times or when a real
 * React DevTools extension (or another tool) already installed one.
 *
 * MUST be called before React / ReactDOM is imported anywhere in the
 * application's module graph. React's renderer checks for this hook
 * exactly once, at module-initialization time, and calls
 * `hook.inject(...)` to register itself. If the hook is installed
 * later (e.g. from inside a React effect), React never discovers it
 * for that page load — the same constraint documented by React's own
 * `react-devtools-inline` package ("must be called before React is
 * loaded, including import/require statements").
 *
 * `connectHookAdapter()` also calls this defensively, so discovery
 * still degrades gracefully (with reduced guarantees) for consumers
 * who forget to call it early — see its own documentation.
 */
export function installReactDevtoolsHook(target: typeof globalThis = globalThis): void {
  const globalTarget = target as GlobalWithHook;

  if (!globalTarget.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    globalTarget.__REACT_DEVTOOLS_GLOBAL_HOOK__ = createStubHook();
  }
}

/**
 * Safely connects to `__REACT_DEVTOOLS_GLOBAL_HOOK__`.
 *
 * Installs the hook via installReactDevtoolsHook() if it does not
 * exist yet (see that function's documentation for why this is best
 * done earlier, by the consuming application), and chains any
 * existing onCommitFiberRoot / onCommitFiberUnmount implementation
 * instead of overwriting it, so this never conflicts with an actual
 * React DevTools extension or another tool relying on the same hook.
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
  installReactDevtoolsHook(target);

  const globalTarget = target as GlobalWithHook;
  // Safe: installReactDevtoolsHook() guarantees this is set.
  const hook = globalTarget.__REACT_DEVTOOLS_GLOBAL_HOOK__!;

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