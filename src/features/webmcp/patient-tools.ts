import {
  findPatient,
  prepareMedicationReview,
  searchPatients,
  type PatientFilter,
} from "../../lib/patient-workflow";
import type { WebMcpResult, WebMcpTool } from "../../lib/webmcp";

type PatientToolActions = {
  openPatient(patientId: string, message: string): void;
  prepareReview(path: string, message: string): void;
  searchPatients(query: string, status: PatientFilter, message: string): void;
};

export function createPatientTools(actions: PatientToolActions): WebMcpTool[] {
  return [
    {
      name: "search_synthetic_patients",
      title: "Search synthetic patients",
      description:
        "Searches Northstar's local synthetic patient directory and applies the same filters in the visible Patients screen.",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            maxLength: 120,
            description: "Optional name, state, care plan, email, phone, or synthetic patient ID.",
          },
          status: {
            type: "string",
            enum: ["all", "eligible", "review"],
            description: "Optional eligibility filter. Defaults to all.",
          },
        },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute(input) {
        const query = typeof input.query === "string" ? input.query : "";
        const status = readPatientFilter(input.status);
        const matches = searchPatients({ query, status });
        const message = `Agent search found ${matches.length} synthetic patient${matches.length === 1 ? "" : "s"}.`;
        actions.searchPatients(query, status, message);

        return result(message, {
          count: matches.length,
          patients: matches.map(({ carePlan, id, name, state, status: patientStatus }) => ({
            carePlan,
            id,
            name,
            state,
            status: patientStatus,
          })),
          syntheticData: true,
        });
      },
    },
    {
      name: "open_synthetic_patient",
      title: "Open a synthetic patient",
      description:
        "Selects one synthetic patient by exact name or ID and opens that patient's details in the visible Patients screen.",
      inputSchema: {
        type: "object",
        properties: {
          patient: {
            type: "string",
            description: "The exact synthetic patient name or ID returned by the search tool.",
          },
        },
        required: ["patient"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute(input) {
        const identifier = typeof input.patient === "string" ? input.patient : "";
        const patient = findPatient(identifier);
        if (!patient) return errorResult("No synthetic patient matched that ID or exact name.");

        const message = `Agent opened ${patient.name}'s synthetic patient record.`;
        actions.openPatient(patient.id, message);
        return result(message, {
          patient: {
            carePlan: patient.carePlan,
            id: patient.id,
            name: patient.name,
            state: patient.state,
            status: patient.status,
          },
          syntheticData: true,
        });
      },
    },
    {
      name: "prepare_medication_review",
      title: "Prepare a medication review",
      description:
        "Prepares Northstar's Affinity Test review context for an eligible synthetic patient. It does not create, sign, or submit a prescription.",
      inputSchema: {
        type: "object",
        properties: {
          patient: {
            type: "string",
            description: "The exact synthetic patient name or ID returned by the search tool.",
          },
        },
        required: ["patient"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute(input) {
        const identifier = typeof input.patient === "string" ? input.patient : "";
        const preparation = prepareMedicationReview(identifier);
        if (!preparation.ok) return errorResult(preparation.error);

        const message = `Prepared ${preparation.patient.name}'s medication review. No order was created.`;
        actions.prepareReview(preparation.path, message);
        return result(message, {
          nextStep: "The clinician reviews the visible form and decides whether to continue.",
          patientId: preparation.patient.id,
          path: preparation.path,
          prescriptionCreated: false,
          syntheticData: true,
        });
      },
    },
  ];
}

function readPatientFilter(value: unknown): PatientFilter {
  return value === "eligible" || value === "review" ? value : "all";
}

function result(text: string, structuredContent?: Record<string, unknown>): WebMcpResult {
  return {
    content: [{ type: "text", text }],
    ...(structuredContent ? { structuredContent } : {}),
  };
}

function errorResult(text: string): WebMcpResult {
  return {
    content: [{ type: "text", text }],
    isError: true,
  };
}
