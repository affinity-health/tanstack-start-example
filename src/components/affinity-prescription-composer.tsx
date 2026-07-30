import type { AffinityAppearance } from "@affinity-health/elements";
import { AffinityProvider, PrescriptionComposer } from "@affinity-health/elements/react";
import { AlertCircle, LoaderCircle, RotateCcw } from "lucide-react";
import { useCallback, useState } from "react";

type ComponentSession = {
  clientSecret: string;
  connectUrl: string;
  expiresAt: string;
};

const affinityConnectUrl = "https://connect-staging.joinaffinityai.com";
const affinityAppearance: AffinityAppearance = {
  theme: "light",
  variables: {
    borderRadius: "8px",
    colorBackground: "#ffffff",
    colorBorder: "#d9e2de",
    colorMutedText: "#66736d",
    colorPrimary: "#0f766e",
    colorPrimaryText: "#ffffff",
    colorSuccess: "#15803d",
    colorText: "#17211d",
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif',
  },
};

export function AffinityPrescriptionComposer() {
  const [attempt, setAttempt] = useState(0);
  const [phase, setPhase] = useState<"connected" | "error" | "loading">("loading");
  const [status, setStatus] = useState("Creating a secure Affinity session…");

  const fetchClientSecret = useCallback(async () => {
    const response = await fetch("/api/affinity/component-session", {
      credentials: "include",
      method: "POST",
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
      throw new Error(isErrorResponse(result) ? result.error : "Affinity session creation failed.");
    }
    if (result.connectUrl !== affinityConnectUrl) {
      throw new Error("Affinity returned an unexpected Connect URL.");
    }
    return result.clientSecret;
  }, []);

  const retry = () => {
    setPhase("loading");
    setStatus("Creating a secure Affinity session…");
    setAttempt((value) => value + 1);
  };

  return (
    <div>
      <p
        className={`affinity-status${phase === "error" ? " affinity-status-error" : ""}`}
        role={phase === "error" ? "alert" : "status"}
      >
        {status}
      </p>
      <div className="affinity-frame-wrap">
        <AffinityProvider
          appearance={affinityAppearance}
          connectUrl={affinityConnectUrl}
          fetchClientSecret={fetchClientSecret}
          key={attempt}
        >
          <PrescriptionComposer
            className="affinity-frame-mount"
            onDraftCreated={() => setStatus("Prescription draft created")}
            onLoadError={(error) => {
              setPhase("error");
              setStatus(error.message);
            }}
            onReady={() => {
              setPhase("connected");
              setStatus("Secure component connected");
            }}
            onSubmitted={() => setStatus("Prescription submitted")}
          />
        </AffinityProvider>
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
                <button className="button button-dark affinity-retry" onClick={retry} type="button">
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
