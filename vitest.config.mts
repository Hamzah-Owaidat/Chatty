import { defineConfig, type Plugin } from "vitest/config";
import react from "@vitejs/plugin-react";
import { transform as svgrTransform } from "@svgr/core";
import { transform as esbuildTransform } from "esbuild";
import { readFile } from "node:fs/promises";
import path from "node:path";

// next.config.ts compiles .svg imports into React components with @svgr/webpack; mirror that here.
function svgrForTests(): Plugin {
  return {
    name: "svgr-for-tests",
    enforce: "pre",
    async load(id) {
      if (!id.endsWith(".svg")) return null;
      const source = await readFile(id, "utf8");
      const jsx = await svgrTransform(
        source,
        { plugins: ["@svgr/plugin-jsx"], jsxRuntime: "automatic" },
        { componentName: "SvgIcon" },
      );
      const { code } = await esbuildTransform(jsx, { loader: "jsx", format: "esm", jsx: "automatic" });
      return { code, map: null };
    },
  };
}

export default defineConfig({
  plugins: [svgrForTests(), react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    environment: "jsdom",
    include: ["tests/component/**/*.test.{ts,tsx}"],
    setupFiles: ["tests/component/setup.ts"],
    css: false,
    restoreMocks: true,
  },
});
