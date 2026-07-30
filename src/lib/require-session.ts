import { redirect } from "@tanstack/react-router";

import { getSession } from "./session.functions";

export type WorkspaceSession = NonNullable<Awaited<ReturnType<typeof getSession>>>;

export async function requireSession() {
  const session = await getSession();

  if (!session) {
    throw redirect({ to: "/login" });
  }

  return { session };
}
