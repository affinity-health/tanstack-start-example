import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRoute,
  useRouterState,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { PublicHeader } from "../features/landing/public-header";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Northstar, a demo telehealth platform",
      },
      {
        name: "description",
        content:
          "Fork a small example telehealth clinic with synthetic patients, Affinity Test prescribing, and optional WebMCP access.",
      },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Northstar, a demo telehealth platform" },
      {
        property: "og:description",
        content:
          "A copyable example EHR for telehealth with synthetic patients and optional WebMCP access.",
      },
      {
        property: "og:image",
        content: "https://demo-platform.joinaffinityai.com/images/affinity-prescribing-hero.png",
      },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "icon",
        href: "/favicon.svg",
        type: "image/svg+xml",
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
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        {isWorkspace ? null : <PublicHeader />}
        <div id="main-content" tabIndex={-1}>
          <Outlet />
        </div>
        {isWorkspace ? null : (
          <footer className="site-footer">
            <Link className="landing-wordmark" to="/">
              <span className="landing-mark" aria-hidden>
                <span />
              </span>
              <span>Northstar demo</span>
            </Link>
            <p>A copyable telehealth clinic with synthetic data.</p>
            <nav aria-label="Legal">
              <Link to="/privacy">Privacy</Link>
              <Link to="/terms">Terms</Link>
              <a href="/api/openapi">API</a>
            </nav>
          </footer>
        )}
        <Scripts />
      </body>
    </html>
  );
}
