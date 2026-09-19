import { createFileRoute } from "@tanstack/react-router";
import { getWorkspace } from "../features/prescribing/prescribing.functions";
import { WorkspaceLayout } from "../features/prescribing/prescribing-app";
import { Button } from "../components/ui/button";

export const Route = createFileRoute("/_workspace")({
  loader: () => getWorkspace(),
  component: Layout,
  pendingComponent: () => (
    <main aria-busy="true">
      <p role="status">Loading workspace…</p>
    </main>
  ),
  errorComponent: ({ error, reset }) => (
    <main>
      <h1>Unable to load workspace</h1>
      <p role="alert">
        {error instanceof Error ? error.message : "Unable to load your Test practice."}
      </p>
      <Button onClick={reset}>Try again</Button>
    </main>
  ),
});
function Layout() {
  const initial = Route.useLoaderData();
  return <WorkspaceLayout initial={initial} />;
}
