import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { Toaster } from "sonner";
import stylesheet from "../styles/app.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Affinity prescribing demo" },
    ],
    links: [
      { rel: "stylesheet", href: stylesheet },
      { rel: "preconnect", href: "https://cdn.joinaffinityai.com" },
    ],
  }),
  component: () => <Outlet />,
  shellComponent: ({ children }) => (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <div id="root">{children}</div>
        <Toaster
          position="bottom-right"
          closeButton
          toastOptions={{
            duration: 5000,
            style: {
              fontFamily: "var(--font-sans)",
              background: "var(--popover)",
              color: "var(--popover-foreground)",
              borderColor: "var(--border)",
              borderRadius: "12px",
            },
          }}
        />
        <Scripts />
      </body>
    </html>
  ),
});
