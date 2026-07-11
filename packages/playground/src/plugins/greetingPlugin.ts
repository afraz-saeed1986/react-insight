import { definePlugin } from "@react-insight/core";

export const greetingPlugin = definePlugin({
  name: "greeting",

  setup() {
    console.log("[Greeting] Hello from Playground plugin!");
  },

  destroy() {
    console.log("[Greeting] Goodbye!");
  },
});
