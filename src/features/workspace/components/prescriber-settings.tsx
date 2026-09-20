import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogPanel,
  DialogFooter,
} from "../../../components/ui/dialog";
import { Choice } from "../../../components/choice";
import { isTestNpi, states, type Profile } from "../demo-profile";
export type { Profile } from "../demo-profile";
export const profileKey = "affinity-demo-prescriber-v2";

export function PrescriberSettings({
  profile,
  onSave,
  open,
  onOpenChange,
}: {
  profile: Profile;
  onSave: (profile: Profile) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [defaultNpi, setDefaultNpi] = useState(profile.defaultNpi);
  const [rows, setRows] = useState(() => Object.entries(profile.states));
  const valid =
    isTestNpi(defaultNpi) &&
    rows.every(([state, npi]) => states.includes(state) && isTestNpi(npi)) &&
    new Set(rows.map(([state]) => state)).size === rows.length;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="prescriber-settings-dialog">
        <DialogHeader>
          <DialogTitle>Prescriber settings</DialogTitle>
          <DialogDescription>
            Use a default NPI for every patient, or choose a different NPI for a patient's state.
            Saved in this browser.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <div className="dialog-fields">
            <label>
              Default NPI
              <Input
                inputMode="numeric"
                maxLength={10}
                value={defaultNpi}
                onChange={(e) => setDefaultNpi(e.target.value.replace(/\D/g, ""))}
              />
            </label>
            <p className="settings-hint">
              Test NPIs: 1234567893 for all states; 1111111112 for CA, FL, NY, PA, and TX.
              Prescriber names are resolved automatically.
            </p>
            <div className="settings-section-title">
              State overrides <span>Optional</span>
            </div>
            {rows.map(([state, npi], index) => (
              <div className="npi-row" key={index}>
                <Choice
                  label="State"
                  value={state}
                  items={states
                    .filter((s) => s === state || !rows.some(([v]) => v === s))
                    .map((s) => ({ value: s, label: s }))}
                  onChange={(v) => setRows(rows.map((r, i) => (i === index ? [v, npi] : r)))}
                />
                <label>
                  NPI
                  <Input
                    inputMode="numeric"
                    maxLength={10}
                    value={npi}
                    placeholder="10-digit Test NPI"
                    onChange={(e) =>
                      setRows(
                        rows.map((r, i) =>
                          i === index ? [state, e.target.value.replace(/\D/g, "")] : r,
                        ),
                      )
                    }
                  />
                </label>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${state || "state"} override`}
                  onClick={() => setRows(rows.filter((_, i) => i !== index))}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              disabled={rows.length === states.length}
              onClick={() => setRows([...rows, ["", defaultNpi]])}
            >
              <Plus size={16} />
              Add state override
            </Button>
          </div>
        </DialogPanel>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!valid}
            onClick={() => {
              const next = { defaultNpi, states: Object.fromEntries(rows) };
              try {
                localStorage.setItem(profileKey, JSON.stringify(next));
                onSave(next);
                onOpenChange(false);
                toast.success("Prescriber settings saved.");
              } catch {
                toast.error(
                  "This browser could not save settings. Allow local storage and try again.",
                );
              }
            }}
          >
            Save settings
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
