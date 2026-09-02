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
        title: "Affinity Agent-Native Telehealth",
      },
      {
        name: "description",
        content:
          "A WebMCP-enabled clinician workspace for safe, visible collaboration between people and browser agents.",
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
              <span>
                <strong>Northstar Health</strong>
                <small>Affinity agent-assisted prescribing</small>
              </span>
            </Link>
            <nav aria-label="Primary navigation">
              <a href="/api/openapi">API</a>
              <Link to="/dashboard">Patient workspace</Link>
              <Link className="nav-cta" to="/login">
                Sign in
              </Link>
            </nav>
          </header>
        )}
        <Outlet />
        {isWorkspace ? null : (
          <footer className="site-footer">
            <p>Northstar Health · Agent-assisted medication operations</p>
            <p>Affinity Test · synthetic data · never Live</p>
          </footer>
        )}
        <Scripts />
      </body>
    </html>
  );
}
