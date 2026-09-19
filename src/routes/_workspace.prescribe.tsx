import { createFileRoute } from "@tanstack/react-router";
import { Workspace } from "../features/prescribing/components/workspace";
import { useWorkspace } from "../features/prescribing/prescribing-app";

export const Route = createFileRoute("/_workspace/prescribe")({ component: Prescribe });
function Prescribe() {
  const workspace = useWorkspace();
  return <Workspace {...workspace} />;
}
