import type {
  Affinity,
  PreviewOrderParams,
  CreateOrderParams,
  SignOrderParams,
} from "@affinity-health/sdk";
import type { resolvePatient } from "../../server/affinity/patients";
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
