import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useInsight } from "@react-insight/react";
import { inspectComponent } from "@react-insight/inspector";
import type { ComponentInspection } from "@react-insight/inspector";

function Display({ count }: { count: number }) {
  return <p>Count: {count}</p>;
}

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <Display count={count} />
      <button onClick={() => setCount((c) => c + 1)}>Increment</button>
    </div>
  );
}

function Greeting() {
  return <p>Hello from a mountable component 👋</p>;
}

function InsightDebugPanel() {
const insight = useInsight();
  const [, forceRefresh] = useState(0);
  const lastSnapshotRef = useRef<string | null>(null);
  const [inspection, setInspection] = useState<ComponentInspection | null>(null);

  const handleInspect = (id: string) => {
    setInspection(inspectComponent(insight, id) ?? null);
  };

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const relevantSnapshot = () =>
      JSON.stringify(
        insight.getComponents().filter((c) => c.displayName !== "InsightDebugPanel"),
      );

    const refreshIfChanged = () => {
      const next = relevantSnapshot();
      if (next === lastSnapshotRef.current) return;
      lastSnapshotRef.current = next;
      forceRefresh((n) => n + 1);
    };

    refreshIfChanged();

    const unsubscribe = insight.onChange(() => {
      if (timeoutId !== null) return;

      timeoutId = setTimeout(() => {
        timeoutId = null;
        refreshIfChanged();
      }, 150);
    });

    return () => {
      unsubscribe();
      if (timeoutId !== null) clearTimeout(timeoutId);
    };
  }, [insight]);
  return (
    <div style={{ marginTop: 16, fontFamily: "monospace" }}>
      <button onClick={() => forceRefresh((n) => n + 1)}>Refresh snapshot</button>
      <ul>
        {insight.getComponents().map((c) => (
          <li key={c.id}>
            {c.displayName} — status: {c.status}, renders: {c.renderCount}{" "}
            <button onClick={() => handleInspect(c.id)}>Inspect</button>
          {c.hooks.length > 0 && (
              <span>
                {" — hooks: ["}
                {c.hooks
                  .map((h) =>
                    h.value !== undefined
                      ? `${h.kind}=${JSON.stringify(h.value)}`
                      : h.kind,
                  )
                  .join(", ")}
                {"]"}
              </span>
            )}


            {c.contexts.length > 0 && (
              <span>
                {" — contexts: ["}
                {c.contexts
                  .map((ctx) => `${ctx.displayName}=${JSON.stringify(ctx.value)}`)
                  .join(", ")}
                {"]"}
              </span>
            )}
          </li>
        ))}
      </ul>
      {inspection && (
        <div style={{ marginTop: 12, border: "1px solid #ccc", padding: 8 }}>
          <div>
            <strong>Inspecting:</strong> {inspection.snapshot.displayName}{" "}
            <button onClick={() => setInspection(null)}>Close</button>
          </div>
          <div>
            <strong>hookNames:</strong>{" "}
            {inspection.hookNames
              ? JSON.stringify(inspection.hookNames)
              : "unavailable (not a plain function component, or React internals not accessible here)"}
          </div>
        </div>
      )}
    </div>
  );
}

// function StateShapeProbe() {
//   const [obj] = useState({ nested: { a: 1 }, label: "hi" });
//   const [arr] = useState([1, 2, 3]);
//   return <p>State shape probe</p>;
// }

const ThemeContext = createContext("light");
ThemeContext.displayName = "ThemeContext";

function ContextProbe() {
  const theme = useContext(ThemeContext);
  return <p>Theme: {theme}</p>;
}

export function App() {
  const [showGreeting, setShowGreeting] = useState(true);

  return (
    <div>
      <h1>React Insight Playground</h1>
      <Counter />
      {/* <StateShapeProbe /> */}
      <button onClick={() => setShowGreeting((v) => !v)}>
        {showGreeting ? "Unmount" : "Mount"} Greeting
      </button>
      {showGreeting && <Greeting />}
      <InsightDebugPanel />
    </div>
  );
}