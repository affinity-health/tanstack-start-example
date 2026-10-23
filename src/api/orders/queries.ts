import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { getOrders, getOrder } from "./functions";
export const ordersQuery = (sessionId: string) =>
  infiniteQueryOptions({
    queryKey: [sessionId, "orders"],
    queryFn: ({ pageParam }) => getOrders({ data: { cursor: pageParam } }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.hasMore ? (last.nextCursor ?? undefined) : undefined),
  });
export const orderQuery = (sessionId: string, orderId: string) =>
  queryOptions({
    queryKey: [sessionId, "order", orderId],
    queryFn: () => getOrder({ data: { orderId } }),
  });
