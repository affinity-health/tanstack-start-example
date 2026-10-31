import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import { Check, Pill, Search } from "lucide-react";
import { Button } from "../../../components/ui/button";
import {
  Autocomplete,
  AutocompleteInput,
  AutocompletePopup,
  AutocompleteList,
  AutocompleteItem,
} from "../../../components/ui/autocomplete";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { catalogQuery, optionsQuery } from "../../../api/prescribing/queries";
import type { Medication } from "../../../api/types";
import { availableForPatient, matchesSearch } from "../medication-availability";

function MedicationImage() {
  return (
    <span className="medication-image">
      <Pill aria-hidden="true" size={20} />
    </span>
  );
}

export function MedicationPicker({
  sessionId,
  patientState,
  disabled,
  onChange,
}: {
  sessionId: string;
  patientState: string;
  disabled: boolean;
  onChange: (item: Medication) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Medication>();
  const queryClient = useQueryClient();
  // The whole catalog loads once; typing filters it here, with no request per keystroke.
  const catalog = useQuery(catalogQuery(sessionId));
  const items = (catalog.data ?? []).filter(
    (item) => availableForPatient(item, patientState) && matchesSearch(item, query),
  );
  const loading = catalog.isPending;
  const error = catalog.error?.message;
  useEffect(() => {
    if (error) toast.error(error, { id: "medication-search-error", duration: 8000 });
    else toast.dismiss("medication-search-error");
    return () => {
      toast.dismiss("medication-search-error");
    };
  }, [error]);

  const fieldRef = useRef<HTMLDivElement>(null);
  const intentTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(intentTimer.current), []);

  return (
    <div className="medication-picker">
      <label htmlFor="medication-search" className="medication-label">
        Medication
      </label>
      <Autocomplete
        items={error ? [] : items}
        onItemHighlighted={(item) => {
          clearTimeout(intentTimer.current);
          if (item && !loading)
            intentTimer.current = setTimeout(() => {
              void queryClient.prefetchQuery(optionsQuery(sessionId, item.id));
            }, 100);
        }}
        filter={null}
        autoHighlight
        open={open}
        onOpenChange={setOpen}
        openOnInputClick
        disabled={disabled}
        itemToStringValue={(item: Medication) => `${item.name} ${item.strength ?? ""}`}
        value={open ? query : selected ? `${selected.name} ${selected.strength ?? ""}` : query}
        onValueChange={(value, details) => {
          if (details.reason === "item-press") return;
          setQuery(value);
        }}
      >
        <div
          ref={fieldRef}
          className="medication-field"
          data-selected={selected ? "" : undefined}
          data-disabled={disabled ? "" : undefined}
        >
          {selected && <MedicationImage />}
          <div className="medication-field-content">
            <AutocompleteInput
              id="medication-search"
              placeholder="Search medications…"
              className="medication-search"
              size="lg"
              startAddon={selected ? undefined : <Search aria-hidden="true" />}
              aria-describedby={selected && !open ? "medication-pharmacy" : undefined}
              onFocus={(event) => {
                event.currentTarget.select();
                setOpen(true);
              }}
            />
            {selected && (
              <span id="medication-pharmacy" className="medication-pharmacy">
                {open ? "Search to change medication" : selected.pharmacy.name}
              </span>
            )}
          </div>
        </div>
        <AutocompletePopup anchor={fieldRef} className="medication-command" sideOffset={6}>
          <div className="medication-results" aria-busy={loading}>
            {loading ? (
              <p role="status" className="sr-only">
                Loading medications…
              </p>
            ) : error ? (
              <div className="medication-message">
                <Button variant="ghost" onClick={() => void catalog.refetch()}>
                  Retry
                </Button>
              </div>
            ) : items.length === 0 ? (
              <p role="status" className="medication-message">
                No medications available for this patient in {patientState}
                {query ? " match that search" : ""}.
              </p>
            ) : null}
            <AutocompleteList>
              {(medication: Medication) => (
                <AutocompleteItem
                  key={medication.id}
                  value={medication}
                  className="medication-result"
                  disabled={loading}
                  onClick={() => {
                    setSelected(medication);
                    setOpen(false);
                    setQuery("");
                    onChange(medication);
                  }}
                >
                  <MedicationImage />
                  <span className="medication-copy">
                    <span>
                      {medication.name} {medication.strength}
                    </span>
                    <small>{medication.pharmacy.name}</small>
                  </span>
                  {selected?.id === medication.id && <Check size={18} aria-label="Selected" />}
                </AutocompleteItem>
              )}
            </AutocompleteList>
          </div>
        </AutocompletePopup>
      </Autocomplete>
    </div>
  );
}
