import type { AffinityApiClient } from "@affinity-health/sdk";
import { patients } from "../../data/patients";

export async function resolvePatient(
  affinity: AffinityApiClient,
  practiceId: string,
  externalId: string,
  idempotencyKey?: string,
) {
  const patient = patients.find((patient) => patient.externalId === externalId);
  if (!patient) throw new Error("Choose a patient from the demo EMR.");
  const existing = await affinity.patients.listPatients({ practiceId, externalId, limit: 1 });
  if (existing.data[0])
    return {
      patient: await affinity.patients.getPatient({ practiceId, patientId: existing.data[0].id }),
      reused: true,
    };
  return {
    patient: await affinity.patients.createPatient({
      practiceId,
      ...patient,
      "Idempotency-Key": idempotencyKey ?? crypto.randomUUID(),
    }),
    reused: false,
  };
}
