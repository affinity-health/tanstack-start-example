import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "@phosphor-icons/react";
import { useState, type FormEvent } from "react";

import { authClient } from "../../lib/auth-client";

export const Route = createFileRoute("/(public)/login")({
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));

    try {
      const result =
        mode === "sign-up"
          ? await authClient.signUp.email({
              email,
              password,
              name: String(form.get("name")),
            })
          : await authClient.signIn.email({ email, password });

      if (result.error) {
        setError(result.error.message ?? "Unable to sign in. Check your details and try again.");
        return;
      }

      await navigate({ to: "/dashboard" });
    } catch {
      setError("Unable to reach the server. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-intro">
        <Link className="back-link" to="/">
          <ArrowLeft size={15} /> Back home
        </Link>
        <div>
          <p className="eyebrow">Northstar demo workspace</p>
          <h1>
            Test Affinity.
            <br />
            End to end.
          </h1>
          <p>
            Sign in as a platform user to compare embedded, hosted, and headless prescribing with
            practice owned Test billing.
          </p>
        </div>
        <p className="auth-footnote">Test mode / Synthetic patient data only</p>
      </section>

      <section className="auth-form-wrap">
        <form className="auth-form" onSubmit={submit}>
          <div>
            <p className="eyebrow">{mode === "sign-in" ? "Welcome back" : "Start here"}</p>
            <h2>{mode === "sign-in" ? "Sign in" : "Create your account"}</h2>
          </div>

          {mode === "sign-up" ? (
            <label>
              Name
              <input
                name="name"
                autoComplete="name"
                required
                minLength={2}
                placeholder="Ada Lovelace"
              />
            </label>
          ) : null}

          <label>
            Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              aria-describedby={error ? "auth-error" : undefined}
              required
              placeholder="you@example.com"
            />
          </label>

          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
              aria-describedby={error ? "auth-error" : undefined}
              required
              minLength={8}
              placeholder="At least 8 characters"
            />
          </label>

          <p className="form-error" id="auth-error" role="alert">
            {error}
          </p>

          <button className="button button-dark submit-button" disabled={pending} type="submit">
            {pending ? "Working" : mode === "sign-in" ? "Sign in" : "Create account"}
          </button>

          <button
            className="mode-switch"
            type="button"
            onClick={() => {
              setError("");
              setMode(mode === "sign-in" ? "sign-up" : "sign-in");
            }}
          >
            {mode === "sign-in"
              ? "Need an account? Create one"
              : "Already have an account? Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
