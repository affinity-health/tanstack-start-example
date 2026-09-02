import { demoPatients, type DemoPatient } from "./demo-data";

export type PatientFilter = "all" | "eligible" | "review";

export type PatientSearch = {
  query?: string;
  status?: PatientFilter;
};

export type MedicationReviewPreparation =
  | {
      ok: true;
      patient: DemoPatient;
      path: string;
    }
  | {
      ok: false;
      error: string;
    };

export type HostedPatient = { id: string; name: string; state: string };
export type HostedMedication = {
  dosageForm: string;
  id: string;
  name: string;
  route: string;
  strength: string | null;
};
export type HostedWorkflowOptions = {
  medications: HostedMedication[];
  patients: HostedPatient[];
  recommendedPatientId: string | null;
};

export type PrescriptionDraft = {
  compoundingReason?: { category: string; context: string };
  daysSupply: number;
  directions: string;
  dose: string;
  doseUnit: string;
  frequency: string;
  medicationId: string;
  patientId: string;
  quantity: number;
  quantityUnit: string;
  refills: number;
  returnUrl: string;
  route: string;
};

export type HostedOrder = {
  orderId: string;
  prescriptionIds: string[];
  signingSession: { expiresAt: string; url: string };
};

export type PrescribingWorkflowAdapter = {
  readonly source: "synthetic-demo" | "affinity-test";
  loadOptions(signal?: AbortSignal): Promise<HostedWorkflowOptions>;
  createOrder?(draft: PrescriptionDraft, signal?: AbortSignal): Promise<HostedOrder>;
};

export function createSyntheticDemoAdapter(
  patients: readonly DemoPatient[] = demoPatients,
): PrescribingWorkflowAdapter {
  return {
    source: "synthetic-demo",
    async loadOptions() {
      return {
        medications: [],
        patients: patients.map(({ id, name, state }) => ({ id, name, state })),
        recommendedPatientId: patients.find((patient) => patient.status === "Eligible")?.id ?? null,
      };
    },
  };
}

export function createHostedAffinityTestAdapter(
  fetcher: typeof fetch = fetch,
): PrescribingWorkflowAdapter {
  return {
    source: "affinity-test",
    async loadOptions(signal) {
      const response = await fetcher("/api/affinity/headless-options", {
        credentials: "include",
        signal,
      });
      const body: unknown = await response.json();
      if (!response.ok || !isHostedWorkflowOptions(body)) {
        throw new Error(readAdapterError(body, "Test data is unavailable."));
      }
      return body;
    },
    async createOrder(draft, signal) {
      const response = await fetcher("/api/affinity/headless-order", {
        body: JSON.stringify({
          patientId: draft.patientId,
          prescriptions: [
            {
              ...(draft.compoundingReason ? { compoundingReason: draft.compoundingReason } : {}),
              daysSupply: draft.daysSupply,
              directions: draft.directions,
              medicationId: draft.medicationId,
              quantity: draft.quantity,
              quantityUnit: draft.quantityUnit,
              refills: draft.refills,
              structuredSig: {
                dose: draft.dose,
                doseUnit: draft.doseUnit,
                frequency: draft.frequency,
                prn: false,
                route: draft.route,
              },
              substitutionPermitted: false,
            },
          ],
          returnUrl: draft.returnUrl,
        }),
        credentials: "include",
        headers: {
          "content-type": "application/json",
          "idempotency-key": `northstar_${crypto.randomUUID()}`,
        },
        method: "POST",
        signal,
      });
      const body: unknown = await response.json();
      if (!response.ok || !isHostedOrder(body)) {
        throw new Error(readAdapterError(body, "The order could not be created."));
      }
      return body;
    },
  };
}

function isHostedWorkflowOptions(value: unknown): value is HostedWorkflowOptions {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<HostedWorkflowOptions>;
  return (
    Array.isArray(candidate.medications) &&
    Array.isArray(candidate.patients) &&
    (candidate.recommendedPatientId === null || typeof candidate.recommendedPatientId === "string")
  );
}

function isHostedOrder(value: unknown): value is HostedOrder {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<HostedOrder>;
  return (
    typeof candidate.orderId === "string" &&
    Array.isArray(candidate.prescriptionIds) &&
    !!candidate.signingSession &&
    typeof candidate.signingSession.url === "string" &&
    typeof candidate.signingSession.expiresAt === "string"
  );
}

function readAdapterError(value: unknown, fallback: string) {
  if (!value || typeof value !== "object") return fallback;
  const error = (value as { error?: unknown }).error;
  return typeof error === "string" ? error : fallback;
}

export function searchPatients(
  { query = "", status = "all" }: PatientSearch,
  patients: readonly DemoPatient[] = demoPatients,
) {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  return patients.filter((patient) => {
    const matchesQuery =
      !normalizedQuery ||
      [patient.id, patient.name, patient.email, patient.phone, patient.state, patient.carePlan]
        .join(" ")
        .toLocaleLowerCase()
        .includes(normalizedQuery);
    const matchesStatus =
      status === "all" || patient.status.toLocaleLowerCase() === status.toLocaleLowerCase();

    return matchesQuery && matchesStatus;
  });
}

export function findPatient(identifier: string, patients: readonly DemoPatient[] = demoPatients) {
  const normalizedIdentifier = identifier.trim().toLocaleLowerCase();

  return patients.find(
    (patient) =>
      patient.id.toLocaleLowerCase() === normalizedIdentifier ||
      patient.name.toLocaleLowerCase() === normalizedIdentifier,
  );
}

export function prepareMedicationReview(
  identifier: string,
  patients: readonly DemoPatient[] = demoPatients,
): MedicationReviewPreparation {
  const patient = findPatient(identifier, patients);
  if (!patient) {
    return { ok: false, error: "No synthetic patient matched that ID or exact name." };
  }
  if (patient.status !== "Eligible") {
    return {
      ok: false,
      error: `${patient.name} requires eligibility review before medication preparation.`,
    };
  }

  const search = new URLSearchParams({ feature: "headless", patientId: patient.id });
  return {
    ok: true,
    patient,
    path: `/medication-orders?${search.toString()}`,
  };
}
