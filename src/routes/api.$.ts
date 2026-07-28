import { createFileRoute } from "@tanstack/react-router";

async function handle({ request }: { request: Request }) {
  const { api } = await import("../server/api");
  return api.fetch(request);
}

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: {
      GET: handle,
      POST: handle,
    },
  },
});
