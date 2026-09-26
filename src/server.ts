import { createStartHandler, defaultStreamHandler } from "@tanstack/react-start/server";
export { DemoSessions } from "./server/auth/ledger";
const handler = createStartHandler(defaultStreamHandler);
export default {
  async fetch(request: Request) {
    // The protected dev gateway terminates HTTPS before the loopback Worker.
    // Use an explicit development origin, never trust caller-supplied forwarding headers.
    const origin = import.meta.env.DEV ? process.env.DEMO_DEV_ORIGIN : undefined;
    if (origin) {
      const url = new URL(request.url);
      request = new Request(new URL(url.pathname + url.search, origin), request);
    }
    const response = await handler(request);
    const headers = new Headers(response.headers);
    headers.set(
      "Content-Security-Policy",
      "frame-ancestors 'none'; object-src 'none'; base-uri 'self'",
    );
    headers.set("X-Frame-Options", "DENY");
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Referrer-Policy", "no-referrer");
    if (new URL(request.url).protocol === "https:")
      headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};
