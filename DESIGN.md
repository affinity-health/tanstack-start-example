---
name: Affinity Agent-Native Telehealth
description: Calm medication operations with an explicit human confirmation boundary.
colors:
  canvas: "#f5f8f7"
  surface: "#ffffff"
  surface-subtle: "#edf2f0"
  text-strong: "#15201c"
  text-body: "#273832"
  text-muted: "#4b5d56"
  border-default: "#cbd6d2"
  border-strong: "#9eaea8"
  clinical-accent: "#176b5f"
  clinical-accent-hover: "#10554b"
  clinical-accent-soft: "#e2efeb"
  clinical-accent-border: "#b9d3cb"
  success: "#216e4e"
  danger: "#a33a2b"
typography:
  heading:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif'
    fontSize: "2.625rem"
    fontWeight: 680
    lineHeight: 1.12
    letterSpacing: "-0.035em"
  title:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif'
    fontSize: "1.125rem"
    fontWeight: 680
    lineHeight: 1.3
  body:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif'
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif'
    fontSize: "0.75rem"
    fontWeight: 650
    lineHeight: 1.4
rounded:
  compact: "4px"
  control: "6px"
  panel: "10px"
  round: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.clinical-accent}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "14px 16px"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-strong}"
    rounded: "{rounded.control}"
    height: "44px"
  selected-row:
    backgroundColor: "{colors.clinical-accent-soft}"
    textColor: "{colors.text-strong}"
---

# Design System: Affinity Agent-Native Telehealth

## Overview

**Creative North Star: "The Medication Operations Desk"**

A clinician sits at a laptop in daylight, scans a completed visit, reviews an unsigned proposal,
and decides whether to hand it to Affinity for provider review. The interface is calm and precise:
fixed type sizes, cool neutral surfaces, compact workflow state, and no theatrical presentation.
Agent activity is ordinary operational evidence, not decoration.

**Key Characteristics:** one sans-serif family, a restrained clinical-teal accent, flat divided
workspaces, sharp content regions, 6px control corners, strong text contrast, and visible human
confirmation.

## Colors

Cool neutrals carry almost the entire interface. Clinical teal stays below ten percent of each
surface and identifies primary actions, current selections, focus, and verified workflow state.

**The One Accent Rule.** Do not introduce warm neutral backgrounds, orange, lime, gradients, or a
second brand accent. Semantic red and green appear only for errors and confirmed success.

**The Safety Legibility Rule.** Test, synthetic, and never-Live language uses readable body color;
it is never faded into low-contrast metadata.

## Typography

**UI Font:** the native system sans-serif stack, using regular, medium, and semibold weights.

The type system is fixed and operational. The page heading is 2.625rem on desktop and 2rem on
mobile; section titles are 1.125rem or 1rem; body copy is 1rem with a 65–75ch measure; labels and
table metadata are 0.75–0.875rem. Heading tracking never passes -0.035em. Do not use display serif,
fluid type, uppercase eyebrows, or monospaced type as decoration.

## Layout

Use a 1240px application shell with 24px desktop gutters and 15px mobile gutters. The public route
opens directly into the medication task: compact context, a five-step progress rail, agent status,
then a divided patient/proposal workspace. The clinical medication route uses the same sequence and
surface treatment. On narrow screens, the progress rail scrolls horizontally and the workspace
stacks in reading order without causing page-level horizontal overflow.

Spacing follows a 4px base scale. Related controls use 8–12px gaps; task groups use 16–24px; major
page transitions use 32–64px.

## Elevation & Depth

The product is flat. Canvas, white work surfaces, and one-pixel dividers establish hierarchy. Do not
use decorative shadows, blur, glass, taped notes, rotations, or texture. Focus rings are the only
intentional outer halo.

## Shapes

Content regions and workflow containers remain square. Inputs, buttons, compact icons, and status
controls use 6px corners. Circular geometry is reserved for progress markers, avatars, and status
dots. Pills are exceptional, not the default label shape.

## Components

The workflow progress rail shows complete, current, and locked stages without animation delay.
Patient rows use dividers and one quiet selected fill. Agent status is a standard toolbar row with a
capability statement and live registration state. The activity list records meaningful tool changes
with time and plain-language results. The unsigned proposal names the patient, eligibility, order
state, and next human action. In the clinical form, editing any field clears confirmation; only the
clinician control enables Test order creation.

Interactive transitions run for 160ms with `cubic-bezier(0.16, 1, 0.3, 1)` and affect only color,
border, opacity, or a one-pixel press transform. Reduced-motion mode makes them effectively instant.

## Do's and Don'ts

- Do make the active task, current stage, and next human action clear within two seconds.
- Do keep agent actions visible in the same state used by the clinician.
- Do preserve 44px touch targets, keyboard focus, live regions, and readable placeholders.
- Do show Affinity Test, synthetic data, and never-Live language near the workflow.
- Don't turn the public route into a marketing hero or code showcase.
- Don't use nested cards, badge piles, decorative metrics, or repeated icon tiles.
- Don't animate progress while the clinician is waiting to work.
- Don't use color where spacing, type weight, or a divider communicates the hierarchy.
