import { createFileRoute } from "@tanstack/react-router";

import { AuthPage } from "../../features/auth/auth-page";

export const Route = createFileRoute("/(public)/signup")({
  head: () => ({ meta: [{ title: "Create account | Northstar" }] }),
  component: Signup,
});

function Signup() {
  return <AuthPage mode="signup" />;
}
