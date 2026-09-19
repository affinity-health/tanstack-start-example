const seconds = 12 * 60 * 60;
const encoder = new TextEncoder();
export type Visitor = { id: string; expires: number };

async function key(secret: string) {
  if (secret.length < 32) throw new Error("Demo session signing is not configured.");
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}
export async function signVisitor(visitor: Visitor, secret: string) {
  const value = visitor.id + "." + visitor.expires;
  const signature = await crypto.subtle.sign("HMAC", await key(secret), encoder.encode(value));
  return (
    value +
    "." +
    Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("")
  );
}
export async function verifyVisitor(
  token: string,
  secret: string,
  now = Math.floor(Date.now() / 1000),
): Promise<Visitor | null> {
  const [id, expires, signature, extra] = token.split(".");
  if (
    extra !== undefined ||
    !/^[a-f0-9-]{36}$/.test(id ?? "") ||
    !/^\d{10}$/.test(expires ?? "") ||
    !/^[a-f0-9]{64}$/.test(signature ?? "")
  )
    return null;
  if (Number(expires) <= now || Number(expires) > now + seconds) return null;
  const valid = await crypto.subtle.verify(
    "HMAC",
    await key(secret),
    Uint8Array.from(signature.match(/../g)!, (byte) => parseInt(byte, 16)),
    encoder.encode(id + "." + expires),
  );
  return valid ? { id, expires: Number(expires) } : null;
}
export function newVisitor(): Visitor {
  return { id: crypto.randomUUID(), expires: Math.floor(Date.now() / 1000) + seconds };
}
export function cookieName(request: Request) {
  // The Harbor cutover starts a new workspace instead of reusing a practice owned by the old platform.
  return new URL(request.url).protocol === "https:"
    ? "__Host-demo-session-harbor"
    : "demo-session-harbor-local";
}
export function sessionCookie(request: Request, token: string) {
  return `${cookieName(request)}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${seconds}${new URL(request.url).protocol === "https:" ? "; Secure" : ""}`;
}
