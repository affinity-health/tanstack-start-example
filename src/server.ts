import { createStartHandler, defaultStreamHandler } from "@tanstack/react-start/server";
export { DemoSessions } from "./server/auth/ledger";
export default { fetch: createStartHandler(defaultStreamHandler) };
