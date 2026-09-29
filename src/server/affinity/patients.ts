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
  const practice = affinity.forPractice(practiceId);
  const existing = await practice.patients.list({ externalId, limit: 1 });
  if (existing.data[0])
    return {
      patient: await practice.patients.get(existing.data[0].id),
      reused: true,
    };
  return {
    patient: await practice.patients.create(patient, { idempotencyKey }),
    reused: false,
  };
}
