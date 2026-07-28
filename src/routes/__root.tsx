import { HeadContent, Link, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";

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
        title: "Plain Start — TanStack, Elysia & Better Auth",
      },
      {
        name: "description",
        content: "A deliberately small TanStack Start application.",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: RootDocument,
});

function RootDocument() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <header className="site-header">
          <Link className="wordmark" to="/">
            <span className="wordmark-dot" />
            Plain Start
          </Link>
          <nav aria-label="Primary navigation">
            <a href="/api/openapi">API docs</a>
            <Link to="/dashboard">Dashboard</Link>
            <Link className="nav-cta" to="/login">
              Sign in
            </Link>
          </nav>
        </header>
        <Outlet />
        <footer className="site-footer">
          <p>TanStack Start / Elysia / Better Auth</p>
          <p>One app. Nothing hiding.</p>
        </footer>
        <Scripts />
      </body>
    </html>
  );
}
