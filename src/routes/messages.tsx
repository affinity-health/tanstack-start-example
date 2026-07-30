import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare, Search, Send } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";

import { EmrShell } from "../components/emr-shell";
import { demoThreads, type DemoMessage } from "../lib/demo-data";
import { requireSession } from "../lib/require-session";

export const Route = createFileRoute("/messages")({
  beforeLoad: requireSession,
  head: () => ({
    meta: [{ title: "Messages | Northstar Health" }],
  }),
  component: Messages,
});

function Messages() {
  const { session } = Route.useRouteContext();
  const [activeThreadId, setActiveThreadId] = useState("thread_1");
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [messagesByThread, setMessagesByThread] = useState<Record<string, DemoMessage[]>>(() =>
    Object.fromEntries(demoThreads.map((thread) => [thread.id, thread.messages])),
  );

  const filteredThreads = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return demoThreads.filter(
      (thread) =>
        !normalizedQuery ||
        [thread.patient, thread.subject, thread.preview]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery),
    );
  }, [query]);

  const activeThread = demoThreads.find((thread) => thread.id === activeThreadId) ?? demoThreads[0];
  const activeMessages = activeThread ? (messagesByThread[activeThread.id] ?? []) : [];

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !activeThread) return;

    const message: DemoMessage = {
      author: "provider",
      body,
      id: `local_${Date.now()}`,
      time: "Just now",
    };

    setMessagesByThread((current) => ({
      ...current,
      [activeThread.id]: [...(current[activeThread.id] ?? []), message],
    }));
    setDraft("");
  }

  return (
    <EmrShell
      current="messages"
      description="Keep patient questions and clinical follow-up in one secure workspace."
      session={session}
      title="Messages"
    >
      <section className="emr-panel emr-messages">
        <aside className="emr-thread-list">
          <div className="emr-thread-list-heading">
            <div>
              <h2>Inbox</h2>
              <span>2 unread</span>
            </div>
            <label className="emr-search">
              <Search aria-hidden size={16} />
              <span className="sr-only">Search messages</span>
              <input
                placeholder="Search messages"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
          </div>

          <div className="emr-thread-buttons">
            {filteredThreads.map((thread) => (
              <button
                aria-pressed={activeThread?.id === thread.id}
                className={activeThread?.id === thread.id ? "is-selected" : undefined}
                key={thread.id}
                type="button"
                onClick={() => setActiveThreadId(thread.id)}
              >
                <span className="emr-person-avatar" aria-hidden>
                  {thread.patient
                    .split(" ")
                    .map((part) => part[0])
                    .join("")}
                </span>
                <span>
                  <strong>
                    {thread.patient}
                    {thread.unread ? <i aria-label="Unread" /> : null}
                  </strong>
                  <b>{thread.subject}</b>
                  <small>{thread.preview}</small>
                </span>
                <time>{thread.time}</time>
              </button>
            ))}
          </div>

          {filteredThreads.length === 0 ? (
            <div className="emr-empty emr-empty-compact">
              <Search aria-hidden size={20} />
              <strong>No matching messages</strong>
              <button className="emr-text-link" type="button" onClick={() => setQuery("")}>
                Clear search
              </button>
            </div>
          ) : null}
        </aside>

        {activeThread ? (
          <div className="emr-conversation">
            <header>
              <div>
                <span className="emr-person-avatar" aria-hidden>
                  {activeThread.patient
                    .split(" ")
                    .map((part) => part[0])
                    .join("")}
                </span>
                <span>
                  <strong>{activeThread.patient}</strong>
                  <small>{activeThread.subject}</small>
                </span>
              </div>
              <span>Patient conversation</span>
            </header>

            <div className="emr-message-stream" aria-live="polite">
              <div className="emr-message-date">Today</div>
              {activeMessages.map((message) => (
                <article className={`is-${message.author}`} key={message.id}>
                  <p>{message.body}</p>
                  <time>{message.time}</time>
                </article>
              ))}
            </div>

            <form className="emr-composer" onSubmit={sendMessage}>
              <label>
                <span className="sr-only">Reply to {activeThread.patient}</span>
                <textarea
                  placeholder={`Reply to ${activeThread.patient}`}
                  rows={2}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                />
              </label>
              <div>
                <span>Demo only · Messages are not sent</span>
                <button
                  className="emr-button emr-button-primary"
                  disabled={!draft.trim()}
                  type="submit"
                >
                  <Send aria-hidden size={15} />
                  Send
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="emr-empty">
            <MessageSquare aria-hidden size={22} />
            <strong>Select a conversation</strong>
            <span>Choose a patient message from the inbox.</span>
          </div>
        )}
      </section>
    </EmrShell>
  );
}
