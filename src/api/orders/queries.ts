import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { getOrders, getOrder } from "./functions";
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
