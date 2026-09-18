import type {
  Affinity,
  PreviewOrderParams,
  CreateOrderParams,
  SignOrderParams,
} from "@affinity-health/sdk";
import { patients } from "./patients";

export async function resolvePatient(
  affinity: Affinity,
  practiceId: string,
  externalId: string,
  idempotencyKey?: string,
) {
  const patient = patients.find((patient) => patient.externalId === externalId);
  if (!patient) throw new Error("Choose a patient from the demo EMR.");
  const existing = await affinity.patients.list(practiceId, { externalId, limit: 1 });
  if (existing.data[0])
    return {
      patient: await affinity.patients.retrieve(practiceId, existing.data[0].id),
      reused: true,
    };
  return {
    patient: await affinity.patients.create(practiceId, patient, { idempotencyKey }),
    reused: false,
  };
}

export type PreviewInput = PreviewOrderParams;
export type OrderInput = CreateOrderParams;
export type SignatureInput = SignOrderParams;
export type Options = Awaited<ReturnType<Affinity["catalog"]["retrievePrescribingOptions"]>>;
export type Preview = Awaited<ReturnType<Affinity["orders"]["preview"]>>;
export type Order = Awaited<ReturnType<Affinity["orders"]["retrieve"]>>;
export type PatientResult = Awaited<ReturnType<typeof resolvePatient>>;
export type Prescriber = Awaited<ReturnType<Affinity["team"]["createUser"]>>;
export type Catalog = Awaited<ReturnType<Affinity["catalog"]["list"]>>;
export type Practices = Awaited<ReturnType<Affinity["practices"]["list"]>>;
