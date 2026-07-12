import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",

    include: ["src/**/*.test.ts"],

    coverage: {
      provider: "v8",

      reporter: ["text", "html", "lcov"],

      reportsDirectory: "./coverage",

      clean: true,

      include: ["src/**/*.{ts,tsx}"],

      exclude: [
        "**/*.test.ts",
        "**/*.d.ts",
        "**/index.ts",

        "src/insight/**",
        "src/session/**",
        "src/inspector/**",
        "src/internal/**",
      ],

      thresholds: {
        statements: 90,
        branches: 80,
        functions: 85,
        lines: 90,
      },
    },
  },
});
