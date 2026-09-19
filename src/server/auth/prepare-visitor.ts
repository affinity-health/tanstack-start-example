import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { visitor } from "./session";
import { newVisitor, sessionCookie, signVisitor } from "./token";

// Keep server-only helpers out of the module imported by the welcome route's loader.
export const prepareVisitor = createServerFn({ method: "GET" }).handler(async () => {
  const request = getRequest();
  setResponseHeader("Cache-Control", "private, no-store");
  if (await visitor(request)) return;
  const token = await signVisitor(newVisitor(), process.env.DEMO_SESSION_SECRET ?? "");
  setResponseHeader("Set-Cookie", sessionCookie(request, token));
});
