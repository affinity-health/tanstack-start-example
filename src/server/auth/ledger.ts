import type { DurableObjectState } from "@cloudflare/workers-types";

// Private Worker binding, never an HTTP route. Each session or quota bucket has its own object.
export class DemoSessions {
  constructor(private readonly ctx: DurableObjectState) {}
  async fetch(request: Request) {
    const input = (await request.json()) as {
      action: string;
      practiceId: string;
      expires: number;
      limit: number;
    };
    const result = await this.ctx.storage.transaction(async (storage) => {
      if (input.action === "read") {
        const session = await storage.get<{ practiceId: string; expires: number }>("session");
        return session && session.expires > Date.now() / 1000 ? session.practiceId : null;
      }
      if (input.action === "save") {
        const existing = await storage.get<{ practiceId: string }>("session");
        if (existing && existing.practiceId !== input.practiceId)
          throw new Error("Session already assigned.");
        await storage.put("session", { practiceId: input.practiceId, expires: input.expires });
        await storage.setAlarm(input.expires * 1000);
        return true;
      }
      if (input.action === "quota") {
        const used = (await storage.get<number>("used")) ?? 0;
        if (used >= input.limit) return false;
        await storage.put("used", used + 1);
        await storage.setAlarm(input.expires * 1000);
        return true;
      }
      throw new Error("Unknown session operation.");
    });
    return Response.json(result);
  }
  async alarm() {
    await this.ctx.storage.deleteAll();
  }
}
