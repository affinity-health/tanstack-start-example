import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { getCatalog, getPrescribingOptions } from "./prescribing.functions";
import { getOrders, getOrder } from "./orders.functions";
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
export const ordersQuery = (sessionId: string, filter: "all" | "draft") =>
  infiniteQueryOptions({
    queryKey: [sessionId, "orders", filter],
    queryFn: ({ pageParam }) => getOrders({ data: { filter, cursor: pageParam } }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) =>
      last.hasMore ? (last.nextCursor ?? last.data.at(-1)?.id) : undefined,
  });
export const orderQuery = (sessionId: string, orderId: string) =>
  queryOptions({
    queryKey: [sessionId, "order", orderId],
    queryFn: () => getOrder({ data: { orderId } }),
  });
