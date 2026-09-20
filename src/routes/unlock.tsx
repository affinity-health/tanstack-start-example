import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import { beginDemo } from "../api/auth/functions";

export const Route = createFileRoute("/unlock")({
  headers: () => ({ "Cache-Control": "private, no-store" }),
  component: Welcome,
});

function Welcome() {
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-96">
        <img
          src="https://cdn.joinaffinityai.com/logos/affinity/mark-blue.v2.webp"
          alt="Affinity"
          width={40}
          height={40}
          className="mb-8"
        />
        <h1 className="text-2xl font-semibold tracking-tight">Try the EMR demo</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Create a Test practice, choose a sample patient, and send a prescription to a simulated
          pharmacy. No account or API key needed.
        </p>
        <form
          className="mt-8 space-y-5"
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setError("");
            try {
              await beginDemo({ data: { synthetic: true } });
              await navigate({ to: "/prescribe" });
            } catch (cause) {
              setError(cause instanceof Error ? cause.message : "Unable to start demo.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <label className="demo-consent">
            <Checkbox
              checked={confirmed}
              onCheckedChange={setConfirmed}
              name="synthetic"
              value="yes"
              required
            />
            <span>
              I will use synthetic information only. These orders will not be filled or shipped.
            </span>
          </label>
          {error && (
            <p role="alert" className="text-sm text-destructive-foreground">
              {error}
            </p>
          )}
          <Button type="submit" size="lg" className="w-full" disabled={!confirmed || busy}>
            {busy ? "Creating your Test practice…" : "Start Test demo"}
          </Button>
          <p className="text-xs text-muted-foreground">Your private demo session lasts 12 hours.</p>
        </form>
      </div>
    </main>
  );
}
