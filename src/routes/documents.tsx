import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, FileCheck2, FileText, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { EmrSectionHeading, EmrShell, EmrStatus } from "../components/emr-shell";
import { demoDocuments } from "../lib/demo-data";
import { requireSession } from "../lib/require-session";

export const Route = createFileRoute("/documents")({
  beforeLoad: requireSession,
  head: () => ({
    meta: [{ title: "Documents | Northstar Health" }],
  }),
  component: Documents,
});

type DocumentCategory = "All" | (typeof demoDocuments)[number]["category"];

function Documents() {
  const { session } = Route.useRouteContext();
  const [category, setCategory] = useState<DocumentCategory>("All");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("doc_3");
  const [reviewedIds, setReviewedIds] = useState<string[]>([]);

  const filteredDocuments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return demoDocuments.filter((document) => {
      const matchesCategory = category === "All" || document.category === category;
      const matchesQuery =
        !normalizedQuery ||
        [document.name, document.patient, document.category]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  const selectedDocument =
    demoDocuments.find((document) => document.id === selectedId) ?? demoDocuments[0];
  const isReviewed = selectedDocument ? reviewedIds.includes(selectedDocument.id) : false;

  return (
    <EmrShell
      current="documents"
      description="Review patient forms, consents, and clinical files."
      session={session}
      title="Documents"
    >
      <div className="emr-document-layout">
        <section className="emr-panel">
          <EmrSectionHeading
            description={`${filteredDocuments.length} documents`}
            title="Patient documents"
          />
          <div className="emr-toolbar emr-toolbar-stack">
            <label className="emr-search">
              <Search aria-hidden size={16} />
              <span className="sr-only">Search documents</span>
              <input
                placeholder="Search patient or document"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <div className="emr-segmented emr-segmented-wide" aria-label="Document category">
              {(["All", "Intake", "Consent", "Labs"] as const).map((option) => (
                <button
                  aria-pressed={category === option}
                  className={category === option ? "is-active" : undefined}
                  key={option}
                  type="button"
                  onClick={() => setCategory(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {filteredDocuments.length ? (
            <div className="emr-document-list">
              {filteredDocuments.map((document) => (
                <button
                  aria-pressed={selectedDocument?.id === document.id}
                  className={selectedDocument?.id === document.id ? "is-selected" : undefined}
                  key={document.id}
                  type="button"
                  onClick={() => setSelectedId(document.id)}
                >
                  <span className="emr-document-icon">
                    <FileText aria-hidden size={17} />
                  </span>
                  <span>
                    <strong>{document.name}</strong>
                    <small>
                      {document.patient} · {document.updated}
                    </small>
                  </span>
                  <EmrStatus
                    tone={
                      reviewedIds.includes(document.id) || document.status === "Signed"
                        ? "success"
                        : "attention"
                    }
                  >
                    {reviewedIds.includes(document.id) ? "Reviewed" : document.status}
                  </EmrStatus>
                </button>
              ))}
            </div>
          ) : (
            <div className="emr-empty">
              <Search aria-hidden size={22} />
              <strong>No matching documents</strong>
              <span>Try a different search or category.</span>
              <button
                className="emr-button emr-button-secondary"
                type="button"
                onClick={() => {
                  setCategory("All");
                  setQuery("");
                }}
              >
                Clear filters
              </button>
            </div>
          )}
        </section>

        {selectedDocument ? (
          <aside className="emr-panel emr-document-preview">
            <div className="emr-preview-sheet" aria-hidden>
              <FileCheck2 size={30} />
              <span>Northstar Health</span>
              <strong>{selectedDocument.name}</strong>
              <small>Secure document preview</small>
            </div>
            <div className="emr-preview-copy">
              <span>{selectedDocument.category}</span>
              <h2>{selectedDocument.name}</h2>
              <p>{selectedDocument.summary}</p>
              <dl>
                <div>
                  <dt>Patient</dt>
                  <dd>{selectedDocument.patient}</dd>
                </div>
                <div>
                  <dt>Updated</dt>
                  <dd>{selectedDocument.updated}</dd>
                </div>
              </dl>
              <button
                className="emr-button emr-button-primary emr-button-full"
                disabled={isReviewed}
                type="button"
                onClick={() =>
                  setReviewedIds((current) => [...new Set([...current, selectedDocument.id])])
                }
              >
                <CheckCircle2 aria-hidden size={16} />
                {isReviewed ? "Reviewed" : "Mark as reviewed"}
              </button>
            </div>
          </aside>
        ) : null}
      </div>
    </EmrShell>
  );
}
