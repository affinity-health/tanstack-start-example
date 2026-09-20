import { createFileRoute } from "@tanstack/react-router";
import { PrescriptionForm } from "../../../features/prescribing/components/prescription-form";

export const Route = createFileRoute("/_workspace/prescribe/")({ component: PrescriptionForm });
