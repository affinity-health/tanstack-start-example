import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { QueryClient } from "@tanstack/react-query";

export function getRouter() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: 1, staleTime: 30_000 }, mutations: { retry: false } },
  });
  return createRouter({ routeTree, context: { queryClient }, scrollRestoration: true });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
