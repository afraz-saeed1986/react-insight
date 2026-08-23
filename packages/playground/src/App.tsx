import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useInsight } from "@react-insight/react";

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
            {c.displayName} — status: {c.status}, renders: {c.renderCount}
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

      {/* <ThemeContext.Provider value="dark">
            <ContextProbe />
      </ThemeContext.Provider> */}
    </div>
  );
}