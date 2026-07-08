import { definePlugin } from "../definePlugin";

const disposers: Array<() => void> = [];

export const loggerPlugin = definePlugin({
  name: "logger",

  setup(context) {
    disposers.push(
      context.on("plugin:registered", ({ name }) => {
        console.log(`[React Insight] Plugin registered: ${name}`);
      }),
    );

    disposers.push(
      context.on("plugin:removed", ({ name }) => {
        console.log(`[React Insight] Plugin removed: ${name}`);
      }),
    );
  },

  destroy() {
    for (const dispose of disposers) {
      dispose();
    }

    disposers.length = 0;

    console.log("[React Insight] Logger destroyed.");
  },
});
