import { Runtime, loggerPlugin } from "@react-insight/core";
import { greetingPlugin } from "./plugins/greetingPlugin";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App element not found.");
}

app.innerHTML = `
  <h1>React Insight Playground</h1>
`;

console.log("Playground started.");

const runtime = new Runtime();

await runtime.registerPlugin(loggerPlugin());
await runtime.registerPlugin(greetingPlugin);

// ارسال چند Event آزمایشی
runtime.emit("app:started", {
  timestamp: Date.now(),
});

runtime.emit("user:login", {
  id: 1,
  name: "Saeed",
});

runtime.emit("button:click", {
  id: "save-button",
});

console.log("Events emitted.");
console.log(runtime.plugins);

await runtime.destroy();
try {
  runtime.emit("app:started", {
    timestamp: Date.now(),
  });
} catch (error) {
  console.error(error);
}
