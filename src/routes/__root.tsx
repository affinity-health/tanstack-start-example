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
        title: "Affinity agent ready telehealth",
      },
      {
        name: "description",
        content:
          "Agent ready telehealth prescribing with unsigned Test drafts and a required clinician confirmation gate.",
      },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Affinity agent ready telehealth" },
      {
        property: "og:description",
        content: "Let browser agents prepare prescription work without becoming the prescriber.",
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
              <span>Affinity</span>
            </Link>
            <p>Agent ready prescribing with a human clinical boundary.</p>
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
