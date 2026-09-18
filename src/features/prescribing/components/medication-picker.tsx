import { useEffect, useState } from "react";
import { Check, Pill, Search, X } from "lucide-react";
import { Button } from "../../../components/ui/button";
import {
  Command,
  CommandDialog,
  CommandDialogTrigger,
  CommandDialogPopup,
  CommandDialogPrimitive,
  CommandInput,
  CommandList,
  CommandItem,
} from "../../../components/ui/command";
import type { Catalog } from "../types";

type Medication = Catalog["data"][number];

function MedicationImage({ medication }: { medication: Medication }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="medication-image">
      {medication.imageUrl && !failed ? (
        <img src={medication.imageUrl} alt="" loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <Pill aria-hidden="true" size={20} />
      )}
    </span>
  );
}

export function MedicationPicker({
  mode,
  practiceId,
  disabled,
  onChange,
}: {
  mode: "test" | "production";
  practiceId: string;
  disabled: boolean;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Medication>();
  const [items, setItems] = useState<Medication[]>([]);
  const [cursor, setCursor] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const timer = setTimeout(
      async () => {
        try {
          const params = new URLSearchParams({ mode, practiceId, query: query.trim() });
          if (cursor) params.set("startingAfter", cursor);
          const response = await fetch(`/api/catalog?${params}`, { signal: controller.signal });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || "Unable to search medications.");
          if (controller.signal.aborted) return;
          setItems((previous) => (cursor ? [...previous, ...result.data] : result.data));
          setHasMore(result.hasMore);
        } catch (cause) {
          if (!controller.signal.aborted)
            setError(cause instanceof Error ? cause.message : "Unable to search medications.");
        } finally {
          if (!controller.signal.aborted) setLoading(false);
        }
      },
      query ? 250 : 0,
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [open, query, cursor, mode, practiceId, retry]);

  return (
    <div className="medication-picker">
      <span id="medication-label" className="medication-label">
        Medication
      </span>
      <CommandDialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          if (value) {
            setQuery("");
            setCursor("");
            setItems([]);
            setLoading(true);
          }
        }}
      >
        <CommandDialogTrigger
          render={<Button variant="outline" className="medication-trigger" />}
          disabled={disabled}
          aria-labelledby="medication-label medication-selection"
        >
          {selected && <MedicationImage key={selected.id} medication={selected} />}
          <span id="medication-selection" className="medication-copy">
            <span>{selected ? `${selected.name} ${selected.strength}` : "Search medications"}</span>
            {selected && <small>{selected.pharmacyName}</small>}
          </span>
          <Search size={18} aria-hidden="true" />
        </CommandDialogTrigger>
        <CommandDialogPopup className="medication-command">
          <CommandDialogPrimitive.Title className="sr-only">
            Select medication
          </CommandDialogPrimitive.Title>
          <CommandDialogPrimitive.Description className="sr-only">
            Search the Affinity catalog by medication name.
          </CommandDialogPrimitive.Description>
          <CommandDialogPrimitive.Close
            render={<Button variant="ghost" size="icon" className="medication-close" />}
            aria-label="Close medication search"
          >
            <X size={18} />
          </CommandDialogPrimitive.Close>
          <Command
            items={loading || error ? [] : items}
            filter={null}
            itemToStringValue={(value) => {
              const item = value as Medication;
              return `${item.name} ${item.strength}`;
            }}
            value={query}
            onValueChange={(value) => {
              setQuery(value);
              setCursor("");
              setItems([]);
              setHasMore(false);
              setLoading(true);
            }}
          >
            <CommandInput
              aria-label="Search medications"
              placeholder="Search medications…"
              className="pr-10"
            />
            <div className="medication-results" aria-busy={loading}>
              {loading ? (
                <p role="status" className="medication-message">
                  Searching medications…
                </p>
              ) : error ? (
                <div className="medication-message" role="alert">
                  {error}{" "}
                  <Button variant="ghost" onClick={() => setRetry((value) => value + 1)}>
                    Retry
                  </Button>
                </div>
              ) : items.length === 0 ? (
                <p role="status" className="medication-message">
                  No medications found. Try another name.
                </p>
              ) : null}
              <CommandList>
                {(medication: Medication) => (
                  <CommandItem
                    key={medication.id}
                    value={medication}
                    className="medication-result"
                    onClick={() => {
                      setSelected(medication);
                      setOpen(false);
                      onChange(medication.id);
                    }}
                  >
                    <MedicationImage medication={medication} />
                    <span className="medication-copy">
                      <span>
                        {medication.name} {medication.strength}
                      </span>
                      <small>{medication.pharmacyName}</small>
                    </span>
                    {selected?.id === medication.id && <Check size={18} aria-label="Selected" />}
                  </CommandItem>
                )}
              </CommandList>
            </div>
          </Command>
          {!loading && !error && hasMore && (
            <Button
              variant="ghost"
              className="medication-more"
              onClick={() => setCursor(items.at(-1)!.id)}
            >
              Show more medications
            </Button>
          )}
        </CommandDialogPopup>
      </CommandDialog>
    </div>
  );
}
