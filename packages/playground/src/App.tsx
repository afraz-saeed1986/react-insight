import { createContext, useContext, useState } from "react";

import { DevtoolsPanel } from "@react-insight/devtools";

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
      <button onClick={() => setShowGreeting((v) => !v)}>
        {showGreeting ? "Unmount" : "Mount"} Greeting
      </button>
      {showGreeting && <Greeting />}
      <ThemeContext.Provider value="dark">
        <ContextProbe />
      </ThemeContext.Provider>
      <DevtoolsPanel />
    </div>
  );
}