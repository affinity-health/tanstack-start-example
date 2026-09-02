import { Bot, CircleAlert, CircleCheck, CircleDashed } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type {
  HostedMedication,
  HostedPatient,
  PrescriptionDraft,
} from "../../lib/patient-workflow";
import {
  registerDocumentWebMcpTools,
  type WebMcpRegistrationStatus,
  type WebMcpResult,
  type WebMcpTool,
} from "../../lib/webmcp";

type AgentDraft = Omit<PrescriptionDraft, "medicationId" | "patientId" | "returnUrl" | "route">;

type PrescribingToolsProps = {
  medications: HostedMedication[];
  onPrepare(draft: AgentDraft & { medicationId: string; patientId: string }): void;
  patients: HostedPatient[];
};

const statusCopy: Record<WebMcpRegistrationStatus, string> = {
  active: "2 prescribing tools ready",
  error: "Tool registration failed",
  registering: "Registering prescribing tools",
  unsupported: "Human confirmation ready",
};

export function PrescribingTools({ medications, onPrepare, patients }: PrescribingToolsProps) {
  const [status, setStatus] = useState<WebMcpRegistrationStatus>("registering");
  const tools = useMemo(
    () => createPrescribingTools({ medications, onPrepare, patients }),
    [medications, onPrepare, patients],
  );

  useEffect(() => {
    const registration = registerDocumentWebMcpTools(tools, setStatus);
    return registration.dispose;
  }, [tools]);

  const StatusIcon =
    status === "active" ? CircleCheck : status === "error" ? CircleAlert : CircleDashed;

  return (
    <aside className={`agent-tools-status is-${status}`} aria-label="Browser prescribing tools">
      <span className="agent-tools-mark">
        <Bot aria-hidden size={17} />
      </span>
      <span>
        <strong>Agent-ready Test draft</strong>
        <small>An agent may fill the form. Only the clinician can confirm order creation.</small>
      </span>
      <span className="agent-tools-state" role="status">
        <StatusIcon aria-hidden size={15} />
        {statusCopy[status]}
      </span>
    </aside>
  );
}

export function createPrescribingTools({
  medications,
  onPrepare,
  patients,
}: PrescribingToolsProps): WebMcpTool[] {
  return [
    {
      name: "inspect_affinity_test_options",
      title: "Inspect Affinity Test options",
      description:
        "Lists the patients and orderable formulations already visible in the authenticated Affinity Test form.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true },
      execute() {
        return result("Returned the visible Affinity Test patients and formulations.", {
          environment: "Affinity Test",
          medications: medications.map(({ dosageForm, name, route, strength }) => ({
            dosageForm,
            name,
            route,
            strength,
          })),
          patients: patients.map(({ name, state }) => ({ name, state })),
        });
      },
    },
    {
      name: "prepare_test_prescription_draft",
      title: "Prepare an Affinity Test prescription draft",
      description:
        "Copies clinician-supplied prescription details into the visible Affinity Test form. It cannot confirm, create, sign, or transmit an order.",
      inputSchema: {
        type: "object",
        properties: {
          patient: { type: "string", description: "Exact patient name from the options tool." },
          medication: {
            type: "string",
            description: "Exact formulation name from the options tool.",
          },
          dose: { type: "string", maxLength: 40 },
          doseUnit: { type: "string", maxLength: 40 },
          frequency: { type: "string", maxLength: 120 },
          quantity: { type: "number", exclusiveMinimum: 0 },
          quantityUnit: { type: "string", maxLength: 40 },
          daysSupply: { type: "integer", minimum: 1, maximum: 365 },
          refills: { type: "integer", minimum: 0, maximum: 99 },
          directions: { type: "string", minLength: 1, maxLength: 1000 },
        },
        required: [
          "patient",
          "medication",
          "dose",
          "doseUnit",
          "frequency",
          "quantity",
          "quantityUnit",
          "daysSupply",
          "refills",
          "directions",
        ],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      execute(input) {
        const patient = patients.find((item) => item.name === input.patient);
        const medication = medications.find((item) => item.name === input.medication);
        if (!patient) return error("No Affinity Test patient matched that exact name.");
        if (!medication) return error("No orderable Affinity Test formulation matched that name.");

        const draft = readDraft(input, patient.id, medication.id);
        if (!draft) return error("The draft details were incomplete or outside the safe schema.");
        onPrepare(draft);
        return result(
          `Prepared the visible Test draft for ${patient.name}. A clinician must review and confirm it.`,
          {
            confirmationRequired: true,
            environment: "Affinity Test",
            orderCreated: false,
            patient: patient.name,
          },
        );
      },
    },
  ];
}

function readDraft(
  input: Record<string, unknown>,
  patientId: string,
  medicationId: string,
): (AgentDraft & { patientId: string; medicationId: string }) | undefined {
  const stringKeys = ["directions", "dose", "doseUnit", "frequency", "quantityUnit"] as const;
  if (stringKeys.some((key) => typeof input[key] !== "string" || !input[key])) return undefined;
  if (
    typeof input.quantity !== "number" ||
    input.quantity <= 0 ||
    typeof input.daysSupply !== "number" ||
    !Number.isInteger(input.daysSupply) ||
    input.daysSupply < 1 ||
    input.daysSupply > 365 ||
    typeof input.refills !== "number" ||
    !Number.isInteger(input.refills) ||
    input.refills < 0 ||
    input.refills > 99
  )
    return undefined;

  return {
    daysSupply: input.daysSupply,
    directions: input.directions as string,
    dose: input.dose as string,
    doseUnit: input.doseUnit as string,
    frequency: input.frequency as string,
    medicationId,
    patientId,
    quantity: input.quantity,
    quantityUnit: input.quantityUnit as string,
    refills: input.refills,
  };
}

function result(text: string, structuredContent: Record<string, unknown>): WebMcpResult {
  return { content: [{ type: "text", text }], structuredContent };
}

function error(text: string): WebMcpResult {
  return { content: [{ type: "text", text }], isError: true };
}
