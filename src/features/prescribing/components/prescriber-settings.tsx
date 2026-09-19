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
  phone: string;
  address: { line1: string; city: string; state: string; postalCode: string; country: "US" };
  states: Record<string, { npi: string; name: string; licenseNumber: string; expiresAt: string }>;
  confirmed: boolean;
};
export const emptyProfile: Profile = {
  email: "",
  phone: "",
  address: { line1: "", city: "", state: "", postalCode: "", country: "US" },
  states: {},
  confirmed: false,
};
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
    Object.entries(profile.states).map(([state, value]) => [
      state,
      value.npi,
      value.name,
      value.licenseNumber ?? "",
      value.expiresAt ?? "",
    ]),
  );
  function changeRows(next: string[][]) {
    setRows(next);
    setDraft({ ...draft, confirmed: false });
  }
  const valid =
    (mode === "test" ||
      (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(draft.email) &&
        !!draft.phone.trim() &&
        !!draft.address.line1.trim() &&
        !!draft.address.city.trim() &&
        states.includes(draft.address.state) &&
        /^\d{5}(-\d{4})?$/.test(draft.address.postalCode))) &&
    rows.length > 0 &&
    rows.every(
      ([state, npi, name, licenseNumber, expiresAt]) =>
        states.includes(state) &&
        /^\d{10}$/.test(npi) &&
        name.trim() &&
        (mode === "test" ||
          (licenseNumber.trim() && new Date(expiresAt + "T23:59:59Z").getTime() > Date.now())),
    ) &&
    new Set(rows.map(([state]) => state)).size === rows.length &&
    draft.confirmed;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="prescriber-settings-dialog">
        <DialogHeader>
          <DialogTitle>Prescriber settings</DialogTitle>
          <DialogDescription>
            Save the prescriber identity and current license for each patient state.{" "}
            {mode === "test" ? "Test" : "Live"} settings stay in this browser.
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
            {mode === "production" && (
              <>
                <label>
                  Phone
                  <Input
                    type="tel"
                    value={draft.phone}
                    onChange={(e) =>
                      setDraft({ ...draft, phone: e.target.value, confirmed: false })
                    }
                  />
                </label>
                {(
                  [
                    ["line1", "Practice street address"],
                    ["city", "City"],
                    ["state", "Address state"],
                    ["postalCode", "ZIP code"],
                  ] as const
                ).map(([field, label]) => (
                  <label key={field}>
                    {label}
                    <Input
                      value={draft.address[field]}
                      maxLength={field === "state" ? 2 : undefined}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          address: {
                            ...draft.address,
                            [field]:
                              field === "state" ? e.target.value.toUpperCase() : e.target.value,
                          },
                          confirmed: false,
                        })
                      }
                    />
                  </label>
                ))}
              </>
            )}
            {rows.map(([state, npi, name, licenseNumber, expiresAt], index) => (
              <div className="npi-row" key={index}>
                <Choice
                  label="State"
                  value={state}
                  items={states
                    .filter((s) => s === state || !rows.some(([v]) => v === s))
                    .map((s) => ({ value: s, label: s }))}
                  onChange={(v) =>
                    changeRows(
                      rows.map((r, i) =>
                        i === index ? [v, npi, name, licenseNumber, expiresAt] : r,
                      ),
                    )
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
                          i === index
                            ? [
                                state,
                                e.target.value.replace(/\D/g, ""),
                                name,
                                licenseNumber,
                                expiresAt,
                              ]
                            : r,
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
                        rows.map((r, i) =>
                          i === index ? [state, npi, e.target.value, licenseNumber, expiresAt] : r,
                        ),
                      )
                    }
                  />
                </label>
                {mode === "production" && (
                  <>
                    <label className="state-license">
                      License number
                      <Input
                        value={licenseNumber}
                        onChange={(e) =>
                          changeRows(
                            rows.map((row, i) =>
                              i === index ? [state, npi, name, e.target.value, expiresAt] : row,
                            ),
                          )
                        }
                      />
                    </label>
                    <label className="state-license-expiry">
                      License expires
                      <Input
                        type="date"
                        value={expiresAt}
                        onChange={(e) =>
                          changeRows(
                            rows.map((row, i) =>
                              i === index ? [state, npi, name, licenseNumber, e.target.value] : row,
                            ),
                          )
                        }
                      />
                    </label>
                  </>
                )}
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
              onClick={() => changeRows([...rows, ["", "", "", "", ""]])}
            >
              <Plus size={16} />
              Add state
            </Button>
            <label className="check">
              <Checkbox
                checked={draft.confirmed}
                onCheckedChange={(confirmed) => setDraft({ ...draft, confirmed })}
              />
              I confirm this prescriber identity and license information.
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
                  rows.map(([state, npi, name, licenseNumber, expiresAt]) => [
                    state,
                    { npi, name: name.trim(), licenseNumber: licenseNumber.trim(), expiresAt },
                  ]),
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
