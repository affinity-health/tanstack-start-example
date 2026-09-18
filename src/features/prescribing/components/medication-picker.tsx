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

  const fieldRef = useRef<HTMLDivElement>(null);
  const cache = useRef(new Map<string, Catalog>());

  useEffect(() => {
    if (!practiceId) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const cacheKey = JSON.stringify([mode, practiceId, query.trim(), cursor]);
    const cached = cache.current.get(cacheKey);
    if (cached) {
      setItems((previous) => (cursor ? [...previous, ...cached.data] : cached.data));
      setHasMore(cached.hasMore);
      setLoading(false);
      return;
    }
    const timer = setTimeout(
      async () => {
        try {
          const params = new URLSearchParams({ mode, practiceId, query: query.trim() });
          if (cursor) params.set("startingAfter", cursor);
          const response = await fetch(`/api/catalog?${params}`, { signal: controller.signal });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || "Unable to search medications.");
          if (controller.signal.aborted) return;
          cache.current.set(cacheKey, result);
          setItems((previous) => (cursor ? [...previous, ...result.data] : result.data));
          setHasMore(result.hasMore);
        } catch (cause) {
          if (!controller.signal.aborted)
            setError(cause instanceof Error ? cause.message : "Unable to search medications.");
        } finally {
          if (!controller.signal.aborted) setLoading(false);
        }
      },
      query ? 75 : 0,
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, cursor, mode, practiceId, retry]);

  return (
    <div className="medication-picker">
      <label htmlFor="medication-search" className="medication-label">
        Medication
      </label>
      <Autocomplete
        items={loading || error ? [] : items}
        filter={null}
        autoHighlight
        open={open}
        onOpenChange={setOpen}
        openOnInputClick
        disabled={disabled}
        itemToStringValue={(item: Medication) => `${item.name} ${item.strength}`}
        value={open ? query : selected ? `${selected.name} ${selected.strength}` : query}
        onValueChange={(value, details) => {
          if (details.reason === "item-press") return;
          setQuery(value);
          setCursor("");
          setItems([]);
          setHasMore(false);
          setLoading(true);
        }}
      >
        <div
          ref={fieldRef}
          className="medication-field"
          data-selected={selected ? "" : undefined}
          data-disabled={disabled ? "" : undefined}
        >
          {selected && <MedicationImage key={selected.id} medication={selected} />}
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
                {open ? "Search to change medication" : selected.pharmacyName}
              </span>
            )}
          </div>
        </div>
        <AutocompletePopup anchor={fieldRef} className="medication-command" sideOffset={6}>
          <div className="medication-results" aria-busy={loading}>
            {loading ? (
              <p role="status" className="sr-only">
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
            <AutocompleteList>
              {(medication: Medication) => (
                <AutocompleteItem
                  key={medication.id}
                  value={medication}
                  className="medication-result"
                  onClick={() => {
                    setSelected(medication);
                    setOpen(false);
                    setQuery("");
                    setCursor("");
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
                </AutocompleteItem>
              )}
            </AutocompleteList>
          </div>
          {!loading && !error && hasMore && (
            <Button
              variant="ghost"
              className="medication-more"
              onClick={() => setCursor(items.at(-1)!.id)}
            >
              Show more medications
            </Button>
          )}
        </AutocompletePopup>
      </Autocomplete>
    </div>
  );
}
