import { definePlugin } from "../definePlugin";

export function loggerPlugin() {
  const disposers: Array<() => void> = [];

  return definePlugin({
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
}
