import type { Catalog } from "../../api/types";
export function availableForPatient(
  item: Pick<Catalog["data"][number], "restrictedStates">,
  state: string,
) {
  return !item.restrictedStates.includes(state.toUpperCase());
}
