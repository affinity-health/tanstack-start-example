import { defineConfig } from "vite-plus";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  lint: {
    plugins: ["typescript", "unicorn", "oxc"],
    categories: { correctness: "error" },
    rules: {
      "typescript/await-thenable": "off",
      "typescript/no-base-to-string": "off",
      "typescript/restrict-template-expressions": "off",
    },
    ignorePatterns: [
      "node_modules/**",
      ".output/**",
      ".tanstack/**",
      "dist/**",
      "src/routeTree.gen.ts",
    ],
    env: { builtin: true },
    options: { typeAware: true, typeCheck: true },
  },
  fmt: {
    ignorePatterns: [
      "node_modules/**",
      ".output/**",
      ".tanstack/**",
      "dist/**",
      "src/routeTree.gen.ts",
    ],
  },
  envDir: false,
  // Keep the Worker dev optimizer separate from standalone Vite processes.
  cacheDir: `node_modules/.vite-${process.env.PORT ?? "standalone"}`,
  base: process.env.VITE_BASE_PATH ?? "/",
  build: { rolldownOptions: { external: ["cloudflare:workers"] } },
  plugins: [tailwindcss(), tanstackStart({ server: { entry: "./server.ts" } }), react()],
  server: {
    host: "127.0.0.1",
    port: Number(process.env.PORT ?? 3001),
    strictPort: true,
    allowedHosts: ["affinity.harbr.run"],
  },
});
