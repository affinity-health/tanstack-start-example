# WebMCP challenge scope

## MVP

The MVP is one complete clinician workflow on the Patients page:

1. A browser agent searches the synthetic patient directory.
2. The agent opens one matching patient in the visible UI.
3. The agent prepares a medication review by navigating to the existing Affinity integration
   showcase with the selected patient context.
4. In the authenticated workflow, the agent can inspect the hosted Affinity Test options and fill a
   draft from clinician-supplied details.
5. The clinician reviews the entire draft and must independently confirm before an unsigned Test
   order can be created. Signing remains inside Affinity.

The public implementation must call `document.modelContext.registerTool` directly. Each tool uses
JSON Schema, reuses the page's existing state transitions, and returns a concise result that names
what changed on screen.

## Definition of done

- The root repository has an open-source license GitHub can detect.
- The public source contains `document.modelContext.registerTool`.
- Unit tests cover tool input handling, patient matching, safety boundaries, and unsupported-browser
  behavior where practical.
- `bun run check` and `bun run build` pass from a clean install.
- Alchemy v2 deploys a non-production release stage with Affinity Test credentials only.
- The live URL is verified in desktop and mobile layouts.
- README and submission notes explain setup, tools, safety, architecture, test evidence, and the
  distinction between pre-existing work and challenge commits dated after August 25, 2026.
- A script and shot list support a public YouTube demo under three minutes. Uploading or publishing
  the video remains an external submission step unless credentials and explicit authority exist.

## Existing work

Commit `f55eedef7c8833f15dad335c23ba8f29bb521835` is the challenge baseline. It predates August 25,
2026 and contains the TanStack Start workspace, Affinity Test integrations, authentication, webhook
handling, and Alchemy v2 infrastructure.

Challenge work begins on branch `webmcp-challenge`. Its dated commits add the WebMCP tools,
agent-visible UI state, tests, deployment evidence, license, and submission documents.

## Publication flags

- Root MIT license: published on the public `webmcp-challenge` branch; GitHub detection is verified
  separately in the submission checklist.
- Live demo: incomplete until a non-production Alchemy v2 URL is deployed and checked.
- YouTube video: incomplete until a public, under-three-minute URL exists.
- Devpost submission: incomplete until the live URL, repository URL, and video URL are entered.
