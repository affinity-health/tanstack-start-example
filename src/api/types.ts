import type { Affinity } from "@affinity-health/sdk";
export type Options = Awaited<
  ReturnType<Affinity["catalog"]["items"]["prescribingOptions"]["retrieve"]>
>;
export type Preview = Awaited<ReturnType<Affinity["orderPreviews"]["create"]>>;
export type Order = Awaited<ReturnType<Affinity["orders"]["retrieve"]>>;
export type Catalog = Awaited<ReturnType<Affinity["catalog"]["items"]["list"]>>;
