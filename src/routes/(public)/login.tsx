import { createFileRoute } from "@tanstack/react-router";

import { AuthPage } from "../../features/auth/auth-page";

export const Route = createFileRoute("/(public)/login")({
  head: () => ({ meta: [{ title: "Sign in | Northstar" }] }),
  component: Login,
});

function Login() {
  return <AuthPage mode="login" />;
}
