import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Stethoscope } from "lucide-react";
import { useState, type FormEvent } from "react";

import { authClient } from "../../lib/auth-client";

const demoClinician = {
  email: "clinician@northstar.demo",
  name: "Maya Chen, MD",
  password: "NorthstarDemo2026!",
};

export function AuthPage({ mode }: { mode: "login" | "signup" }) {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const isLogin = mode === "login";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    const form = new FormData(event.currentTarget);
    try {
      const result = isLogin
        ? await authClient.signIn.email({
            email: String(form.get("email")),
            password: String(form.get("password")),
          })
        : await authClient.signUp.email({
            email: String(form.get("email")),
            name: String(form.get("name")),
            password: String(form.get("password")),
          });

      if (result.error) {
        setError(
          result.error.message ?? `Unable to ${isLogin ? "sign in" : "create the account"}.`,
        );
        return;
      }
      await navigate({ to: "/dashboard" });
    } catch {
      setError("Northstar could not reach the server. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  async function useDemoClinician() {
    setError("");
    setPending(true);
    try {
      let signIn = await authClient.signIn.email({
        email: demoClinician.email,
        password: demoClinician.password,
      });

      if (signIn.error) {
        const signUp = await authClient.signUp.email(demoClinician);
        if (signUp.error) {
          signIn = await authClient.signIn.email({
            email: demoClinician.email,
            password: demoClinician.password,
          });
          if (signIn.error) {
            setError("The demo clinician is unavailable. Create an account to enter Northstar.");
            return;
          }
        }
      }
      await navigate({ to: "/dashboard" });
    } catch {
      setError("Northstar could not open the demo clinician. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-intro">
        <Link className="back-link" to="/">
          <ArrowLeft aria-hidden size={15} /> Back to Northstar
        </Link>
        <div>
          <span className="auth-clinic-mark" aria-hidden>
            <Stethoscope size={22} />
          </span>
          <p className="eyebrow">Northstar telehealth</p>
          <h1>{isLogin ? "Your clinic day starts here." : "Set up your clinic workspace."}</h1>
          <p>
            Search the medication marketplace, fill a patient cart, and review Test orders in one
            clinic workspace.
          </p>
        </div>
        <p className="auth-footnote">Demo environment. Synthetic patient data. Never Live.</p>
      </section>

      <section className="auth-form-wrap" aria-labelledby="auth-title">
        <div className="auth-form-stack">
          <form aria-busy={pending} className="auth-form" onSubmit={submit}>
            <div>
              <p className="eyebrow">Northstar clinic</p>
              <h2 id="auth-title">{isLogin ? "Sign in" : "Create account"}</h2>
            </div>

            {!isLogin ? (
              <label>
                Clinician name
                <input
                  name="name"
                  autoComplete="name"
                  disabled={pending}
                  required
                  minLength={2}
                  placeholder="Maya Chen, MD"
                />
              </label>
            ) : null}

            <label>
              Work email
              <input
                name="email"
                type="email"
                autoComplete="email"
                aria-describedby={error ? "auth-error" : undefined}
                disabled={pending}
                required
                placeholder="clinician@example.com"
              />
            </label>

            <label>
              Password
              <input
                name="password"
                type="password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                aria-describedby={error ? "auth-error" : undefined}
                disabled={pending}
                required
                minLength={8}
                placeholder="At least 8 characters"
              />
            </label>

            <p className="form-error" id="auth-error" role="alert">
              {error}
            </p>

            <button className="button button-dark submit-button" disabled={pending} type="submit">
              {pending ? "Opening Northstar" : isLogin ? "Sign in" : "Create account"}
            </button>
          </form>

          <div className="auth-demo-access">
            <span>Evaluating the example?</span>
            <button
              className="button auth-demo-button"
              disabled={pending}
              onClick={useDemoClinician}
              type="button"
            >
              {pending ? "Opening Northstar" : "Use demo clinician"}
            </button>
            <p>No setup required. Northstar creates a synthetic clinician account if needed.</p>
          </div>

          <p className="auth-switch">
            {isLogin ? "New to Northstar?" : "Already have an account?"}{" "}
            <Link to={isLogin ? "/signup" : "/login"}>
              {isLogin ? "Create an account" : "Sign in"}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
