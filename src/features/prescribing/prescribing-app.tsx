import { useEffect, useState } from "react";
import { ExternalLink, Settings } from "lucide-react";
import { Button } from "../../components/ui/button";
import { PrescriberSettings, profileKey } from "./components/prescriber-settings";
import { Workspace } from "./components/workspace";
import { demoProfile, parseProfile } from "./demo-profile";
import type { Bootstrap } from "./data/reads";

export function PrescribingApp({
  initial,
  pending = false,
}: {
  initial?: Bootstrap;
  pending?: boolean;
}) {
  const [working, setWorking] = useState(false);
  const [profile, setProfile] = useState(demoProfile);
  const [settingsOpen, setSettingsOpen] = useState(false);
  useEffect(() => {
    try {
      setProfile(parseProfile(localStorage.getItem(profileKey)));
    } catch {
      /* Defaults work without browser storage. */
    }
  }, []);
  return (
    <>
      <Workspace
        mode="test"
        onBusy={setWorking}
        initial={initial}
        pending={pending}
        profile={profile}
        openSettings={() => setSettingsOpen(true)}
        renderHeader={({ practices, practiceId, onView, view }) => (
          <header className="toolbar">
            <div className="brand">
              <img
                src="https://cdn.joinaffinityai.com/logos/affinity/mark-blue.v2.webp"
                width={30}
                height={30}
                alt=""
              />
              <span className="brand-name">
                Affinity AI <small className="demo-label">EMR demo · Test only</small>
              </span>
              <span className="brand-separator" aria-hidden="true" />
              <span className="practice-name">
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
              <Button
                variant="ghost"
                size="icon"
                aria-label="Prescriber settings"
                className="header-settings"
                title="Prescriber settings"
                disabled={working}
                onClick={() => setSettingsOpen(true)}
              >
                <Settings size={24} />
              </Button>
            </div>
          </header>
        )}
      />
      {settingsOpen && (
        <PrescriberSettings
          profile={profile}
          onSave={setProfile}
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
        />
      )}
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
