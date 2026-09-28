import type { AffinityApiClient } from "@affinity-health/sdk";
export type Options = Awaited<
  ReturnType<AffinityApiClient["catalog"]["retrievePrescribingOptions"]>
>;
export type Preview = Awaited<ReturnType<AffinityApiClient["orders"]["previewOrder"]>>;
export type Order = Awaited<ReturnType<AffinityApiClient["orders"]["getOrder"]>>;
export type Catalog = Awaited<ReturnType<AffinityApiClient["catalog"]["listCatalogItems"]>>;
