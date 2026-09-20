import type { Affinity } from "@affinity-health/sdk";
export type Options = Awaited<ReturnType<Affinity["catalog"]["retrievePrescribingOptions"]>>;
export type Preview = Awaited<ReturnType<Affinity["orders"]["preview"]>>;
export type Order = Awaited<ReturnType<Affinity["orders"]["retrieve"]>>;
export type Catalog = Awaited<ReturnType<Affinity["catalog"]["list"]>>;
