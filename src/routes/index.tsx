import { createFileRoute } from "@tanstack/react-router";
import { PrescribingApp } from "../features/prescribing/prescribing-app";
import { loadWorkspace, requireSession } from "../server/bootstrap";

export const Route = createFileRoute("/")({
  headers: () => ({ "Cache-Control": "private, no-store" }),
  beforeLoad: () => requireSession(),
  loader: async () => ({ workspace: await loadWorkspace() }),
  component: Index,
});

function Index() {
  const { workspace } = Route.useLoaderData();
  return <PrescribingApp initial={workspace} />;
}
