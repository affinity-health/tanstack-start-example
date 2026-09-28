import type { Catalog } from "../../api/types";

type CatalogMedication = Catalog["data"][number];
type Medication = Pick<CatalogMedication, "isOrderable" | "allowedStates" | "restrictedStates"> & {
  ordering: Pick<CatalogMedication["ordering"], "requiresPrescription">;
};

export function availableForPatient(item: Medication, state: string) {
  const destination = state.toUpperCase();
  return (
    item.isOrderable &&
    item.ordering.requiresPrescription &&
    (!item.allowedStates.length || item.allowedStates.includes(destination)) &&
    !item.restrictedStates.includes(destination)
  );
}
