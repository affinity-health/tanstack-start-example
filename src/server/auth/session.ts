import { createAffinity } from "../affinity/client";
import { getAuth } from "./auth";
import { sessionStore, takeQuota } from "./store";

export async function getSession(request: Request) {
  const auth = await getAuth(request);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user.isAnonymous) return null;
  const practiceId = await (await sessionStore()).practice(session.user.id);
  return practiceId ? { id: session.user.id, practiceId } : null;
}
export async function hasSession(request: Request) {
  return !!(await getSession(request));
}

export async function startDemo(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    throw new Error("Cross-origin request rejected.");
  const existing = await getSession(request);
  if (existing) return;
  const store = await sessionStore();
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(
      process.env.DEMO_SESSION_SECRET + (request.headers.get("cf-connecting-ip") ?? "local"),
    ),
  );
  const ip = Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
  if (
    !(await takeQuota(store, "start:" + ip, 5, 86400)) ||
    !(await takeQuota(store, "starts", 100, 86400))
  )
    throw new Error("Today's demo creation limit has been reached. Try again tomorrow.");
  const auth = await getAuth(request);
  const session = await auth.api.getSession({ headers: request.headers });
  const user = session?.user.isAnonymous
    ? session.user
    : (await auth.api.signInAnonymous({ headers: request.headers })).user;
  const practice = await createAffinity().practices.create(
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
  const expires = session?.session.expiresAt.getTime() ?? Date.now() + 12 * 60 * 60 * 1000;
  await store.save(user.id, practice.id, Math.floor(expires / 1000));
}
