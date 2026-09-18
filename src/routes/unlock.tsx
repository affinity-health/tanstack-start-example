import { createFileRoute } from "@tanstack/react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { unlock } from "../server/auth/session";

export const Route = createFileRoute("/unlock")({
  validateSearch: (search: Record<string, unknown>) => ({
    error: search.error === "pin" ? ("pin" as const) : undefined,
  }),
  headers: () => ({ "Cache-Control": "private, no-store" }),
  server: { handlers: { POST: ({ request }) => unlock(request) } },
  component: Unlock,
});

function Unlock() {
  const error = Route.useSearch().error === "pin";
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-80">
        <img
          src="https://cdn.joinaffinityai.com/logos/affinity/mark-blue.v2.webp"
          alt="Affinity"
          width={40}
          height={40}
          className="mb-8"
        />
        <h1 className="text-2xl font-semibold tracking-tight">Prescribing demo</h1>
        <p className="mt-2 text-sm text-muted-foreground">Enter your shared PIN to continue.</p>
        <form method="post" action="/unlock" className="mt-8 space-y-4">
          <div className="space-y-2">
            <label htmlFor="pin" className="text-sm font-medium">
              PIN
            </label>
            <Input
              id="pin"
              name="pin"
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              required
              maxLength={128}
              size="lg"
              className="has-focus-visible:ring-0"
              aria-invalid={error || undefined}
              aria-describedby={error ? "pin-error" : undefined}
            />
            {error && (
              <p id="pin-error" role="alert" className="text-sm text-destructive-foreground">
                That PIN didn’t match. Try again.
              </p>
            )}
          </div>
          <Button type="submit" size="lg" className="w-full">
            Continue
          </Button>
        </form>
      </div>
    </main>
  );
}
