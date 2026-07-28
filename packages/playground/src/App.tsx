import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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

  useEffect(() => {
    const interval = setInterval(() => forceRefresh((n) => n + 1), 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ marginTop: 16, fontFamily: "monospace" }}>
      <button onClick={() => forceRefresh((n) => n + 1)}>Refresh snapshot</button>
      <ul>
        {insight.getComponents().map((c) => (
          <li key={c.id}>
            {c.displayName} — status: {c.status}, renders: {c.renderCount}
            {c.hooks.length > 0 && (
              <span> — hooks: [{c.hooks.map((h) => h.kind).join(", ")}]</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}



export function App() {
  const [showGreeting, setShowGreeting] = useState(true);

  return (
    <div>
      <h1>React Insight Playground</h1>
      <Counter />
      <button onClick={() => setShowGreeting((v) => !v)}>
        {showGreeting ? "Unmount" : "Mount"} Greeting
      </button>
      {showGreeting && <Greeting />}
      <InsightDebugPanel />
    </div>
  );
}