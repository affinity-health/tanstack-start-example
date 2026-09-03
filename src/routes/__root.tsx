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
import { ClinicCommerceProvider } from "../features/marketplace/clinic-commerce";

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
          "Fork a small example telehealth clinic with a synthetic medication marketplace, patient carts, Affinity Test, and optional WebMCP access.",
      },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Northstar, a demo telehealth platform" },
      {
        property: "og:description",
        content:
          "A copyable telehealth clinic where people and agents search a synthetic marketplace and fill patient carts together.",
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
        "/cart",
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
        <ClinicCommerceProvider>
          <div id="main-content" tabIndex={-1}>
            <Outlet />
          </div>
        </ClinicCommerceProvider>
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
