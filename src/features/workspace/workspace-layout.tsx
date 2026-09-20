import { createContext, useContext, useEffect, useState } from "react";
import { ExternalLink, Settings } from "lucide-react";
import { Button } from "../../components/ui/button";
import { PrescriberSettings, profileKey } from "./components/prescriber-settings";
import { Link, Outlet } from "@tanstack/react-router";
import type { Profile } from "./demo-profile";
import { demoProfile, parseProfile } from "./demo-profile";
import type { getWorkspace } from "../../api/workspace/functions";
const WorkspaceContext = createContext<null | {
  initial: Awaited<ReturnType<typeof getWorkspace>>;
  profile: Profile;
  openSettings: () => void;
  onBusy: (busy: boolean) => void;
}>(null);
export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error("Workspace layout is missing.");
  return value;
}

export function WorkspaceLayout({
  initial,
}: {
  initial: Awaited<ReturnType<typeof getWorkspace>>;
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
      <WorkspaceContext.Provider
        value={{ initial, profile, openSettings: () => setSettingsOpen(true), onBusy: setWorking }}
      >
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
            <span className="practice-name">{initial.practice.name}</span>
          </div>
          <nav className="header-links" aria-label="Prescribing">
            <Link to="/prescribe" activeProps={{ "aria-current": "page" }} disabled={working}>
              New prescription
            </Link>
            <Link to="/orders" activeProps={{ "aria-current": "page" }} disabled={working}>
              Orders
            </Link>
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
        <Outlet />
      </WorkspaceContext.Provider>
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
