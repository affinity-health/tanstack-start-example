import { createStartHandler, defaultStreamHandler } from "@tanstack/react-start/server";
export { DemoSessions } from "./server/auth/ledger";
const handler = createStartHandler(defaultStreamHandler);
export default {
  fetch(request: Request) {
    // The protected dev gateway terminates HTTPS before the loopback Worker.
    // Use an explicit development origin, never trust caller-supplied forwarding headers.
    const origin = import.meta.env.DEV ? process.env.DEMO_DEV_ORIGIN : undefined;
    if (origin) {
      const url = new URL(request.url);
      request = new Request(new URL(url.pathname + url.search, origin), request);
    }
    return handler(request);
  },
};
