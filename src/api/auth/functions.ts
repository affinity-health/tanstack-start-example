import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { startDemo } from "../../server/auth/session";

export const beginDemo = createServerFn({ method: "POST" })
  .validator(z.object({ synthetic: z.literal(true) }))
  .handler(async () => {
    await startDemo(getRequest());
    return { ready: true };
  });
