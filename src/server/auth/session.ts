function cookieSettings(request: Request) {
  const url = new URL(request.url);
  const localHttp =
    url.protocol === "http:" &&
    ["localhost", "127.0.0.1"].includes(url.hostname) &&
    !(request as WorkerRequest).runtime?.cloudflare;
  return { name: localHttp ? "demo-session-local" : "__Host-demo-session", secure: !localHttp };
}
const sessionSeconds = 12 * 60 * 60;
const encoder = new TextEncoder();

type WorkerRequest = Request & {
  runtime?: {
    cloudflare?: {
      env: { PIN_ATTEMPTS?: { limit: (input: { key: string }) => Promise<{ success: boolean }> } };
    };
  };
};

function localDevelopment(request: Request) {
  return (
    !process.env.DEMO_PIN &&
    !(request as WorkerRequest).runtime?.cloudflare &&
    ["localhost", "127.0.0.1"].includes(new URL(request.url).hostname)
  );
}

async function signingKey() {
  const secret = process.env.DEMO_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("Demo access is not configured.");
  // Including the PIN invalidates existing sessions when it changes.
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(`${secret}:${process.env.DEMO_PIN}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function hasSession(request: Request): Promise<boolean> {
  if (localDevelopment(request)) return true;
  if (!process.env.DEMO_PIN || !process.env.DEMO_SESSION_SECRET) return false;
  const cookieName = cookieSettings(request).name;
  const token = request.headers
    .get("cookie")
    ?.split("; ")
    .find((part) => part.startsWith(`${cookieName}=`))
    ?.slice(cookieName.length + 1);
  if (!token) return false;
  const [expires, signature, extra] = token.split(".");
  if (extra || !/^\d+$/.test(expires) || !/^[a-f0-9]{64}$/.test(signature ?? "")) return false;
  const remaining = Number(expires) - Math.floor(Date.now() / 1000);
  if (remaining <= 0 || remaining > sessionSeconds) return false;
  try {
    return await crypto.subtle.verify(
      "HMAC",
      await signingKey(),
      Uint8Array.from(signature.match(/../g)!, (byte) => parseInt(byte, 16)),
      encoder.encode(expires),
    );
  } catch {
    return false;
  }
}

export async function unlock(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const headers = { "Cache-Control": "private, no-store" };
  if (request.headers.get("origin") !== url.origin)
    return new Response("Cross-origin request rejected.", { status: 403, headers });
  const pin = process.env.DEMO_PIN;
  if (!pin || !process.env.DEMO_SESSION_SECRET)
    return new Response("Demo access is not configured.", { status: 503, headers });
  const limiter = (request as WorkerRequest).runtime?.cloudflare?.env.PIN_ATTEMPTS;
  if (!limiter && !["localhost", "127.0.0.1"].includes(url.hostname))
    return new Response("Demo access is not configured.", { status: 503, headers });
  if (
    limiter &&
    !(await limiter.limit({ key: request.headers.get("cf-connecting-ip") ?? "unknown" })).success
  )
    return new Response("Too many attempts. Try again in a minute.", {
      status: 429,
      headers: { ...headers, "Retry-After": "60" },
    });
  if (Number(request.headers.get("content-length") ?? 0) > 1024)
    return new Response("Request too large.", { status: 413, headers });
  const submitted = (await request.formData()).get("pin");
  const key = await signingKey();
  const expected = await crypto.subtle.sign("HMAC", key, encoder.encode(pin));
  const valid =
    typeof submitted === "string" &&
    submitted.length <= 128 &&
    (await crypto.subtle.verify("HMAC", key, expected, encoder.encode(submitted)));
  if (!valid)
    return new Response(null, {
      status: 303,
      headers: { ...headers, Location: "/unlock?error=pin" },
    });
  const expires = String(Math.floor(Date.now() / 1000) + sessionSeconds);
  const cookie = cookieSettings(request);
  const signature = Array.from(
    new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(expires))),
    (byte) => byte.toString(16).padStart(2, "0"),
  ).join("");
  return new Response(null, {
    status: 303,
    headers: {
      ...headers,
      Location: "/",
      "Set-Cookie": `${cookie.name}=${expires}.${signature}; Path=/; HttpOnly;${cookie.secure ? " Secure;" : ""} SameSite=Strict; Max-Age=${sessionSeconds}`,
    },
  });
}
