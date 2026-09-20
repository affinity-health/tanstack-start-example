import { createServerFn } from "@tanstack/react-start";
import { withWorkspace } from "../../server/context";

export const getWorkspace = createServerFn({ method: "GET" }).handler(() =>
  withWorkspace(async ({ affinity, practiceId, id }) => ({
    practice: await affinity.practices.retrieve(practiceId),
    sessionId: id,
  })),
);
