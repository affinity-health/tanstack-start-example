import type { Affinity } from "@affinity-health/sdk";
export type Options = Awaited<ReturnType<Affinity["catalog"]["prescribingOptions"]["get"]>>;
export type Preview = Awaited<ReturnType<Affinity["orders"]["preview"]>>;
export type Order = Awaited<ReturnType<Affinity["orders"]["get"]>>;
export type Catalog = Awaited<ReturnType<Affinity["catalog"]["items"]["list"]>>;
