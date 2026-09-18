import page from "./src/index.html";
import { handleApi } from "./src/api";

const server = Bun.serve({
  hostname: "127.0.0.1",
  port: Number(process.env.PORT ?? process.env.DEV_SERVICE_PORT ?? 3001),
  development: process.env.NODE_ENV !== "production",
  routes: { "/": page },
  fetch(request) {
    // This unauthenticated playground is local-only, including DNS rebinding protection.
    const hostname = new URL(request.url).hostname;
    if (hostname !== "127.0.0.1" && hostname !== "localhost")
      return new Response("Local access only", { status: 403 });
    if (new URL(request.url).pathname.startsWith("/api/")) return handleApi(request);
    return new Response("Not found", { status: 404 });
  },
});
console.log(`Affinity playground: ${server.url}`);
