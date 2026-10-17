import {
  createContext,
  use,
  useActionState,
  useDeferredValue,
  useImperativeHandle,
  useOptimistic,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import type { Ref } from "react";

const store = {
  subscribe: () => () => {},
  getSnapshot: () => 7,
};

const ThemeContext = createContext("light");

function FixtureTransition() {
  const [isPending, startTransition] = useTransition();
  const [marker] = useState("marker");
  return (
    <button type="button" onClick={() => startTransition(() => {})}>
      useTransition pending={String(isPending)} {marker}
    </button>
  );
}

function FixtureDeferred() {
  const [text] = useState("deferred");
  const deferred = useDeferredValue(text);
  const [marker] = useState("marker");
  return <div>useDeferredValue {deferred} {marker}</div>;
}

function FixtureStore() {
  const value = useSyncExternalStore(store.subscribe, store.getSnapshot);
  const [marker] = useState("marker");
  return <div>useSyncExternalStore {value} {marker}</div>;
}

function FixtureImperative({ ref }: { ref?: Ref<{ ping(): void }> }) {
  useImperativeHandle(ref, () => ({ ping() {} }), []);
  const [marker] = useState("marker");
  return <div>useImperativeHandle {marker}</div>;
}

function FixtureOptimistic() {
  const [count] = useState(1);
  const [optimistic] = useOptimistic(count);
  const [marker] = useState("marker");
  return <div>useOptimistic {optimistic} {marker}</div>;
}

function FixtureActionState() {
  const [state, formAction, isPending] = useActionState(
    async (previous: number) => previous + 1,
    0,
  );
  const [marker] = useState("marker");
  return (
    <form action={formAction}>
      <button type="submit">
        useActionState state={state} pending={String(isPending)} {marker}
      </button>
    </form>
  );
}

function FixtureUse() {
  const theme = use(ThemeContext);
  const [marker] = useState("marker");
  return <div>use(Context) {theme} {marker}</div>;
}

export function FixturesReact19() {
  return (
    <section style={{ padding: 16 }}>
      <h2>React 19 hooks</h2>
      <FixtureTransition />
      <FixtureDeferred />
      <FixtureStore />
      <FixtureImperative />
      <FixtureOptimistic />
      <FixtureActionState />
      <FixtureUse />
    </section>
  );
}