import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

export default defineConfig({
  plugins: [
    tailwindcss(),
    tanstackStart(),
    nitro({
      preset: process.env.NITRO_PRESET ?? "bun",
      cloudflare: {
        nodeCompat: true,
        wrangler: {
          name: "affinity-prescribing-demo",
          account_id: "6689e70db2aaff6670c28b7e4d36df02",
          compatibility_date: "2026-09-18",
          workers_dev: true,
          preview_urls: false,
          ratelimits: [
            { name: "PIN_ATTEMPTS", namespace_id: "1001", simple: { limit: 5, period: 60 } },
          ],
        },
      },
    }),
    react(),
  ],
  server: {
    host: "127.0.0.1",
    port: Number(process.env.PORT ?? process.env.DEV_SERVICE_PORT ?? 3001),
    strictPort: true,
  },
});
