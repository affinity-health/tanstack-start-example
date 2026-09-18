# Affinity EMR demo

A small local website and API for a developer testing the Affinity TypeScript SDK, with an independent `bun run example` entry point.

The core task is selecting an EMR patient, creating or reusing their Affinity record, choosing medication defaults, previewing, and signing with an NPI. Both Test and Production use the EMR's patient records. The shipped records are explicitly synthetic examples and should be replaced for real prescribing.

The website loads automatically. The environment is always visible and switching clears the workflow. Credentials stay on the server, with separate keys for each environment. Signing is an explicit action after reviewing a draft; this demo does not submit orders to a pharmacy.

Design direction: a restrained Apple-like desktop utility, Coss controls, generous separation between tasks, and plain language. No connection ceremony or decorative dashboard content.

The first screen should contain only patient, medication, and Preview. Load medication defaults on selection. Keep directions and days supply under Adjust prescription; show prescriber fields only after a complete preview. Patient resolution happens as part of preview; allergy review, prescriber registration, and draft creation happen under Continue to review. Do not reintroduce separate setup buttons or a JSON editor.
