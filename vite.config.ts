import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

export default defineConfig({
  plugins: [tailwindcss(), tanstackStart(), nitro({ preset: "bun" }), react()],
  server: {
    host: "127.0.0.1",
    port: Number(process.env.PORT ?? process.env.DEV_SERVICE_PORT ?? 3001),
    strictPort: true,
  },
});
