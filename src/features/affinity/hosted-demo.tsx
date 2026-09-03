import { ExternalLink, LoaderCircle, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { DemoCode } from "./demo-code";

type HostedSession = {
  expiresAt: string;
  id: string;
  url: string;
};

type LaunchPhase = "closed" | "creating" | "error" | "idle" | "open";

type HostedWorkflow = "prescription_composer" | "provider_verification";

export function HostedDemo({ workflow = "prescription_composer" }: { workflow?: HostedWorkflow }) {
  const providerSetup = workflow === "provider_verification";
  const popup = useRef<Window | null>(null);
  const [phase, setPhase] = useState<LaunchPhase>("idle");
  const [message, setMessage] = useState(
    "Affinity Test will open in a separate, focused browser window.",
  );

  useEffect(() => {
    if (phase !== "open") return;

    const interval = window.setInterval(() => {
      if (!popup.current || popup.current.closed) {
        popup.current = null;
        setPhase("closed");
        setMessage("The Affinity Test window was closed. Open a new session when you are ready.");
      }
    }, 500);

    return () => window.clearInterval(interval);
  }, [phase]);

  async function openHostedComposer() {
    if (popup.current && !popup.current.closed) {
      popup.current.focus();
      setMessage("The existing Affinity Test window is now in focus.");
      return;
    }

    const hostedWindow = window.open(
      "about:blank",
      providerSetup ? "affinity-provider-verification" : "affinity-prescription-composer",
      popupFeatures(),
    );
    if (!hostedWindow) {
      setPhase("error");
      setMessage("Your browser blocked the popup. Allow popups for this site and try again.");
      return;
    }

    popup.current = hostedWindow;
    try {
      hostedWindow.opener = null;
    } catch {
      // The parent retains its WindowProxy even if a browser protects the opener property.
    }
    renderLaunchingWindow(hostedWindow);
    setPhase("creating");
    setMessage("Creating a single-use Affinity Test session…");

    try {
      const response = await fetch("/api/affinity/hosted-session", {
        body: JSON.stringify({ flow: workflow }),
        credentials: "include",
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const body = await response.text();
      const result = parseHostedSession(body);

      if (!response.ok || !result) {
        throw new Error(
          readError(body) ?? `Affinity Test session request failed (HTTP ${response.status}).`,
        );
      }
      if (hostedWindow.closed) {
        throw new Error("The popup was closed before Affinity Test finished opening.");
      }

      hostedWindow.location.replace(result.url);
      hostedWindow.focus();
      setPhase("open");
      setMessage(
        providerSetup
          ? "Affinity Test is open in a separate window. Northstar cannot see the signing PIN."
          : "Affinity Test is open in a separate window. Close it when you finish prescribing.",
      );
    } catch (error) {
      if (!hostedWindow.closed) hostedWindow.close();
      popup.current = null;
      setPhase("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Affinity Test could not open the hosted workflow.",
      );
    }
  }

  return (
    <section className="affinity-hosted">
      <div className="affinity-hosted-copy">
        <span className="affinity-hosted-icon">
          <ExternalLink aria-hidden size={21} />
        </span>
        <div>
          <span>Affinity Test integration</span>
          <h2>
            {providerSetup
              ? "Verify the provider and set the signing PIN"
              : "Prescribe in a focused window"}
          </h2>
          <p>
            {providerSetup
              ? "Northstar creates a single-use provider-verification session. The provider sets or resets the signing PIN only inside Affinity Test."
              : "Northstar creates a single-use session on its backend. Affinity Test opens the complete workflow in a separate browser window without exposing the platform API key."}
          </p>
        </div>
      </div>

      <ol className="affinity-hosted-steps">
        <li>
          <span>1</span>
          <div>
            <strong>Open from this click</strong>
            <p>The window opens immediately so the browser does not block it.</p>
          </div>
        </li>
        <li>
          <span>2</span>
          <div>
            <strong>Validate delegated access</strong>
            <p>Affinity Test redeems and verifies the scoped session automatically.</p>
          </div>
        </li>
        <li>
          <span>3</span>
          <div>
            <strong>
              {providerSetup ? "Complete provider setup" : "Complete the prescription"}
            </strong>
            <p>
              {providerSetup
                ? "Verify the provider and save a six-digit signing PIN inside Affinity Test."
                : "Close the hosted window when the focused workflow is complete."}
            </p>
          </div>
        </li>
      </ol>

      <DemoCode title="View the Hosted SDK call">{`
const session = await affinity.hostedSessions.create({
  flow: "prescription_composer",
  practiceId,
  providerMappingId,
  userId,
});

window.open(session.url);`}</DemoCode>

      <div className="affinity-hosted-action">
        <div aria-live="polite" role={phase === "error" ? "alert" : "status"}>
          <ShieldCheck aria-hidden size={16} />
          <span>{message}</span>
        </div>
        <button
          className="emr-button emr-button-primary"
          disabled={phase === "creating"}
          type="button"
          onClick={openHostedComposer}
        >
          {phase === "creating" ? (
            <LoaderCircle aria-hidden className="spin" size={16} />
          ) : (
            <ExternalLink aria-hidden size={16} />
          )}
          {phase === "creating"
            ? "Opening Affinity Test…"
            : phase === "open"
              ? "Focus Affinity Test window"
              : providerSetup
                ? "Open provider setup"
                : "Open Affinity Test window"}
        </button>
      </div>
    </section>
  );
}

function popupFeatures() {
  const width = Math.max(360, Math.min(1_100, window.screen.availWidth - 48));
  const height = Math.max(560, Math.min(820, window.screen.availHeight - 72));
  const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - width) / 2));
  const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - height) / 2));

  return [
    "popup=yes",
    "resizable=yes",
    "scrollbars=yes",
    `width=${width}`,
    `height=${height}`,
    `left=${left}`,
    `top=${top}`,
  ].join(",");
}

function renderLaunchingWindow(target: Window) {
  const document = target.document;
  document.documentElement.lang = "en";
  document.title = "Opening Affinity Test";

  const style = document.createElement("style");
  style.textContent = `
    :root { color-scheme: light; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; color: #17211d; background: #f3f6f4; }
    main { width: min(100% - 40px, 420px); text-align: center; }
    span { display: grid; width: 42px; height: 42px; margin: 0 auto 18px; place-items: center; color: white; background: #0f766e; border-radius: 10px; font-weight: 800; }
    h1 { margin: 0; font-size: 22px; letter-spacing: -0.025em; }
    p { margin: 8px 0 0; color: #5c6a64; font-size: 13px; line-height: 1.55; }
  `;

  const main = document.createElement("main");
  const mark = document.createElement("span");
  mark.textContent = "A";
  const heading = document.createElement("h1");
  heading.textContent = "Opening Affinity Test";
  const copy = document.createElement("p");
  copy.textContent = "Creating a secure, single-use prescribing session…";
  main.appendChild(mark);
  main.appendChild(heading);
  main.appendChild(copy);
  document.head.appendChild(style);
  document.body.replaceChildren(main);
}

function parseHostedSession(body: string): HostedSession | null {
  try {
    const value: unknown = JSON.parse(body);
    if (
      typeof value === "object" &&
      value !== null &&
      "expiresAt" in value &&
      typeof value.expiresAt === "string" &&
      "id" in value &&
      typeof value.id === "string" &&
      "url" in value &&
      typeof value.url === "string"
    ) {
      return value as HostedSession;
    }
  } catch {
    return null;
  }
  return null;
}

function readError(body: string) {
  try {
    const value: unknown = JSON.parse(body);
    return typeof value === "object" &&
      value !== null &&
      "error" in value &&
      typeof value.error === "string"
      ? value.error
      : null;
  } catch {
    return null;
  }
}
