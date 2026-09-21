# Demo handoff

The canonical application is this repository. See [README.md](./README.md) for the public
Test flow, scope limits, secret names, and Alchemy deployment commands.

Target: https://demo-emr.joinaffinityai.com

This revision uses Better Auth anonymous sessions backed by D1, typed TanStack Start
server functions, TanStack Query, and real prescribing/order routes. The former custom
session cookie is not migrated. Existing Test practices remain in Affinity. It uses SDK 1.10.2 against the hosted Affinity API.
The UI supplies a synthetic NPI at signing and never binds a Live API key.

Historical private demos are not managed by this stack. Their earlier verification
records and webhook deliveries do not prove this deployment's behavior.
