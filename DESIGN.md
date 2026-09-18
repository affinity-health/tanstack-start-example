---
name: Affinity EMR demo
description: A light desktop utility for reviewing and signing prescriptions.
colors:
  primary: "#0068d9"
  primary-foreground: "white"
  accent: "#e8f1fd"
  accent-foreground: "#004b9e"
  canvas: "#f5f5f7"
  surface: "white"
  patient-surface: "#fbfbfc"
  text: "#242426"
  muted-foreground: "#626269"
  input: "#d1d1d6"
  divider: "#e5e5e9"
  production-background: "#fff4e7"
  production-text: "#83430b"
  error-background: "#fff0ed"
  error-text: "#9b2515"
typography:
  headline:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "30px"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-0.03em"
  title:
    fontSize: "18px"
    fontWeight: 600
    letterSpacing: "-0.02em"
  body:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "14px"
    lineHeight: 1.5
  label:
    fontSize: "12px"
    fontWeight: 500
  code:
    fontFamily: "ui-monospace, monospace"
    fontSize: "12px"
    lineHeight: 1.65
rounded:
  control: "8px"
  workspace: "14px"
spacing:
  label: "8px"
  compact: "12px"
  field: "16px"
  panel: "24px"
  editor: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.control}"
    padding: "0 11px"
  button-outline:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "0 11px"
  input:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.control}"
  patient-panel:
    backgroundColor: "{colors.patient-surface}"
    padding: "26px 24px"
---

# Design System: Affinity EMR demo

## Overview

**Creative North Star: "Apple-like desktop utility"**

A light prescribing workspace with Coss controls, system typography, and space between tasks. Patient context stays beside the editor on desktop. Blue marks actions and focus; neutral backgrounds organize the form.

This document describes `src/styles.css`, `src/app.tsx`, and `src/components/ui`. Browser authentication failed during implementation, so visual appearance and responsive behavior have not been verified with screenshots.

**Key Characteristics:**

- Light gray canvas with a white editor and subtly tinted patient panel.
- Visible Test or Production context throughout the workflow.
- Compact controls with later steps revealed only when needed.

## Colors

Primary blue identifies actionable controls and keyboard focus. Pale blue supplies highlighted menu states. White and near-white backgrounds separate the toolbar, editor, and patient context without strong outlines.

Muted text supports labels and secondary details. Amber identifies Production notices; warm red identifies errors. Keep the words alongside status colors so the meaning does not depend on hue.

## Typography

Use the system sans stack for interface text and monospace for expandable request and response details. The page heading is the largest text; section titles sit below it, followed by body copy and small field labels. Patient names use 15px semibold text. At widths up to 760px, the page heading reduces to 26px.

Keep labels in sentence case. Use tabular numerals for medication defaults. Wrap long identifiers and error messages rather than widening the editor.

## Layout

The white toolbar is 68px tall. The main container has a 1120px maximum width, 24px side padding, and 48px vertical margins. A practice row spans the top of the workspace. It shows plain text for a single practice and a selector when several are available. Below it, a 300px patient panel sits beside the flexible prescribing editor.

Editor sections have 28px vertical padding and quiet dividing lines. Field rows use a 2:1 grid and 16px gaps. At widths up to 760px, the patient panel stacks above the editor, field rows become one column, outer padding reduces to 16px, and the footer stacks. The toolbar environment selector stays visible.

## Elevation & Depth

Use tonal separation and thin dividers for most hierarchy. The workspace has a faint shadow, `0 5px 24px #00000005`. Coss controls add small shadows and inset highlights; menus lift above the form. Avoid adding shadows to every section.

## Shapes

Controls and inline notices use the control radius. The workspace uses the larger radius around its outer corners. Internal section boundaries remain straight. The patient avatar is a 44px circle containing initials.

## Components

- Buttons use blue for primary actions, white outlined treatments for secondary actions, and a ghost icon button for more options. Default height is 36px below the Coss 640px breakpoint and 32px above it. Loading buttons disable interaction and show a centered spinner.
- Inputs and select triggers have pale gray borders and a 38px minimum height in this app. Coss focus states use blue borders and rings. Disabled controls reduce opacity; invalid fields use the destructive treatment.
- Select menus align below their triggers. Lists scroll within 360px or the available height, whichever is smaller. Highlighted options use the pale blue accent.
- The environment menu displays Test or Production with a dot and chevron. Switching environment clears the workflow. Production also displays a text notice above the workspace.
- The first screen contains patient selection, medication selection, and Preview prescription. The patient panel holds initials and identity; preview resolves the Affinity patient record without a separate setup action.
- Medication selection loads defaults automatically. Directions and days supply are the only optional edits, under Adjust prescription. Keep the defaults summary readable and omit preset pickers and JSON editors.
- A complete preview reveals Sign prescription. Continue to review saves the allergy review, registers the prescriber, and creates the draft. The draft then reveals Review and sign. Read-only technical details remain expandable.
- The workspace loads automatically. Status text occupies a reserved line; load failures provide an explicit retry. Signing remains a separate action after draft review and attestation.
- Global keyboard focus uses a 2px blue outline with 3px offset. Coss controls also define their own rings. Reduced-motion preferences disable animations and transitions.

## Do's and Don'ts

- Do use the existing Coss components for controls and menus.
- Do retain patient context and the visible environment selector.
- Do reveal prescriber and signing controls after a complete preview.
- Do keep optional prescription edits and technical details expandable.
- Don't add a connection ceremony or separate patient setup buttons.
- Don't restore preset pickers or a JSON editor.
- Don't add decorative dashboard cards to the prescribing workflow.
- Don't describe this code-derived document as screenshot-verified.
