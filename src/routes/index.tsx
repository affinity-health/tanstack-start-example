import { Await, createFileRoute } from "@tanstack/react-router";
import { PrescribingApp } from "../features/prescribing/prescribing-app";
import { loadWorkspace, requireSession } from "../server/bootstrap";

export const Route = createFileRoute("/")({
  headers: () => ({ "Cache-Control": "private, no-store" }),
  beforeLoad: () => requireSession(),
  loader: () => ({ workspace: loadWorkspace() }),
  component: Index,
});

function Index() {
  const { workspace } = Route.useLoaderData();
  return (
    <Await promise={workspace} fallback={<PrescribingApp pending />}>
      {(initial) => <PrescribingApp initial={initial} />}
    </Await>
  );
}
