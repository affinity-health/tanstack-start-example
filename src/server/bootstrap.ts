import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { redirect } from "@tanstack/react-router";
import { hasSession } from "./auth/session";
import { apiHandler, json } from "./api-handler";
import { withMedicationImages } from "./affinity/images";
import { listAll } from "./affinity/pagination";
import type { Bootstrap } from "../features/prescribing/data/reads";

export const requireSession = createServerFn({ method: "GET" }).handler(async () => {
  if (!(await hasSession(getRequest()))) throw redirect({ href: "/unlock" });
});

// Returning this promise from the route loader lets Start stream the shell first.
export const loadWorkspace = createServerFn({ method: "GET" }).handler(
  async (): Promise<Bootstrap> => {
    const request = getRequest();
    const url = new URL("/api/practices?mode=test", request.url);
    const response = await apiHandler(
      new Request(url, { headers: request.headers }),
      async ({ affinity }) => {
        const practices = await listAll((cursor) =>
          affinity.practices.list({ limit: 100, startingAfter: cursor }),
        );
        const practiceId = practices.data[0]?.id;
        // Catalog failures stay recoverable in the picker without hiding the practices.
        const catalog = practiceId
          ? await affinity.catalog.list({ practiceId, limit: 25 }).catch(() => undefined)
          : undefined;
        return json({
          practices,
          ...(catalog
            ? { catalog: { ...catalog, data: catalog.data.map(withMedicationImages) } }
            : {}),
        });
      },
      { practiceRequired: false },
    );
    return (await response.json()) as Bootstrap;
  },
);
