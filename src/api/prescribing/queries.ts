import { queryOptions } from "@tanstack/react-query";
import { getCatalog, getPrescribingOptions } from "./functions";
export const optionsQuery = (sessionId: string, medicationId: string) =>
  queryOptions({
    queryKey: [sessionId, "options", medicationId],
    queryFn: () => getPrescribingOptions({ data: { medicationId } }),
    staleTime: 60_000,
  });
export const catalogQuery = (sessionId: string) =>
  queryOptions({
    queryKey: [sessionId, "catalog"],
    queryFn: () => getCatalog(),
    staleTime: 5 * 60_000,
  });
