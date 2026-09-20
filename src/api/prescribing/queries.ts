import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { getCatalog, getPrescribingOptions } from "./functions";
export const optionsQuery = (sessionId: string, medicationId: string) =>
  queryOptions({
    queryKey: [sessionId, "options", medicationId],
    queryFn: () => getPrescribingOptions({ data: { medicationId } }),
    staleTime: 60_000,
  });
export const catalogQuery = (sessionId: string, query = "") =>
  infiniteQueryOptions({
    queryKey: [sessionId, "catalog", query],
    queryFn: ({ pageParam }) => getCatalog({ data: { query, cursor: pageParam } }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.hasMore ? last.data.at(-1)?.id : undefined),
    staleTime: 60_000,
  });
