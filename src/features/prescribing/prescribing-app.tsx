import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { Workspace } from "./components/workspace";
import { demoProfile } from "./demo-profile";
import type { Bootstrap } from "./data/reads";

export function PrescribingApp({
  initial,
  pending = false,
}: {
  initial?: Bootstrap;
  pending?: boolean;
}) {
  const [working, setWorking] = useState(false);
  return (
    <>
      <Workspace
        mode="test"
        onBusy={setWorking}
        initial={initial}
        pending={pending}
        profile={demoProfile}
        openSettings={() => {}}
        renderHeader={({ practices, practiceId, onView, view }) => (
          <header className="toolbar">
            <div className="brand">
              <img
                src="https://cdn.joinaffinityai.com/logos/affinity/mark-blue.v2.webp"
                width={30}
                height={30}
                alt=""
              />
              <span>
                Affinity AI <small className="demo-label">EMR demo · synthetic patients only</small>
              </span>
              <span className="practice-menu">
                {practices.find((p) => p.id === practiceId)?.name ?? "Loading practice…"}
              </span>
            </div>
            <nav className="header-links" aria-label="Prescribing">
              <a
                href="#new"
                aria-current={view === "new" ? "page" : undefined}
                aria-disabled={working}
                onClick={(event) => {
                  event.preventDefault();
                  if (!working) onView("new");
                }}
              >
                New prescription
              </a>
              <a
                href="#orders"
                aria-current={view === "orders" ? "page" : undefined}
                aria-disabled={working || !practiceId}
                onClick={(event) => {
                  event.preventDefault();
                  if (!working && practiceId) onView("orders");
                }}
              >
                Orders
              </a>
            </nav>
            <div className="toolbar-actions">
              <span className="environment test">
                <span className="mode-dot" />
                Test mode
              </span>
            </div>
          </header>
        )}
      />
      <footer>
        <a
          href="https://docs.joinaffinityai.com/guides/reference/sdks/typescript/"
          target="_blank"
          rel="noreferrer"
        >
          SDK documentation <ExternalLink size={12} aria-hidden />
        </a>
        <a
          href="https://github.com/affinity-health/tanstack-start-example"
          target="_blank"
          rel="noreferrer"
        >
          View source <ExternalLink size={12} aria-hidden />
        </a>
      </footer>
    </>
  );
}
