import { createRouter } from "@tanstack/react-router";

import { routeTree } from "./routeTree.gen";

export function getRouter() {
  return createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultNotFoundComponent: () => (
      <main className="page-shell not-found">
        <p className="eyebrow">404</p>
        <h1>That page is not here.</h1>
        <a className="button button-dark" href="/">
          Back home
        </a>
      </main>
    ),
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
