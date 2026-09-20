import { createFileRoute } from "@tanstack/react-router";
import { PrescriptionForm } from "../../../features/prescribing/components/prescription-form";
import { useWorkspace } from "../../../features/workspace/workspace-layout";

export const Route = createFileRoute("/_workspace/prescribe/")({ component: Prescribe });
function Prescribe() {
  const workspace = useWorkspace();
  return <PrescriptionForm {...workspace} />;
}
