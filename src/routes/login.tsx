import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { useState, type FormEvent } from "react";

import { authClient } from "../lib/auth-client";

export const Route = createFileRoute("/login")({
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

    const result =
      mode === "sign-up"
        ? await authClient.signUp.email({
            email,
            password,
            name: String(form.get("name")),
          })
        : await authClient.signIn.email({ email, password });

    setPending(false);

    if (result.error) {
      setError(result.error.message ?? "Something went wrong.");
      return;
    }

    await navigate({ to: "/dashboard" });
  }

  return (
    <main className="auth-page">
      <section className="auth-intro">
        <Link className="back-link" to="/">
          <ArrowLeft size={15} /> Back home
        </Link>
        <div>
          <p className="eyebrow">Better Auth</p>
          <h1>
            One door.
            <br />
            Properly locked.
          </h1>
          <p>
            Email and password authentication with server-managed sessions. No auth abstraction
            layered on top of the auth abstraction.
          </p>
        </div>
        <p className="auth-footnote">Sessions are stored in Cloudflare D1.</p>
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
              required
              minLength={8}
              placeholder="At least 8 characters"
            />
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <button className="button button-dark submit-button" disabled={pending} type="submit">
            {pending ? <LoaderCircle className="spin" size={18} /> : null}
            {mode === "sign-in" ? "Sign in" : "Create account"}
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
