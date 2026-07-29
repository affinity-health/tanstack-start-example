export function requestOrigin(request: Request, publicOrigin?: string) {
  const url = new URL(request.url);
  const forwardedHost = firstHeaderValue(request.headers.get("x-forwarded-host")) ?? url.host;
  const configuredOrigin = parseOrigin(publicOrigin);
  if (configuredOrigin && forwardedHost === configuredOrigin.host) {
    return configuredOrigin.origin;
  }

  const forwardedProtocol =
    firstHeaderValue(request.headers.get("x-forwarded-proto")) ?? cloudflareVisitorScheme(request);
  if (!forwardedProtocol || !["http", "https"].includes(forwardedProtocol)) return url.origin;

  try {
    return new URL(`${forwardedProtocol}://${forwardedHost}`).origin;
  } catch {
    return url.origin;
  }
}

function parseOrigin(value?: string) {
  if (!value) return;
  try {
    return new URL(value);
  } catch {
    return;
  }
}

function cloudflareVisitorScheme(request: Request) {
  const visitor = request.headers.get("cf-visitor");
  if (!visitor) return;
  try {
    const value = JSON.parse(visitor) as { scheme?: unknown };
    return typeof value.scheme === "string" ? value.scheme : undefined;
  } catch {
    return;
  }
}

function firstHeaderValue(value: string | null) {
  return value?.split(",", 1)[0]?.trim().toLowerCase();
}
