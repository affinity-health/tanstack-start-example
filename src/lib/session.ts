import { appPath } from "./app-path";
// An Affinity 401 is an API-key error, not an expired demo session.
export function requireBrowserSession(data: { code?: string }) {
  if (data.code === "SESSION_REQUIRED" && typeof window !== "undefined") {
    window.location.replace(appPath("/unlock"));
    throw new Error("Opening demo…");
  }
}
