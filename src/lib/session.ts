// An Affinity 401 is an API-key error, not an expired demo session.
export function requireBrowserSession(data: { code?: string }) {
  if (data.code === "SESSION_REQUIRED" && typeof window !== "undefined") {
    window.location.replace("/unlock");
    throw new Error("Opening PIN login…");
  }
}
