import { createFileRoute } from "@tanstack/react-router";
import { hasSession } from "../../server/auth/session";
import { json } from "../../server/api-handler";

export const Route = createFileRoute("/api/medication-image")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!(await hasSession(request)))
          return json({ error: "Enter the demo PIN to continue." }, 401);
        const apiUrl = process.env.AFFINITY_API_URL;
        const key = process.env.DEVBOX_API_KEY;
        if (!apiUrl || !key)
          return json({ error: "Protected medication images are not configured." }, 404);
        const path = new URL(request.url).searchParams.get("path") ?? "";
        const base = new URL(apiUrl);
        const target = new URL(path, base.origin);
        // A fixed origin and CDN path prevent this authenticated route from becoming an open proxy.
        if (
          !path.startsWith("/cdn/") ||
          target.origin !== base.origin ||
          !target.pathname.startsWith("/cdn/") ||
          /[\\]|%2e|%2f|%5c/i.test(path) ||
          target.username ||
          target.password ||
          target.hash
        )
          return json({ error: "Invalid medication image path." }, 400);
        try {
          const response = await fetch(target, {
            headers: { "X-Api-Key": key, Accept: "image/*" },
            redirect: "manual",
            signal: AbortSignal.timeout(15_000),
          });
          const type = response.headers.get("content-type")?.split(";")[0] ?? "";
          if (!response.ok || !/^image\/(png|jpeg|webp|avif|gif|svg\+xml)$/.test(type))
            return json({ error: "Medication image is unavailable." }, 502);
          return new Response(response.body, {
            headers: {
              "Content-Type": type,
              "Cache-Control": "private, max-age=3600",
              Vary: "Cookie",
              "X-Content-Type-Options": "nosniff",
              "Content-Security-Policy": "default-src 'none'; sandbox",
            },
          });
        } catch {
          return json({ error: "Medication image is unavailable." }, 502);
        }
      },
    },
  },
});
