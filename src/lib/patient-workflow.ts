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
