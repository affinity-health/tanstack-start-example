import { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Menu, MenuTrigger, MenuPopup, MenuItem } from "../../components/ui/menu";
import { Settings, ChevronDown, Check, ExternalLink } from "lucide-react";
import {
  PrescriberSettings,
  emptyProfile,
  profileKey,
  type Profile,
} from "./components/prescriber-settings";
import { Workspace } from "./components/workspace";
import type { Bootstrap } from "./data/reads";

type Mode = "test" | "production";
export function PrescribingApp({
  initial,
  pending = false,
}: {
  initial?: Bootstrap;
  pending?: boolean;
}) {
  const [mode, setMode] = useState<Mode>("test");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(profileKey(mode)) ?? "null");
      if (
        !saved ||
        typeof saved.email !== "string" ||
        !saved.states ||
        typeof saved.states !== "object"
      ) {
        setProfile(emptyProfile);
      } else {
        const entries = Object.entries(saved.states).flatMap(([state, value]) => {
          const entry =
            typeof value === "string"
              ? { npi: value, name: saved.name ?? "" }
              : (value as { npi?: unknown; name?: unknown } | null);
          return entry && typeof entry.npi === "string" && typeof entry.name === "string"
            ? [[state, { npi: entry.npi, name: entry.name }]]
            : [];
        });
        setProfile({
          email: saved.email,
          states: Object.fromEntries(entries),
          confirmed: saved.confirmed === true,
        });
      }
    } catch {
      setProfile(emptyProfile);
    }
  }, [mode]);
  const [working, setWorking] = useState(false);
  const [initialData, setInitialData] = useState(initial);
  function changeMode(next: Mode) {
    if (next === mode) return;
    setInitialData(undefined);
    setMode(next);
  }
  return (
    <>
      <Workspace
        key={mode}
        mode={mode}
        onBusy={setWorking}
        initial={mode === "test" ? initialData : undefined}
        pending={pending}
        profile={profile}
        openSettings={() => setSettingsOpen(true)}
        renderHeader={({ practices, practiceId, onPractice, onView, view }) => (
          <header className="toolbar">
            <div className="brand">
              <img
                src="https://cdn.joinaffinityai.com/logos/affinity/mark-blue.v2.webp"
                width={30}
                height={30}
                alt=""
              />
              <span>Affinity AI</span>
              <Menu>
                <MenuTrigger
                  disabled={working || pending || !practices.length}
                  render={<Button variant="ghost" />}
                  className="practice-menu"
                  aria-label="Practice"
                >
                  <span>
                    {practices.find((p) => p.id === practiceId)?.name ?? "Select practice"}
                  </span>
                  <ChevronDown size={14} />
                </MenuTrigger>
                <MenuPopup align="start">
                  {practices.map((practice) => (
                    <MenuItem key={practice.id} onClick={() => onPractice(practice.id)}>
                      {practice.name}
                      {practice.id === practiceId && <Check size={15} aria-hidden />}
                    </MenuItem>
                  ))}
                </MenuPopup>
              </Menu>
            </div>
            <nav className="header-links" aria-label="Prescribing">
              <a
                href="#new"
                aria-current={view === "new" ? "page" : undefined}
                aria-disabled={working}
                onClick={(event) => {
                  event.preventDefault();
                  if (!working && view !== "new") onView("new");
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
                  if (!working && practiceId && view !== "orders") onView("orders");
                }}
              >
                Orders
              </a>
            </nav>
            <div className="toolbar-actions">
              <Menu>
                <MenuTrigger
                  disabled={working || pending}
                  render={<Button variant="outline" />}
                  className={`environment ${mode}`}
                >
                  <span className="mode-dot" />
                  {mode === "test" ? "Test" : "Production"}
                  <ChevronDown size={14} />
                </MenuTrigger>
                <MenuPopup align="end">
                  <MenuItem onClick={() => changeMode("test")}>
                    Test {mode === "test" && <Check size={15} aria-hidden />}
                  </MenuItem>
                  <MenuItem onClick={() => changeMode("production")}>
                    Production {mode === "production" && <Check size={15} aria-hidden />}
                  </MenuItem>
                </MenuPopup>
              </Menu>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Prescriber settings"
                disabled={working}
                onClick={() => setSettingsOpen(true)}
              >
                <Settings size={19} />
              </Button>
            </div>
          </header>
        )}
      />
      {settingsOpen && (
        <PrescriberSettings
          key={`settings-${mode}`}
          mode={mode}
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
        <span>
          Terminal: <code>bun run example</code>
        </span>
      </footer>
    </>
  );
}
