import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRoute,
  useRouterState,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Affinity platform example",
      },
      {
        name: "description",
        content: "A working showcase of Affinity integration patterns in a partner application.",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "icon",
        href: "https://cdn.joinaffinityai.com/logos/affinity/mark-white-on-violet.v1.webp",
        type: "image/webp",
      },
    ],
  }),
  component: RootDocument,
});

function RootDocument() {
  const isWorkspace = useRouterState({
    select: (state) =>
      [
        "/dashboard",
        "/documents",
        "/medication-orders",
        "/messages",
        "/patients",
        "/schedule",
      ].includes(state.location.pathname),
  });

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className={isWorkspace ? "emr-body" : undefined}>
        {isWorkspace ? null : (
          <header className="site-header">
            <Link className="wordmark" to="/">
              <span className="wordmark-dot" />
              Affinity example
            </Link>
            <nav aria-label="Primary navigation">
              <a href="/api/openapi">API docs</a>
              <Link to="/dashboard">Dashboard</Link>
              <Link className="nav-cta" to="/login">
                Sign in
              </Link>
            </nav>
          </header>
        )}
        <Outlet />
        {isWorkspace ? null : (
          <footer className="site-footer">
            <p>Affinity Elements / SDK / Hosted</p>
            <p>Test mode. Synthetic data only.</p>
          </footer>
        )}
        <Scripts />
      </body>
    </html>
  );
}
