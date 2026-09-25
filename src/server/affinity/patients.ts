import type { Affinity } from "@affinity-health/sdk";
import { patients } from "../../data/patients";

export async function resolvePatient(
  affinity: Affinity,
  practiceId: string,
  externalId: string,
  idempotencyKey?: string,
) {
  const patient = patients.find((patient) => patient.externalId === externalId);
  if (!patient) throw new Error("Choose a patient from the demo EMR.");
  const existing = await affinity.practices.patients.list(practiceId, { externalId, limit: 1 });
  if (existing.data[0])
    return {
      patient: await affinity.practices.patients.retrieve(practiceId, existing.data[0].id),
      reused: true,
    };
  return {
    patient: await affinity.practices.patients.create(practiceId, patient, { idempotencyKey }),
    reused: false,
  };
}
