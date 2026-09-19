import type { DurableObjectNamespace } from "@cloudflare/workers-types";

export type SessionStore = {
  practice(id: string): Promise<string | null>;
  save(id: string, practiceId: string, expires: number): Promise<void>;
  quota(key: string, limit: number, seconds: number): Promise<boolean>;
};
export async function sessionStore(): Promise<SessionStore> {
  const { env } = await import("cloudflare:workers");
  const namespace = env.DEMO_SESSIONS as DurableObjectNamespace | undefined;
  if (!namespace) throw new Error("Demo session storage is not configured.");
  async function call(name: string, body: object): Promise<unknown> {
    const response = await namespace!
      .get(namespace!.idFromName(name))
      .fetch("https://session.internal", {
        method: "POST",
        body: JSON.stringify(body),
      });
    if (!response.ok) throw new Error("Demo session storage is unavailable.");
    return response.json();
  }
  return {
    practice: async (id) => (await call("session:" + id, { action: "read" })) as string | null,
    save: async (id, practiceId, expires) => {
      await call("session:" + id, { action: "save", practiceId, expires });
    },
    quota: async (key, limit, seconds) => {
      const bucket = Math.floor(Date.now() / 1000 / seconds);
      return (await call("quota:" + key + ":" + bucket, {
        action: "quota",
        limit,
        expires: (bucket + 1) * seconds,
      })) as boolean;
    },
  };
}
export async function takeQuota(store: SessionStore, key: string, limit: number, seconds: number) {
  return store.quota(key, limit, seconds);
}
