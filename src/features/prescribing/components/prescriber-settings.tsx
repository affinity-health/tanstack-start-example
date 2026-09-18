import { toast } from "sonner";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Checkbox } from "../../../components/ui/checkbox";
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogPanel,
  DialogFooter,
} from "../../../components/ui/dialog";
import { Choice } from "./choice";

export type Profile = {
  email: string;
  states: Record<string, { npi: string; name: string }>;
  confirmed: boolean;
};
export const emptyProfile: Profile = { email: "", states: {}, confirmed: false };
export const profileKey = (mode: string) => `affinity-prescriber-v1-${mode}`;
const states =
  "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split(
    " ",
  );
export function PrescriberSettings({
  mode,
  profile,
  onSave,
  open,
  onOpenChange,
}: {
  mode: "test" | "production";
  profile: Profile;
  onSave: (profile: Profile) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [draft, setDraft] = useState(profile);
  const [rows, setRows] = useState<string[][]>(() =>
    Object.entries(profile.states).map(([state, value]) => [state, value.npi, value.name]),
  );
  function changeRows(next: string[][]) {
    setRows(next);
    setDraft({ ...draft, confirmed: false });
  }
  const valid =
    (mode === "test" || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(draft.email)) &&
    rows.length > 0 &&
    rows.every(
      ([state, npi, name]) => states.includes(state) && /^\d{10}$/.test(npi) && name.trim(),
    ) &&
    new Set(rows.map(([state]) => state)).size === rows.length &&
    draft.confirmed;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="prescriber-settings-dialog">
        <DialogHeader>
          <DialogTitle>Prescriber settings</DialogTitle>
          <DialogDescription>
            Save a prescriber name and NPI for each destination state.{" "}
            {mode === "test" ? "Test" : "Production"} settings stay in this browser.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <div className="dialog-fields">
            {mode === "production" && (
              <label>
                Email
                <Input
                  type="email"
                  value={draft.email}
                  onChange={(e) => setDraft({ ...draft, email: e.target.value, confirmed: false })}
                  autoComplete="email"
                />
              </label>
            )}
            {rows.map(([state, npi, name], index) => (
              <div className="npi-row" key={index}>
                <Choice
                  label="State"
                  value={state}
                  items={states
                    .filter((s) => s === state || !rows.some(([v]) => v === s))
                    .map((s) => ({ value: s, label: s }))}
                  onChange={(v) =>
                    changeRows(rows.map((r, i) => (i === index ? [v, npi, name] : r)))
                  }
                />
                <label>
                  NPI
                  <Input
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="10-digit NPI"
                    value={npi}
                    onChange={(e) =>
                      changeRows(
                        rows.map((r, i) =>
                          i === index ? [state, e.target.value.replace(/\D/g, ""), name] : r,
                        ),
                      )
                    }
                  />
                </label>
                <label className="state-prescriber-name">
                  Name
                  <Input
                    value={name}
                    autoComplete="off"
                    placeholder="Prescriber name"
                    onChange={(e) =>
                      changeRows(
                        rows.map((r, i) => (i === index ? [state, npi, e.target.value] : r)),
                      )
                    }
                  />
                </label>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${state || "state"}`}
                  onClick={() => changeRows(rows.filter((_, i) => i !== index))}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              disabled={rows.length === states.length}
              onClick={() => changeRows([...rows, ["", "", ""]])}
            >
              <Plus size={16} />
              Add state
            </Button>
            <label className="check">
              <Checkbox
                checked={draft.confirmed}
                onCheckedChange={(confirmed) => setDraft({ ...draft, confirmed })}
              />
              I confirm these prescriber names and NPIs.
            </label>
          </div>
        </DialogPanel>
        <DialogFooter>
          <Button
            disabled={!valid}
            onClick={() => {
              const next = {
                ...draft,
                email: draft.email.trim(),
                states: Object.fromEntries(
                  rows.map(([state, npi, name]) => [state, { npi, name: name.trim() }]),
                ),
              };
              try {
                localStorage.setItem(profileKey(mode), JSON.stringify(next));
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
