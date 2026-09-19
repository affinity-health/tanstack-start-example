import { appPath } from "../../lib/app-path";
import { createAffinity } from "../affinity/client";
import { sessionStore, takeQuota } from "./store";
import { cookieName, verifyVisitor } from "./token";

export async function visitor(request: Request) {
  const token = request.headers
    .get("cookie")
    ?.split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(cookieName(request) + "="))
    ?.split("=")[1];
  if (!token) return null;
  return verifyVisitor(token, process.env.DEMO_SESSION_SECRET ?? "");
}
export async function getSession(request: Request) {
  const user = await visitor(request);
  if (!user) return null;
  const practiceId = await (await sessionStore()).practice(user.id);
  return practiceId ? { ...user, practiceId } : null;
}
export async function hasSession(request: Request) {
  return !!(await getSession(request));
}

export async function unlock(request: Request): Promise<Response> {
  const headers = { "Cache-Control": "private, no-store" };
  const failure = (error: string, status: number) => Response.json({ error }, { status, headers });
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return failure("Cross-origin request rejected.", 403);
  const user = await visitor(request);
  if (!user)
    return new Response(null, {
      status: 303,
      headers: { ...headers, Location: appPath("/unlock") },
    });
  if (await getSession(request))
    return new Response(null, { status: 303, headers: { ...headers, Location: appPath("/") } });
  try {
    const text = await request.text();
    if (text.length > 1024) return failure("Request too large.", 413);
    const form = new URLSearchParams(text);
    if (form.get("synthetic") !== "yes")
      return failure("Confirm that this is a synthetic Test workspace.", 400);
    const db = await sessionStore();
    const ip = request.headers.get("cf-connecting-ip") ?? "local";
    // Salt the IP before storing a daily quota key. Never store visitor addresses.
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(process.env.DEMO_SESSION_SECRET + ip),
    );
    const ipHash = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join(
      "",
    );
    if (
      !(await takeQuota(db, "start:" + ipHash, 5, 86400)) ||
      !(await takeQuota(db, "starts", 100, 86400))
    )
      return failure("Today's demo creation limit has been reached. Try again tomorrow.", 429);
    const affinity = createAffinity();
    const practice = await affinity.practices.create(
      {
        name: "Demo Practice " + user.id.slice(0, 8),
        externalId: "public-demo-" + user.id,
        address: {
          line1: "100 Test Street",
          city: "San Francisco",
          state: "CA",
          postalCode: "94107",
          country: "US",
        },
        supportEmail: "demo@example.test",
        supportPhone: "+14155550100",
        attestations: {
          authorizedPracticeRelationship: true,
          authorizedPhiTransfer: true,
          minimumNecessaryPhi: true,
          providerDataAccuracy: true,
        },
      },
      { idempotencyKey: "demo-practice-" + user.id },
    );
    if (practice.livemode || practice.liveEnabled) throw new Error("Unexpected practice mode.");
    await db.save(user.id, practice.id, user.expires);
    return new Response(null, { status: 303, headers: { ...headers, Location: appPath("/") } });
  } catch {
    return new Response(null, {
      status: 303,
      headers: { ...headers, Location: appPath("/unlock?error=setup") },
    });
  }
}
