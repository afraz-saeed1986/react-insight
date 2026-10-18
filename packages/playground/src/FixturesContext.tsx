import { createContext, useContext, useState, type ReactNode } from "react";

const ProbeContext = createContext("a");

function ContextOnlyConsumer() {
  const value = useContext(ProbeContext);
  return <span>context-only consumer: {value}</span>;
}

function ProbeProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState("a");
  return (
    <ProbeContext.Provider value={value}>
      <button type="button" onClick={() => setValue((v) => (v === "a" ? "b" : "a"))}>
        toggle context value
      </button>
      {children}
    </ProbeContext.Provider>
  );
}

export function FixtureContextOnly() {
  return (
    <ProbeProvider>
      <ContextOnlyConsumer />
    </ProbeProvider>
  );
}