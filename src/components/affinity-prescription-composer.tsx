import { AlertCircle, LoaderCircle, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type ComponentSession = {
  clientSecret: string;
  connectUrl: string;
  expiresAt: string;
};

type AffinityFrameMessage =
  | { source: "affinity"; type: "affinity.ready" }
  | { height: number; source: "affinity"; type: "affinity.resize" }
  | {
      event: { prescriptionId?: string; status?: string; type: string };
      source: "affinity";
      type: "affinity.event";
    };

export function AffinityPrescriptionComposer() {
  const container = useRef<HTMLDivElement>(null);
  const [attempt, setAttempt] = useState(0);
  const [phase, setPhase] = useState<"connected" | "error" | "loading">("loading");
  const [status, setStatus] = useState("Creating a secure Affinity session…");

  useEffect(() => {
    const target = container.current;
    if (!target) return;

    setPhase("loading");
    setStatus("Creating a secure Affinity session…");
    target.replaceChildren();

    let destroyed = false;
    let frame: HTMLIFrameElement | null = null;
    let clientSecret: string | null = null;
    let removeMessageListener: (() => void) | undefined;

    const start = async () => {
      const response = await fetch("/api/affinity/component-session", {
        method: "POST",
        credentials: "include",
      });
      const body = await response.text();
      let result: unknown;
      try {
        result = JSON.parse(body);
      } catch {
        throw new Error(
          response.ok
            ? "Affinity returned an invalid component session response."
            : `Affinity session request failed (HTTP ${response.status}).`,
        );
      }
      if (!response.ok || !isComponentSession(result)) {
        throw new Error(
          isErrorResponse(result) ? result.error : "Affinity session creation failed.",
        );
      }
      if (destroyed) return;

      clientSecret = result.clientSecret;
      const connectUrl = new URL(result.connectUrl);
      frame = document.createElement("iframe");
      frame.className = "affinity-frame";
      frame.src = new URL("/elements/prescription-composer", connectUrl).toString();
      frame.title = "Affinity prescription composer";
      frame.allow = "publickey-credentials-get; publickey-credentials-create";
      frame.referrerPolicy = "strict-origin";
      frame.sandbox.add(
        "allow-forms",
        "allow-popups",
        "allow-popups-to-escape-sandbox",
        "allow-same-origin",
        "allow-scripts",
      );

      const receiveMessage = (event: MessageEvent<unknown>) => {
        if (
          destroyed ||
          event.origin !== connectUrl.origin ||
          event.source !== frame?.contentWindow ||
          !isAffinityFrameMessage(event.data)
        ) {
          return;
        }
        if (event.data.type === "affinity.ready" && clientSecret) {
          frame.contentWindow?.postMessage(
            {
              clientSecret,
              parentOrigin: window.location.origin,
              source: "affinity-platform",
              type: "affinity.initialize",
            },
            connectUrl.origin,
          );
          clientSecret = null;
          setPhase("connected");
          setStatus("Secure component connected");
        }
        if (event.data.type === "affinity.resize") {
          const height = Math.ceil(event.data.height);
          if (Number.isFinite(height) && height >= 560 && height <= 2_400) {
            frame.style.height = `${height}px`;
          }
        }
        if (event.data.type === "affinity.event") {
          setStatus(event.data.event.type.replaceAll(".", " "));
        }
      };

      window.addEventListener("message", receiveMessage);
      removeMessageListener = () => window.removeEventListener("message", receiveMessage);
      target.replaceChildren(frame);
    };

    void start().catch((error: unknown) => {
      if (!destroyed) {
        setPhase("error");
        setStatus(error instanceof Error ? error.message : "Affinity session creation failed.");
      }
    });

    return () => {
      destroyed = true;
      clientSecret = null;
      removeMessageListener?.();
      frame?.remove();
    };
  }, [attempt]);

  return (
    <div>
      <p
        className={`affinity-status${phase === "error" ? " affinity-status-error" : ""}`}
        role={phase === "error" ? "alert" : "status"}
      >
        {status}
      </p>
      <div className="affinity-frame-wrap">
        <div className="affinity-frame-mount" ref={container} />
        {phase !== "connected" ? (
          <div className={`affinity-frame-state affinity-frame-state-${phase}`}>
            {phase === "loading" ? (
              <>
                <LoaderCircle aria-hidden="true" className="spin" size={24} />
                <strong>Opening Affinity securely</strong>
                <span>Creating a short-lived session for this provider and practice.</span>
              </>
            ) : (
              <>
                <AlertCircle aria-hidden="true" size={24} />
                <strong>Affinity could not open</strong>
                <span>{status}</span>
                <button
                  className="button button-dark affinity-retry"
                  type="button"
                  onClick={() => setAttempt((value) => value + 1)}
                >
                  <RotateCcw aria-hidden="true" size={15} />
                  Try again
                </button>
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function isComponentSession(value: unknown): value is ComponentSession {
  return (
    typeof value === "object" &&
    value !== null &&
    "clientSecret" in value &&
    typeof value.clientSecret === "string" &&
    "connectUrl" in value &&
    typeof value.connectUrl === "string" &&
    "expiresAt" in value &&
    typeof value.expiresAt === "string"
  );
}

function isErrorResponse(value: unknown): value is { error: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof value.error === "string"
  );
}

function isAffinityFrameMessage(value: unknown): value is AffinityFrameMessage {
  if (typeof value !== "object" || value === null) return false;
  if (!("source" in value) || value.source !== "affinity" || !("type" in value)) return false;
  return (
    value.type === "affinity.ready" ||
    (value.type === "affinity.resize" && "height" in value && typeof value.height === "number") ||
    (value.type === "affinity.event" &&
      "event" in value &&
      typeof value.event === "object" &&
      value.event !== null &&
      "type" in value.event &&
      typeof value.event.type === "string")
  );
}
